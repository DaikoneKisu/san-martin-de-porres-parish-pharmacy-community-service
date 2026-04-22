# @sanmart/bcv-api

Paquete interno que obtiene la tasa de cambio oficial USD/VES desde el portal del Banco Central de Venezuela (BCV) mediante scraping, con validación de certificado TLS y caché en memoria. Ver `CLAUDE.md` en la raíz del monorepo para convenciones globales.

## Por qué existe este paquete

El BCV no provee una API pública documentada. Su portal presenta desafíos específicos de TLS: no incluye los certificados intermedios en el handshake TLS, lo que impide la validación estándar en entornos Node/Bun. Este paquete resuelve ambos problemas.

## Mecanismos principales

- **Scraping**: usa `ky` + `cheerio` para extraer la tasa USD del portal del BCV (`www.bcv.org.ve/glosario/cambio-oficial`). Se usa una instancia de `ky` con `fetch` customizado que inyecta el CA bundle en cada request mediante la opción `tls` nativa de Bun.
- **AIA Chasing**: descarga automáticamente la cadena de certificados intermedios siguiendo las extensiones AIA del certificado del servidor, y la mantiene en memoria para inyectarla en los requests posteriores.
- **Validación por fingerprint**: verifica el SHA-256 del primer certificado intermedio descargado contra la lista en `KNOWN_FINGERPRINTS`. Si no coincide, marca el servicio como no disponible y lanza `ApiError` con código `FINGERPRINT_UNAUTHORIZED_ERROR`.
- **Hot Swap**: El CA bundle actualizado se inyecta en cada request mediante `tls: { ca: getCaBundle() }` en el `fetch` customizado de `ky`. Esto permite que el servicio se recupere automáticamente de cambios en la cadena de certificados del BCV sin necesidad de reiniciar el servidor o redeployar el paquete.
- **Semáforo de actualización**: evita descargas de certificado concurrentes bajo carga con un `updatePromise` compartido.
- **Caché en memoria**: evita scraping repetido. TTL configurable (default: 4 horas).

## API pública del paquete

```typescript
import { getBcvDollarExchangeRate, getStatus, ApiError, ErrorCodes } from "@sanmart/bcv-api";

// Con caché (uso normal)
const { currency, exchangeRate, valueDate } = await getBcvDollarExchangeRate();

// Forzando actualización del caché
const result = await getBcvDollarExchangeRate({ forceRefresh: true });

// Consultar estado del servicio BCV antes de atender requests
// (equivalente al middleware checkBcvTrust de la versión Express — usar en onBeforeHandle de Elysia)
const { isTrustValid, lastError } = getStatus();

// Manejo de errores
try {
  const { exchangeRate } = await getBcvDollarExchangeRate();
} catch (err) {
  if (err instanceof ApiError) {
    // err.code es uno de ErrorCodes
  }
}
```

## Códigos de error (`ErrorCodes`)

| Código | Significado |
|---|---|
| `FINGERPRINT_UNAUTHORIZED_ERROR` | El fingerprint del certificado no coincide con los conocidos |
| `BCV_FETCH_ERROR` | No se pudo conectar al portal del BCV |
| `BCV_PARSE_ERROR` | Se conectó pero no se pudo extraer la tasa del HTML |
| `UNKNOWN_ERROR` | Error inesperado |

## Variable de entorno requerida

`KNOWN_FINGERPRINTS` — fingerprints SHA-256 del certificado intermedio del BCV, separados por coma. Es leída por el proceso que consume el paquete (`apps/api`), no por el paquete directamente.

## Dependencias

- `ky` — cliente HTTP (con instancia customizada que inyecta CA bundle via `tls` de Bun)
- `cheerio` — parsing de HTML
- `@peculiar/x509` — parsing y fingerprinting de certificados X.509

## Lo que este paquete NO hace

- No expone ningún servidor HTTP — eso lo hace `apps/api`.
- No tiene dependencias de Express, Elysia ni ningún framework HTTP.
- No gestiona variables de entorno directamente.