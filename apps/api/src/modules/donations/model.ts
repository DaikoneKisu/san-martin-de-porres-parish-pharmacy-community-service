import { t } from "elysia";

// ─── Donors ───────────────────────────────────────────────────────────────────

export const CreateDonorBody = t.Object({
  nombre: t.String({ minLength: 1 }),
  pais: t.String({ minLength: 1 }),
  contacto: t.String({ minLength: 1 }),
  esFijo: t.Boolean(),
});

export const UpdateDonorBody = t.Partial(CreateDonorBody);

// ─── Donation items ───────────────────────────────────────────────────────────

const MedicationItem = t.Object({
  tipo: t.Literal("MEDICAMENTO"),
  medicamentoId: t.String(),
  viaAdministracionId: t.String(),
  formaFarmaceuticaId: t.String(),
  empaqueId: t.String(),
  cantidadPorEmpaque: t.Integer({ minimum: 1 }),
  numeroLote: t.String({ minLength: 1 }),
  fechaVencimiento: t.String(),
  cantidad: t.Number({ minimum: 0 }),
  precioUnitarioReferencial: t.Number({ minimum: 0 }),
});

const SurgicalMaterialItem = t.Object({
  tipo: t.Literal("MATERIAL"),
  nombre: t.String({ minLength: 1 }),
  numeroLote: t.String({ minLength: 1 }),
  fechaVencimiento: t.String(),
  cantidad: t.Number({ minimum: 0 }),
  precioUnitarioReferencial: t.Number({ minimum: 0 }),
});

// ─── Donations ────────────────────────────────────────────────────────────────

export const CreateDonationBody = t.Object({
  donanteId: t.String(),
  fechaRecepcion: t.String(),
  observaciones: t.String(),
  items: t.Array(t.Union([MedicationItem, SurgicalMaterialItem]), { minItems: 1 }),
});

// ─── Params ───────────────────────────────────────────────────────────────────

export const IdParam = t.Object({ id: t.String() });
