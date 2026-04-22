# @sanmart/contracts

Paquete interno que centraliza los tipos compartidos entre `apps/api` y `apps/web`, y expone el cliente Eden Treaty generado por Elysia. Ver `CLAUDE.md` en la raíz del monorepo para convenciones globales.

## Propósito

Elysia genera automáticamente un tipo `App` que describe la totalidad de los endpoints del servidor. Eden Treaty usa ese tipo para crear un cliente con tipado de extremo a extremo: si el backend cambia un endpoint, el frontend muestra error de TypeScript automáticamente, sin necesidad de mantener contratos de API manualmente.

## API pública del paquete

```typescript
import { createApiClient } from "@sanmart/contracts";
import type { ApiClient } from "@sanmart/contracts";

// En apps/web/src/lib/api.ts
const api = createApiClient(PUBLIC_API_URL);

// Uso del cliente (tipado completo)
const patients = await api.medical.patients.get();
const { data, error } = patients;
```

El `baseUrl` se pasa en tiempo de ejecución desde cada app consumidora. El paquete no asume ninguna URL.

## Implementación del cliente

```typescript
// src/client.ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@sanmart/api";

export const createApiClient = (baseUrl: string) =>
  treaty<App>(baseUrl);

export type ApiClient = ReturnType<typeof createApiClient>;
```

## Qué exportar desde este paquete

- `createApiClient` y `ApiClient` — siempre.
- Tipos de dominio que sean necesarios simultáneamente en frontend y backend y que no estén ya capturados por el tipo `App` de Elysia. Ejemplos:
  - La estructura tipada del `config.json`
  - Enums de roles si se usan en validaciones de ambos lados
  - Tipos de error compartidos

## Lo que este paquete NO hace

- No contiene lógica de negocio.
- No hace llamadas HTTP directamente.
- No exporta constantes de configuración (esas viven en cada app).
- No re-exporta tipos de Prisma — esos los gestiona `apps/api` internamente.

## Dependencias

- `@elysiajs/eden`
- `@sanmart/api` como dependencia de workspace — **solo para el tipo en tiempo de compilación, no para runtime**. Usar `import type` siempre.