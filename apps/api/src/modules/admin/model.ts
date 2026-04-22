import { t } from "elysia";

// ─── Staff ────────────────────────────────────────────────────────────────────

export const CreateStaffBody = t.Object({
  nombre: t.String({ minLength: 1 }),
  cedula: t.String({ minLength: 1 }),
  telefono: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  roles: t.Array(t.String(), { minItems: 1 }),
});

export const UpdateStaffBody = t.Object({
  nombre: t.Optional(t.String({ minLength: 1 })),
  cedula: t.Optional(t.String({ minLength: 1 })),
  telefono: t.Optional(t.String({ minLength: 1 })),
  roles: t.Optional(t.Array(t.String(), { minItems: 1 })),
  password: t.Optional(t.String({ minLength: 8 })),
});

export const IdParam = t.Object({ id: t.String() });

// ─── Config ───────────────────────────────────────────────────────────────────

export const PatchConfigBody = t.Object({
  agenda: t.Optional(
    t.Object({
      tiempo_entre_citas_minutos: t.Optional(t.Number({ minimum: 5 })),
      hora_inicio: t.Optional(t.String()),
      hora_fin: t.Optional(t.String()),
      dias_habiles: t.Optional(t.Array(t.String())),
    }),
  ),
  contabilidad: t.Optional(
    t.Object({
      actualizar_tasa_cada_horas: t.Optional(t.Number({ minimum: 1 })),
    }),
  ),
  sistema: t.Optional(
    t.Object({
      nombre: t.Optional(t.String({ minLength: 1 })),
      version: t.Optional(t.String()),
    }),
  ),
});
