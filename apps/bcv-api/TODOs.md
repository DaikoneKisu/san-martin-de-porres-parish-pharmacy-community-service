# bcv-api — TODOs y notas de migración

## Migración de Express a Elysia

- [ ] Eliminar dependencias `express`, `morgan` y sus tipos. El routing y logging los maneja Elysia.
- [ ] Reemplazar el endpoint `GET /exchange-rates/usd` usando `app.get(...)` de Elysia en lugar de Express.
- [ ] Convertir el middleware `checkBcvTrust` en un `onBeforeHandle` o `derive` de Elysia.
- [ ] Reemplazar `sendHttpErrorResponse` (acoplado a `res: Response` de Express) por el sistema de errores de Elysia:
  - Usar el helper `error()` de Elysia, o
  - Definir un plugin de manejo de errores global con `app.onError(...)` que mapee `ApiError.code` a códigos HTTP.
- [ ] Mantener `ky` como cliente HTTP — no tiene dependencia de Express.
- [ ] Revisar el `TODO` sobre `tls.getCACertificates()`:
  - Actualmente usa `tls.rootCertificates` por compatibilidad.
  - Actualizar a `tls.getCACertificates()` una vez que el entorno de Bun/Node usado en producción sea >= Node 22.15.0.

## Caché de la tasa de cambio

- [ ] Añadir caché en memoria con TTL configurable dentro del paquete `bcv-api`.
  - Estructura sugerida: `{ rate: number, fetchedAt: Date } | null`
  - Antes de hacer scraping, comparar `Date.now() - fetchedAt` contra el TTL (sugerido: 4 horas).
  - Exponer el TTL como parámetro de configuración al inicializar el cliente.
  - Beneficio: el `api` de Elysia puede llamar a `bcv-api` libremente sin preocuparse por rate limiting del BCV.

## Notas de diseño a preservar

- **Semáforo en `updateTrust`:** El patrón de `updatePromise` previene descargas de certificado concurrentes bajo carga. Debe mantenerse tal cual.
- **AIA Chasing (`fetchFullChain`):** Sigue la cadena de certificados automáticamente. Es la solución correcta al problema del BCV que no incluye certificados intermedios en su handshake TLS.
- **Validación por fingerprint (`KNOWN_FINGERPRINTS`):** Verificar el fingerprint del primer certificado intermedio antes de confiar en la cadena descargada. Variable de entorno obligatoria. Mantener este mecanismo de seguridad.
- **Hot Swap:** `injectIntoGlobalAgent` + `setNativeTrust` (undici) permite actualizar certificados en caliente sin reiniciar el servidor. Mantener.

## Estructura en el monorepo

```
apps/
└── bcv-api/
    ├── src/
    │   ├── constants.ts
    │   ├── errors.ts
    │   ├── get-bcv-dollar-exchange-rate.ts   ← añadir caché aquí
    │   ├── guards.ts
    │   ├── trust-manager.ts
    │   └── index.ts                          ← exports públicos del paquete
    └── package.json
```

El `main.ts` de Express no se migra — su equivalente es el plugin/router que registre el endpoint en `apps/api/`.