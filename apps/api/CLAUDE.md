# Sanmart API

Backend del sistema Sanmart Gestión Farmacéutica. Ver `CLAUDE.md` en la raíz del monorepo para contexto global del proyecto, modelo de datos y convenciones.

## Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **ORM**: Prisma con adaptador `@prisma/adapter-libsql`
- **Base de datos**: Turso (SQLite distribuido)
- **Autenticación**: BetterAuth con JWT y sesiones persistidas en base de datos
- **Archivos**: UploadThing
- **Tasa de cambio**: `@sanmart/bcv-api` (workspace local)
- **Tipado end-to-end**: Eden Treaty — el tipo `App` se exporta para su consumo por `@sanmart/contracts`
- **Hosting**: Fly.io — solo el backend. El frontend (`apps/web`) se despliega en Vercel.

## Variables de entorno requeridas

Definidas y validadas en `src/config.ts`. El servidor falla con error descriptivo si falta alguna.

```env
PORT=3000
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...
BETTER_AUTH_SECRET=...
UPLOADTHING_TOKEN=...
KNOWN_FINGERPRINTS=...   # fingerprints SHA-256 del certificado intermedio del BCV, separados por coma
FRONTEND_URL=...         # para configuración de CORS
```

## Estructura

```
src/
├── index.ts          ← instancia de Elysia, registro de plugins, export del tipo App
├── db.ts             ← instancia de PrismaClient con adaptador libsql
├── auth.ts           ← configuración de BetterAuth
├── config.ts         ← lectura y validación de variables de entorno
└── modules/
    ├── medical/
    ├── inventory/
    ├── donations/
    ├── accounting/
    ├── audit/
    └── admin/
```

## Convenciones del backend

- Validación de inputs con **TypeBox** (sistema nativo de Elysia).
- Todos los endpoints retornan JSON con estructura consistente.
- Errores retornan `{ code: string, message: string }`.
- El CORS está configurado para aceptar únicamente el origen definido en `FRONTEND_URL`.
- Hay un manejador global de errores registrado en la instancia raíz de Elysia.
- Ante dudas, revisar las skills de Elysia para seguir sus convenciones y mejores prácticas.

## Reglas de negocio transversales

- **HTML sanitizado**: sanitizar los campos `motivo`, `estadoPaciente`, `diagnostico` (Cita) e `indicaciones` (Recipe, RecipeExterno) **antes de persistir**. Usar `sanitize-html`.
- **Auditoría**: toda operación de escritura sobre entidades auditadas debe crear su entrada en `Auditoria` + tabla ternaria correspondiente, en la misma transacción de Prisma que la operación principal.
- **Asientos automáticos**: al crear Cita, Donacion o RecipeExterno, crear `Contabilizable` + `AsientoContable` de ingreso en la misma transacción.
- **Stock**: validar `stockDisponible >= cantidadSolicitada` antes de crear cualquier `InsumoConsumido`. Códigos de error: `INSUFFICIENT_STOCK` y `OUT_OF_STOCK`.
- **Roles**: verificar roles del usuario autenticado en cada endpoint que tenga restricción. BetterAuth provee el usuario en el contexto de la request.

## Schema de Prisma — notas importantes

- IDs: `String @default(cuid())` — no UUID nativo (mejor soporte en SQLite/Turso).
- Sin enums nativos de Prisma — usar `String` con validación en la capa de aplicación.
- Arrays (como `adjuntos`) se serializan como JSON en un campo `String`.
- `stockDisponible` no existe en el schema — se calcula en la capa de aplicación como `cantidad - Σ InsumoConsumido.cantidadDespachada`.
- La herencia `Contabilizable → Cita/Donacion/RecipeExterno` e `Insumo → PresentacionMedicamento/MaterialQuirurgico` se modela con FK `@unique` en el subtipo apuntando al tipo padre.

## Acceso por rol a endpoints

| Endpoint | Roles permitidos |
|---|---|
| `PATCH /api/medical/appointments/:id/result` | doctor |
| `GET /api/accounting/ledger` | secretario, administrador |
| `GET /api/accounting/income-statement` | secretario, administrador |
| `GET /api/audit/*` | administrador |
| `GET /api/admin/*` | administrador |
| `POST /api/admin/staff` | administrador |
| `PATCH /api/admin/staff/:id` | administrador |
| `POST /api/admin/staff/:id/deactivate` | administrador |
| `POST /api/admin/staff/:id/activate` | administrador |
| `PATCH /api/admin/config` | administrador |
| Resto de endpoints | cualquier usuario autenticado |

## Generación de PDF de récipe

Endpoint `GET /api/medical/appointments/:id/recipe/pdf`:
1. Si existe `Recipe.urlPdfCache`, retornar esa URL directamente.
2. Si no, generar el PDF al vuelo desde `Recipe.indicaciones` (HTML).
3. Subir el PDF generado a UploadThing.
4. Guardar la URL en `Recipe.urlPdfCache`.
5. Retornar la URL.

## Configuración del sistema

El archivo `config.json` en la raíz de `apps/api/` se carga en memoria al iniciar el servidor. El módulo admin expone `GET /api/admin/config` y `PATCH /api/admin/config`. Al escribir, validar coherencia de valores y recargar el objeto en memoria inmediatamente.