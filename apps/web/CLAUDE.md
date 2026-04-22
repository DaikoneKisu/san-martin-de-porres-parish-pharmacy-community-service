# Sanmart Web

Frontend del sistema Sanmart Gestión Farmacéutica. Ver `CLAUDE.md` en la raíz del monorepo para contexto global del proyecto, modelo de datos y convenciones.

## Stack

- **Framework**: SvelteKit con Svelte 5
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn-svelte (base) + componentes personalizados en `$lib/components/custom/` (revisar (shadcn-svelte)[https://www.shadcn-svelte.com/llms.txt] para más detalles)
- **Iconos**: Lucide Svelte
- **Estado del servidor**: TanStack Query for Svelte (revisar (TanStack)[https://tanstack.com/llms.txt] para más detalles)
- **Formularios**: (Formsnap)[https://www.formsnap.dev/docs] + (TypeBox)[https://github.com/sinclairzx81/typebox]
- **Editor de texto enriquecido**: TipTap (revisar skills de TipTap para Svelte en el proyecto)
- **Fechas**: Luxon
- **Teléfonos**: (libphonenumber-js)[https://gitlab.com/catamphetamine/libphonenumber-js]
- **Cliente API**: Eden Treaty desde `@sanmart/contracts`
- **Hosting**: Vercel

## Variable de entorno requerida

```env
PUBLIC_API_URL=http://localhost:3000
```

## Cliente API

```typescript
// src/lib/api.ts
import { createApiClient } from "@sanmart/contracts";
import { PUBLIC_API_URL } from "$env/static/public";
export const api = createApiClient(PUBLIC_API_URL);
```

Usar siempre `api` de `$lib/api.ts` para todas las llamadas al backend. Nunca llamar a `fetch` directamente.

## Estructura de rutas

```
src/routes/
├── +layout.svelte          ← QueryClientProvider + sidebar condicional
├── +layout.server.ts       ← protección de rutas (redirige a /login si no hay sesión)
├── +page.svelte            ← dashboard
├── (auth)/                 ← rutas públicas, sin sidebar
│   ├── login/
│   └── recover-password/
├── medical/                ← módulo médico
├── inventory/              ← módulo inventario
├── donations/              ← módulo donaciones
├── accounting/             ← módulo contable
├── audit/                  ← módulo auditoría (solo administrador)
└── admin/                  ← módulo administración (solo administrador)
```

## Convenciones del frontend

- **Mobile-first**: diseñar primero para una columna, expandir con clases `md:` y `lg:` para desktop.
- **Sidebar**: `Drawer` de shadcn-svelte en móvil (colapsable, desde abajo), fijo en desktop. Ítems condicionales por rol.
- **Listados**: `Table` de shadcn-svelte con paginación del lado del servidor.
- **Formularios**: Formsnap + TypeBox. Mostrar errores inline junto a cada campo.
- **Formularios cortos** (≤ 5 campos): `Drawer` desde abajo.
- **Formularios largos** (> 5 campos): página propia.
- **Errores de API**: `Toast` con Sonner de shadcn-svelte.
- **Estados de carga**: `Skeleton` de shadcn-svelte.
- **Acciones destructivas**: `AlertDialog` de shadcn-svelte con confirmación explícita.
- **Textos visibles al usuario**: en español.
- **Edad de paciente**: calcular con Luxon a partir de `fechaNac`. No almacenar en base de datos.
- **Conversión USD → VES**: obtener la tasa con `GET /api/accounting/exchange-rate` antes de enviar montos al backend. El backend solo acepta VES.

## Componentes personalizados disponibles

En `$lib/components/custom/`:

| Componente | Props clave | Uso |
|---|---|---|
| `editor-rich-text.svelte` | `value: string`, `placeholder?`, `disabled?` | Campos de texto enriquecido (motivo, diagnóstico, indicaciones) |
| `recipe-pdf-viewer.svelte` | `pdfUrl?`, `indicationsHtml?`, `patientName`, `doctorName`, `date` | Previsualización de récipe antes de imprimir |
| `medication-selector.svelte` | `value?: Medicamento`, `placeholder?`, `disabled?` | Búsqueda y selección de medicamentos del catálogo |
| `patient-selector.svelte` | `value?: Paciente`, `placeholder?`, `disabled?` | Búsqueda y selección de pacientes |
| `doctor-selector.svelte` | `value?: Personal`, `fecha?`, `hora?`, `disabled?` | Selección de médico con verificación de disponibilidad |
| `stock-indicator.svelte` | `stockDisponible: number`, `cantidadInicial: number` | Badge visual del nivel de stock |
| `expiry-indicator.svelte` | `fechaVencimiento: string` | Indicador de días hasta vencimiento de un insumo |

## Protección de rutas

- El `+layout.server.ts` raíz redirige a `/login` si no hay sesión activa.
- Las rutas `/audit` y `/admin` verifican adicionalmente que el usuario tenga rol `administrador`.
- Las rutas en el grupo `(auth)` no aplican protección.

## Acceso por rol a módulos y vistas

| Módulo / Vista | Roles con acceso |
|---|---|
| Médico (todas las vistas) | administrador, secretario, doctor, farmaceuta |
| Inventario | administrador, secretario, doctor, farmaceuta |
| Donaciones | administrador, secretario, doctor, farmaceuta |
| Contable — registrar egreso | administrador, secretario, doctor, farmaceuta |
| Contable — libro diario | administrador, secretario |
| Contable — estado de resultados | administrador, secretario |
| Auditoría | administrador |
| Administración | administrador |