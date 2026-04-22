export { createApiClient } from "./client.ts";
export type { ApiClient } from "./client.ts";

// ─── Config ───────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export type AppConfig = {
  agenda: {
    tiempo_entre_citas_minutos: number;
    hora_inicio: string;
    hora_fin: string;
    dias_habiles: DayOfWeek[];
  };
  contabilidad: {
    actualizar_tasa_cada_horas: number;
  };
  sistema: {
    nombre: string;
    version: string;
  };
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export type Role = "administrador" | "secretario" | "doctor" | "farmaceuta";

export const ROLES = ["administrador", "secretario", "doctor", "farmaceuta"] as const satisfies Role[];

// ─── Audit actions ────────────────────────────────────────────────────────────

export type AuditActionPersonal = "REGISTRO" | "EDICION" | "DESACTIVACION" | "ACTIVACION";
export type AuditActionPaciente = "REGISTRO" | "EDICION";
export type AuditActionAntecedente = "REGISTRO" | "EDICION";
export type AuditActionCita = "REGISTRO" | "EDICION_RESULTADO" | "CANCELACION";
export type AuditActionInsumo = "REGISTRO" | "EDICION" | "DISPENSACION";
export type AuditActionDonante = "REGISTRO" | "EDICION";
export type AuditActionDonacion = "REGISTRO" | "EDICION";
export type AuditActionAsientoContable = "REGISTRO";
export type AuditActionRecipeExterno = "REGISTRO";
export type AuditActionConsultaContable = "LIBRO_DIARIO" | "ESTADO_RESULTADOS";
