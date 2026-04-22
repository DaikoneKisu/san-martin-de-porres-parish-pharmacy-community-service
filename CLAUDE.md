# Sanmart Gestión Farmacéutica — Monorepo

Sistema de gestión web mobile-first para la Farmacia de la Parroquia San Martín de Porres, San Félix, Estado Bolívar, Venezuela. Organización sin fines de lucro que atiende a personas de escasos recursos.

## Estructura del monorepo

```
sanmart/
├── apps/
│   ├── api/          ← backend: Elysia + Prisma + BetterAuth
│   └── web/          ← frontend: SvelteKit + TanStack Query
├── packages/
│   ├── contracts/    ← tipos compartidos + cliente Eden Treaty
│   └── bcv-api/      ← cliente BCV con caché y validación TLS
├── package.json      ← workspaces de Bun
└── bunfig.toml
```

## Convenciones globales

- Todos los archivos y carpetas en **kebab-case en minúsculas**.
- El idioma del código es **inglés** (variables, funciones, comentarios, nombres de archivos).
- Excepción: los textos visibles al usuario en la interfaz se escriben en **español**.
- No se usan mayúsculas en nombres de archivos ni carpetas.
- Los paquetes internos se referencian como `@sanmart/<nombre>`.

## Modelo de datos — decisiones clave

- Todos los montos se almacenan en **bolívares (VES)**. La conversión desde USD ocurre en el frontend antes de enviar al backend.
- Los campos de texto enriquecido almacenan **HTML sanitizado** (generado por TipTap, sanitizado en el backend con `sanitize-html`).
- `stockDisponible` en `Insumo` es **computado**: `cantidad - Σ InsumoConsumido.cantidadDespachada`. Nunca se escribe directamente.
- Los archivos adjuntos se almacenan en **UploadThing**. Los campos de archivo en la base de datos contienen URLs (strings).
- La autenticación es por **email y contraseña** (pendiente de validar si la farmacia prefiere cédula).
- Los asientos contables de ingreso se crean **automáticamente** al registrar una Cita, una Donacion o un RecipeExterno. Los egresos puntuales se registran manualmente.
- Los insumos se crean **exclusivamente** al registrar una donación. No existe un endpoint de creación de insumos independiente.

## Módulos del sistema

1. **Médico** — Pacientes, Historial médico, Antecedentes, Citas, Récipes internos, Récipes externos
2. **Inventario** — Insumos, Dispensación, Catálogos (medicamentos, materiales, categorías, etc.)
3. **Donaciones** — Donantes, Donaciones (creación atómica: donación + insumos + asiento)
4. **Contable** — Libro diario, Estado de resultados, Egresos puntuales
5. **Auditoría** — Solo administradores. Tabla central `Auditoria` + tablas ternarias por entidad.
6. **Administración** — Personal, Roles, Configuración del sistema (config.json)

## Roles del sistema

- `administrador` — acceso total, gestión de personal y configuración
- `secretario` — acceso a todos los módulos excepto auditoría; puede consultar libro diario y estado de resultados
- `doctor` — acceso al módulo médico con permiso exclusivo de registrar resultado de cita
- `farmaceuta` — acceso al módulo médico e inventario

Un usuario puede tener múltiples roles.

## Configuración global del sistema

Vive en `apps/api/config.json`. No en la base de datos. Se carga en memoria al iniciar el servidor y se recarga al editarse.

```json
{
  "agenda": {
    "tiempo_entre_citas_minutos": 30,
    "hora_inicio": "08:00",
    "hora_fin": "17:00",
    "dias_habiles": ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
  },
  "contabilidad": {
    "actualizar_tasa_cada_horas": 4
  },
  "sistema": {
    "nombre": "Sanmart Gestión Farmacéutica",
    "version": "1.0.0"
  }
}
```

## Servicios externos

| Servicio | Propósito | Variables de entorno |
|---|---|---|
| Turso | Base de datos SQLite distribuida | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` |
| UploadThing | Almacenamiento de archivos | `UPLOADTHING_TOKEN` |
| Fly.io | Hosting del backend (apps/api) | — |
| Vercel | Hosting del frontend (apps/web) | — |
| BCV (scraping) | Tasa de cambio USD/VES | `KNOWN_FINGERPRINTS` |

## Auditoría

Toda acción relevante sobre entidades del sistema debe registrar una entrada en la tabla `Auditoria` y su tabla ternaria correspondiente (`AuditoriaX`), en la misma transacción de Prisma que la operación principal. Las acciones posibles por entidad son:

| Entidad | Acciones |
|---|---|
| Personal | REGISTRO, EDICION, DESACTIVACION, ACTIVACION |
| Paciente | REGISTRO, EDICION |
| Antecedente | REGISTRO, EDICION |
| Cita | REGISTRO, EDICION_RESULTADO, CANCELACION |
| Insumo | REGISTRO, EDICION, DISPENSACION |
| Donante | REGISTRO, EDICION |
| Donacion | REGISTRO, EDICION |
| AsientoContable | REGISTRO |
| RecipeExterno | REGISTRO |
| ConsultaContable | LIBRO_DIARIO, ESTADO_RESULTADOS (registro de acceso de lectura) |

El `personalId` en las tablas de auditoría es nullable — null indica que la acción fue generada por el sistema como efecto colateral.