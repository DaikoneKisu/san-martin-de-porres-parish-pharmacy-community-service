import { Elysia } from "elysia";
import { authMacro } from "../../plugins/auth-macro";
import { ApiError } from "../../errors";
import { auditService } from "./service";
import * as m from "./model";

function requireAdmin(user: { roles: { nombre: string }[] }) {
  if (!user.roles.some((r) => r.nombre === "administrador"))
    throw new ApiError(403, "FORBIDDEN", "Acceso restringido a administradores");
}

export const auditModule = new Elysia({ prefix: "/api/audit" })
  .use(authMacro)
  .guard({ requireAuth: true }, (app) =>
    app
      .get(
        "/personal",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getPersonalAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/patients",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getPatientAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/antecedents",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getAntecedentAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/appointments",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getAppointmentAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/supplies",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getSupplyAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/donors",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getDonorAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/donations",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getDonationAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/accounting-entries",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getAccountingEntryAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/external-recipes",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getExternalRecipeAudit(query);
        },
        { query: m.AuditQuery },
      )
      .get(
        "/accounting-access",
        ({ query, user }) => {
          requireAdmin(user);
          return auditService.getAccountingAccessAudit(query);
        },
        { query: m.AccountingAccessAuditQuery },
      ),
  );
