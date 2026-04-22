import { t } from "elysia";

export const AuditQuery = t.Object({
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
  personalId: t.Optional(t.String()),
  accion: t.Optional(t.String()),
  page: t.Optional(t.Number({ minimum: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
});

export const AccountingAccessAuditQuery = t.Object({
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
  personalId: t.Optional(t.String()),
  tipoConsulta: t.Optional(t.String()),
  page: t.Optional(t.Number({ minimum: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
});
