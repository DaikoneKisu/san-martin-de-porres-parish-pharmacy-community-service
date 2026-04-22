# bcv-api — TODOs de migración a paquete

El objetivo es convertir `bcv-api` de una app Express independiente a un paquete interno
puro (`packages/bcv-api`) sin ningún framework HTTP. Toda la lógica de servidor vive en
`apps/api`.

## Eliminar la capa de Express

- [ ] Eliminar dependencias `express`, `morgan` y sus tipos de `package.json`.
- [ ] Eliminar `main.ts` — el servidor HTTP no se migra al paquete. Su equivalente es un
  plugin o router registrado directamente en `apps/api` que llame a las funciones del paquete.
- [ ] Eliminar `sendHttpErrorResponse` de `errors.ts` — está acoplado a `res: Response` de
  Express y no tiene lugar en una librería. El mapeo de `ApiError.code` a códigos HTTP es
  responsabilidad de `apps/api`.
- [ ] Eliminar el middleware `checkBcvTrust` de `main.ts` — su equivalente en `apps/api`
  será un `onBeforeHandle` o `derive` de Elysia que consulte `getStatus()` del paquete.
- [ ] Mantener `ky` como cliente HTTP — no tiene dependencia de Express.

## Añadir caché de la tasa de cambio

- [ ] Añadir caché en memoria con TTL configurable en `get-bcv-dollar-exchange-rate.ts`.
  - Estructura: `{ rate: number, fetchedAt: Date } | null`
  - Antes de hacer scraping, comparar `Date.now() - fetchedAt` contra el TTL.
  - Exponer el TTL como parámetro opcional (default: 4 horas según `config.json`).
  - Beneficio: `apps/api` puede llamar al paquete libremente sin preocuparse por rate
    limiting del BCV.

## Exponer la API pública del paquete

- [ ] Crear `src/index.ts` con los exports públicos:
  - `getBcvDollarExchangeRate` (con caché)
  - `ApiError`, `ErrorCodes`
  - `getStatus` (para que `apps/api` pueda consultar si el servicio BCV está disponible)
  - Tipos de retorno necesarios

## Pendientes técnicos a preservar

- [ ] Revisar el `TODO` sobre `tls.getCACertificates()`:
  - Actualmente usa `tls.rootCertificates` por compatibilidad.
  - Actualizar a `tls.getCACertificates()` una vez que el entorno de Bun en producción
    sea >= Node 22.15.0.

## Adaptar el mecanismo de inyección de CAs para Bun

La versión original usa dos mecanismos para inyectar la cadena de CAs tras descargarla:

- `injectIntoGlobalAgent` — modifica `https.globalAgent.options.ca` del módulo `https` de Node.
- `setNativeTrust` — crea un `Agent` de `undici` y lo establece como `setGlobalDispatcher`.

**Ambos deben eliminarse.** Bun no usa `undici` como dispatcher — `setNativeTrust` no tiene efecto. La efectividad de `https.globalAgent` en Bun tampoco está garantizada para requests de `ky`.

La solución correcta para Bun es crear una instancia de `ky` con un `fetch` customizado que inyecte el CA bundle en cada request mediante la opción `tls` nativa de Bun:

```
export const bcvKy = ky.create({
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      tls: { ca: getCaBundle() }, // opción específica de Bun
    }),
});
```

- `getCaBundle()` retorna el CA bundle actual en memoria (PEM string o string[]).
- Como el CA bundle se actualiza en memoria tras el AIA chasing, cada request usará automáticamente el bundle más reciente — equivalente al hot swap anterior sin undici ni https.globalAgent.
- Reemplazar todos los usos de `ky(...)` en `get-bcv-dollar-exchange-rate.ts` con `bcvKy(...)`.
- Para el fetch de AIA chasing en `trust-manager.ts` (que descarga los certificados intermedios), pasar `tls: { rejectUnauthorized: false }` en ese request específico, igual que hace el `https.request` original con `rejectUnauthorized: false`.

## Notas de diseño a preservar (no modificar)

- **Semáforo en `updateTrust`:** El patrón de `updatePromise` previene descargas de
  certificado concurrentes bajo carga. Mantener tal cual.
- **AIA Chasing (`fetchFullChain`):** Sigue la cadena de certificados automáticamente.
  Es la solución correcta al problema del BCV que no incluye certificados intermedios en
  su handshake TLS. Mantener tal cual.
- **Validación por fingerprint (`KNOWN_FINGERPRINTS`):** Verificar el fingerprint del
  primer certificado intermedio antes de confiar en la cadena descargada. Leída por
  `apps/api` como variable de entorno y pasada al paquete en la inicialización. Mantener.

## Estructura final en el monorepo

```
packages/
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