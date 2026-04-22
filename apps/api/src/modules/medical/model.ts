import { t } from "elysia";

const InsumoConsumidoInput = t.Object({
  insumoId: t.String(),
  cantidadDespachada: t.Number({ minimum: 0.001 }),
  precioUnitario: t.Number({ minimum: 0 }),
});

export const CreatePatientBody = t.Object({
  nombre: t.String({ minLength: 1 }),
  cedula: t.String({ minLength: 1 }),
  fechaNac: t.String(),
  genero: t.String({ minLength: 1 }),
  telefono: t.String({ minLength: 1 }),
  lugarNac: t.String({ minLength: 1 }),
  residencia: t.String({ minLength: 1 }),
});

export const UpdatePatientBody = t.Partial(CreatePatientBody);

export const CreateAntecedentBody = t.Object({
  descripcion: t.String({ minLength: 1 }),
  fechaRegistro: t.Optional(t.String()),
  adjuntos: t.Optional(t.Array(t.String())),
  categoriaIds: t.Optional(t.Array(t.String())),
});

export const UpdateAntecedentBody = t.Partial(
  t.Object({
    descripcion: t.String({ minLength: 1 }),
    fechaRegistro: t.Optional(t.String()),
    adjuntos: t.Optional(t.Array(t.String())),
    categoriaIds: t.Optional(t.Array(t.String())),
  }),
);

export const CreateAppointmentBody = t.Object({
  pacienteId: t.String(),
  personalId: t.String(),
  fechaHora: t.String(),
  motivo: t.String({ minLength: 1 }),
  precioConsulta: t.Number({ minimum: 0 }),
  adjuntos: t.Optional(t.Array(t.String())),
  siguienteCitaId: t.Optional(t.String()),
});

export const UpdateAppointmentResultBody = t.Object({
  estadoPaciente: t.Optional(t.String()),
  diagnostico: t.Optional(t.String()),
  recipe: t.Optional(
    t.Object({
      indicaciones: t.String({ minLength: 1 }),
    }),
  ),
  insumosConsumidos: t.Optional(t.Array(InsumoConsumidoInput)),
});

export const CreateExternalRecipeBody = t.Object({
  indicaciones: t.Optional(t.String()),
  adjuntoExterno: t.String(),
  insumosConsumidos: t.Array(InsumoConsumidoInput),
});

export const IdParam = t.Object({ id: t.String() });
export const PatientAntecedentParams = t.Object({
  id: t.String(),
  antecedentId: t.String(),
});
