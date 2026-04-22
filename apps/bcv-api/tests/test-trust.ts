import * as https from 'node:https';
import tls from 'node:tls';
import ky from 'ky';
import { updateTrust } from '../src/trust-manager.js';
import { BCV_HOST } from '../src/constants.js';

async function runTest() {
  console.log('--- Iniciando Prueba de Integridad de Trust ---');

  // 1. Ejecutar actualización inicial
  const { success, error } = await updateTrust(true);
  if (!success) {
    console.error('❌ Falló la actualización inicial:', error);
    return;
  }

  // 2. Validar pool de certificados
  const caPool = https.globalAgent.options.ca as string[];
  const systemCas = tls.getCACertificates();

  console.log(`[Check] CAs del Sistema: ${systemCas.length}`);
  console.log(`[Check] CAs en GlobalAgent: ${caPool?.length || 0}`);

  if (caPool.length > systemCas.length) {
    console.log('✅ El certificado del BCV se fusionó correctamente.');
  } else {
    console.error('❌ El pool de certificados no parece incluir el extra del BCV.');
  }

  // 3. Prueba de conexión cruzada
  try {
    console.log('\n--- Probando conexiones simultáneas ---');

    const [bcvRes, googleRes] = await Promise.allSettled([
      ky.get(`https://${BCV_HOST}`, { timeout: 5000 }).text(),
      ky.get('https://www.google.com', { timeout: 5000 }).text()
    ]);

    if (bcvRes.status === 'fulfilled') {
      console.log('✅ Conexión segura al BCV: OK');
    } else {
      console.error('❌ Conexión al BCV falló:', bcvRes.reason.message);
      console.log(bcvRes.reason)
    }

    if (googleRes.status === 'fulfilled') {
      console.log('✅ Conexión a Google (Sistema CA): OK');
    } else {
      console.error('❌ Conexión a Google falló. Se rompió el pool del sistema.');
    }

  } catch (err) {
    console.error('Error inesperado durante la prueba:', err);
  }
}

runTest();
