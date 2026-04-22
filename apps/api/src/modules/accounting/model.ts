import { t } from "elysia";

// ─── Expense entry ────────────────────────────────────────────────────────────

export const CreateExpenseBody = t.Object({
  concepto: t.String({ minLength: 1 }),
  monto: t.Number({ minimum: 0 }),
  fecha: t.Optional(t.String()),
});

// ─── Ledger query ─────────────────────────────────────────────────────────────

export const LedgerQuery = t.Object({
  type: t.Optional(t.String()),
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
  concept: t.Optional(t.String()),
  page: t.Optional(t.Number({ minimum: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 200 })),
});

// ─── Income statement query ───────────────────────────────────────────────────

export const IncomeStatementQuery = t.Object({
  period: t.Union([t.Literal("monthly"), t.Literal("quarterly"), t.Literal("custom")]),
  year: t.Optional(t.Number({ minimum: 2000 })),
  month: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
  quarter: t.Optional(t.Number({ minimum: 1, maximum: 4 })),
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
});
