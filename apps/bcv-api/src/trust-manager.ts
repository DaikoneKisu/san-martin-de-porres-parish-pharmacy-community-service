import { writeFileSync, readFileSync, existsSync } from 'fs';
import * as https from 'https';
import tls from 'tls';
import ky from 'ky';
import { ApiError, ErrorCodes } from './errors.js';
import { BCV_HOST, CA_FILE } from './constants.js';
import { X509Certificates, X509Certificate } from '@peculiar/x509';
import { Agent, setGlobalDispatcher } from 'undici';

const KNOWN_FINGERPRINTS = (process.env.KNOWN_FINGERPRINTS ?? '')
  .split(',')
  .map(fp => fp.trim().toUpperCase())
  .filter(fp => fp.length > 0);

if (KNOWN_FINGERPRINTS.length === 0) {
  throw new Error("KNOWN_FINGERPRINTS environment variable is not set or is empty.");
}

const AIA_OID = "1.3.6.1.5.5.7.1.1"

let isBroken = false;
let lastError: ApiError | null = null;
let updatePromise: Promise<{ success: boolean; error?: ApiError }> | null = null;

export const getStatus = (): { isTrustValid: boolean; lastError: ApiError | null } => ({ isTrustValid: !isBroken, lastError });

function extractAiaUrl(cert: X509Certificate): string | null {
  const aiaExtension = cert.extensions.find(ext => ext.type === AIA_OID);
  if (!aiaExtension) return null;

  const value = aiaExtension.toString();
  const match = value.match(/https?:\/\/[^ ]+\.(?:crt|p7c)/i);

  return match ? match[0] : null;
}

async function getServerCert(host: string): Promise<X509Certificate> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: 443,
      method: 'HEAD',
      rejectUnauthorized: false, // Solo para obtener el cert, no para confiar
      agent: new https.Agent({ maxCachedSessions: 0 })
    };

    const req = https.request(options, (res) => {
      const cert = (res.socket as any).getPeerCertificate();
      res.resume();
      if (cert && cert.raw) {
        resolve(new X509Certificate(cert.raw));
      } else {
        reject(new Error('Could not retrieve server certificate.'));
      }
    });

    req.on('error', reject);
    req.end();
  });
}

async function getFingerprint256(cert: X509Certificate): Promise<string> {
  const thumbprint = await cert.getThumbprint("SHA-256");

  return Buffer.from(thumbprint)
    .toString("hex")
    .toUpperCase()
    .match(/.{1,2}/g)!
    .join(":")
}

async function fetchFullChain(url: string, chain: string[] = []): Promise<string[]> {
  console.log(`[Trust] Descargando eslabón: ${url}`);
  const response = await ky.get(url).arrayBuffer();
  const buffer = Buffer.from(response);

  let certs: X509Certificate[] = [];

  try {
    certs = [new X509Certificate(buffer)];
  } catch {
    try {
      const collection = new X509Certificates(buffer);
      certs = Array.from(collection);
    } catch (e) {
      console.warn(`[Trust] Formato no reconocido para ${url}. Deteniendo.`);
      return chain;
    }
  }

  for (const cert of certs) {
    const pem = cert.toString("pem");
    if (!chain.includes(pem)) {
      chain.push(pem);

      // AIA Chasing: Si no es raíz, buscamos el siguiente
      if (cert.subject !== cert.issuer) {
        const nextAia = extractAiaUrl(cert);
        if (nextAia) await fetchFullChain(nextAia, chain);
      }
    }
  }

  return chain;
}

function shouldUpdate(): boolean {
  if (!existsSync(CA_FILE)) return true;
  try {
    const cert = new X509Certificate(readFileSync(CA_FILE));
    const expiryDate = cert.notAfter;
    const daysToExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysToExpiry < 15;
  } catch {
    return true;
  }
}

export async function updateTrust(force = false): Promise<{ success: boolean; error?: ApiError }> {
  // Semáforo para evitar descargas simultáneas bajo carga
  if (updatePromise) return updatePromise;

  updatePromise = (async () => {
    if (!force && !shouldUpdate()) {
      injectIntoGlobalAgent();
      return { success: true };
    }

    try {
      console.log(force ? '[Trust] Forzando actualización...' : '[Trust] Certificado por expirar o inexistente. Actualizando...');

      const bcvCert = await getServerCert(BCV_HOST);
      const leafPem = bcvCert.toString("pem");

      const initialAiaUrl = extractAiaUrl(bcvCert) || 'https://sectigo.tbs-certificats.com/SectigoPublicServerAuthenticationCADVR36.crt';

      const intermediatePems = await fetchFullChain(initialAiaUrl);

      const firstIntermediate = new X509Certificate(intermediatePems[0]!);

      const fingerprint = await getFingerprint256(firstIntermediate);

      if (!fingerprint || !KNOWN_FINGERPRINTS.includes(fingerprint)) {
        isBroken = true;
        lastError = new ApiError(`Unauthorized fingerprint for bcv detected: ${fingerprint}`, ErrorCodes.FINGERPRINT_UNAUTHORIZED_ERROR);
        return { success: false, error: lastError };
      }

      // Guardar como PEM nativo y aplicar Hot Swap
      const chainPem = [leafPem, ...intermediatePems].join('\n'); // Si bien no es 100% necesario guardar el full chain, lo hacemos para facilitar despliegues futuros en entornos más minimalistas
      writeFileSync(CA_FILE, chainPem);
      injectIntoGlobalAgent(chainPem);
      setNativeTrust();

      isBroken = false;
      console.log(`[Trust] Hot Swap exitoso. Fingerprint: ${fingerprint}`);

      return { success: true };

    } catch (e: any) {
      isBroken = true;
      lastError = new ApiError(e.message, ErrorCodes.UNKNOWN_ERROR, e);
      return { success: false, error: lastError };
    } finally {
      updatePromise = null; // Liberar el semáforo
    }
  })();

  return updatePromise;
}

export function getCaBundle(): string[] {
  const bcvChainPem = readFileSync(CA_FILE, 'utf8');
  const bcvIndividualCerts = bcvChainPem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
  return [...bcvIndividualCerts, ...tls.rootCertificates]; //TODO: change to tls.getCACertificates() once we upgrade to, at least, node 22.15.0
}

export function setNativeTrust() {
  const dispatcher = new Agent({
    connect: {
      ca: getCaBundle(),
    },
  });

  setGlobalDispatcher(dispatcher);
}

function injectIntoGlobalAgent(pemContent?: string) {
  try {
    const bcvChainPem = pemContent || readFileSync(CA_FILE, 'utf8');
    const systemCas = tls.rootCertificates; //TODO: change to tls.getCACertificates() once we upgrade to, at least, node 22.15.0

    const bcvIndividualCerts = bcvChainPem
      .match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];

    https.globalAgent.options.ca = [
      ...bcvIndividualCerts,
      ...systemCas
    ];

    console.log(`[Trust] Agente Global actualizado con ${bcvIndividualCerts.length} certs del BCV y ${systemCas.length} del sistema.`);
  } catch (e) {
    console.error('[Trust] Error inyectando certificados.', e);
  }
}


// Carga inicial
if (existsSync(CA_FILE)) {
  injectIntoGlobalAgent();
  setNativeTrust();
}