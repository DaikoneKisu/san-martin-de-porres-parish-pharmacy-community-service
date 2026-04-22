import { t } from "elysia";

// ─── Supplies ─────────────────────────────────────────────────────────────────

export const UpdateSupplyBody = t.Partial(
  t.Object({
    numeroLote: t.String({ minLength: 1 }),
    fechaVencimiento: t.String(),
    cantidad: t.Number({ minimum: 0 }),
    precioUnitarioReferencial: t.Number({ minimum: 0 }),
  }),
);

export const DispenseSupplyBody = t.Object({
  cantidadDespachada: t.Number({ minimum: 0.001 }),
  precioUnitario: t.Number({ minimum: 0 }),
});

// ─── Surgical materials ───────────────────────────────────────────────────────

export const CreateSurgicalMaterialBody = t.Object({
  nombre: t.String({ minLength: 1 }),
  numeroLote: t.String({ minLength: 1 }),
  fechaVencimiento: t.String(),
  cantidad: t.Number({ minimum: 0 }),
  precioUnitarioReferencial: t.Number({ minimum: 0 }),
});

export const UpdateSurgicalMaterialBody = t.Partial(
  t.Object({
    nombre: t.String({ minLength: 1 }),
    numeroLote: t.String({ minLength: 1 }),
    fechaVencimiento: t.String(),
    cantidad: t.Number({ minimum: 0 }),
    precioUnitarioReferencial: t.Number({ minimum: 0 }),
  }),
);

// ─── Medications ──────────────────────────────────────────────────────────────

const MedicationActiveIngredientInput = t.Object({
  principioActivoId: t.String(),
  concentracion: t.String({ minLength: 1 }),
});

const MedicationExcipientInput = t.Object({
  excipienteId: t.String(),
  concentracion: t.String({ minLength: 1 }),
});

export const CreateMedicationBody = t.Object({
  marcaId: t.String(),
  categoriaIds: t.Optional(t.Array(t.String())),
  principiosActivos: t.Optional(t.Array(MedicationActiveIngredientInput)),
  excipientes: t.Optional(t.Array(MedicationExcipientInput)),
});

export const UpdateMedicationBody = t.Partial(
  t.Object({
    marcaId: t.String(),
    categoriaIds: t.Array(t.String()),
    principiosActivos: t.Array(MedicationActiveIngredientInput),
    excipientes: t.Array(MedicationExcipientInput),
  }),
);

// ─── Catalog (nombre-only entities) ──────────────────────────────────────────

export const NombreBody = t.Object({ nombre: t.String({ minLength: 1 }) });

// ─── Brands ───────────────────────────────────────────────────────────────────

export const CreateBrandBody = t.Object({
  nombre: t.String({ minLength: 1 }),
  esGenerico: t.Boolean(),
  laboratorioId: t.String(),
});

export const UpdateBrandBody = t.Partial(CreateBrandBody);

// ─── Params ───────────────────────────────────────────────────────────────────

export const IdParam = t.Object({ id: t.String() });
