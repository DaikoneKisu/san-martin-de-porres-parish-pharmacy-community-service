import tls from "tls";
import ky from "ky";
import { ApiError, ErrorCodes } from "./errors.js";
import { BCV_HOST } from "./constants.js";
import { X509Certificates, X509Certificate } from "@peculiar/x509";

const AIA_OID = "1.3.6.1.5.5.7.1.1";

let isBroken = false;
let lastError: ApiError | null = null;
let updatePromise: Promise<{ success: boolean; error?: ApiError }> | null = null;
let caBundleInMemory: string[] | null = null;

export const getStatus = (): { isTrustValid: boolean; lastError: ApiError | null } => ({
  isTrustValid: !isBroken,
  lastError,
});

export function hasCaBundleLoaded(): boolean {
  return caBundleInMemory !== null;
}

export function getCaBundle(): string[] {
  const systemCas = [...tls.rootCertificates]; //TODO: change to tls.getCACertificates() once we upgrade to, at least, Node 22.15.0
  if (!caBundleInMemory) return systemCas;
  return [...caBundleInMemory, ...systemCas];
}

// ky instance that injects the CA bundle on every request via Bun's native tls option.
// getCaBundle() is called per-request so the hot-swapped bundle is always used.
export const bcvKy = ky.create({
  fetch: (input: Request | string | URL, init?: RequestInit) =>
    fetch(input, { ...init, tls: { ca: getCaBundle() } } as BunFetchRequestInit),
});

function getKnownFingerprints(): string[] {
  const fps = (process.env.KNOWN_FINGERPRINTS ?? "")
    .split(",")
    .map((fp) => fp.trim().toUpperCase())
    .filter((fp) => fp.length > 0);
  if (fps.length === 0)
    throw new Error("KNOWN_FINGERPRINTS environment variable is not set or is empty.");
  return fps;
}

function extractAiaUrl(cert: X509Certificate): string | null {
  const aiaExtension = cert.extensions.find((ext) => ext.type === AIA_OID);
  if (!aiaExtension) return null;
  const value = aiaExtension.toString();
  const match = value.match(/https?:\/\/[^ ]+\.(?:crt|p7c)/i);
  return match ? match[0] : null;
}

async function getServerCert(host: string): Promise<X509Certificate> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port: 443, rejectUnauthorized: false, minVersion: "TLSv1.2" },
      () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();
        if (cert?.raw) {
          resolve(new X509Certificate(cert.raw));
        } else {
          reject(new Error("Could not retrieve server certificate."));
        }
      },
    );
    socket.on("error", reject);
  });
}

async function getFingerprint256(cert: X509Certificate): Promise<string> {
  const thumbprint = await cert.getThumbprint("SHA-256");
  return Buffer.from(thumbprint)
    .toString("hex")
    .toUpperCase()
    .match(/.{1,2}/g)!
    .join(":");
}

async function fetchFullChain(url: string, chain: string[] = []): Promise<string[]> {
  console.log(`[Trust] Descargando eslabón: ${url}`);
  // rejectUnauthorized: false because we're downloading intermediate certs before trust is established
  const response = await fetch(url, {
    tls: { rejectUnauthorized: false },
  } as BunFetchRequestInit);
  const buffer = Buffer.from(await response.arrayBuffer());

  let certs: X509Certificate[] = [];

  try {
    certs = [new X509Certificate(buffer)];
  } catch {
    try {
      const collection = new X509Certificates(buffer);
      certs = Array.from(collection);
    } catch {
      console.warn(`[Trust] Formato no reconocido para ${url}. Deteniendo.`);
      return chain;
    }
  }

  for (const cert of certs) {
    const pem = cert.toString("pem");
    if (!chain.includes(pem)) {
      chain.push(pem);

      if (cert.subject !== cert.issuer) {
        const nextAia = extractAiaUrl(cert);
        if (nextAia) await fetchFullChain(nextAia, chain);
      }
    }
  }

  return chain;
}

export async function updateTrust(
  force = false,
): Promise<{ success: boolean; error?: ApiError }> {
  // Semáforo: evita descargas de certificado concurrentes bajo carga
  if (updatePromise) return updatePromise;

  updatePromise = (async () => {
    try {
      console.log(force ? "[Trust] Forzando actualización..." : "[Trust] Actualizando cadena de certificados...");

      const knownFingerprints = getKnownFingerprints();

      const bcvCert = await getServerCert(BCV_HOST);
      const leafPem = bcvCert.toString("pem");

      const initialAiaUrl =
        extractAiaUrl(bcvCert) ??
        "https://sectigo.tbs-certificats.com/SectigoPublicServerAuthenticationCADVR36.crt";

      const intermediatePems = await fetchFullChain(initialAiaUrl);

      const firstIntermediate = new X509Certificate(intermediatePems[0]!);
      const fingerprint = await getFingerprint256(firstIntermediate);

      if (!fingerprint || !knownFingerprints.includes(fingerprint)) {
        isBroken = true;
        lastError = new ApiError(
          `Unauthorized fingerprint for bcv detected: ${fingerprint}`,
          ErrorCodes.FINGERPRINT_UNAUTHORIZED_ERROR,
        );
        return { success: false, error: lastError };
      }

      // Hot swap: store the full chain in memory so bcvKy picks it up on the next request
      caBundleInMemory = [leafPem, ...intermediatePems];

      isBroken = false;
      lastError = null;
      console.log(`[Trust] Hot Swap exitoso. Fingerprint: ${fingerprint}`);

      return { success: true };
    } catch (e: unknown) {
      isBroken = true;
      lastError = new ApiError(
        e instanceof Error ? e.message : "Unknown error",
        ErrorCodes.UNKNOWN_ERROR,
        e,
      );
      return { success: false, error: lastError };
    } finally {
      updatePromise = null;
    }
  })();

  return updatePromise;
}
