import { Elysia } from "elysia";
import { authMacro } from "../../plugins/auth-macro";
import { ApiError } from "../../errors";
import { accountingService } from "./service";
import * as m from "./model";

const ALLOWED_ROLES = ["secretario", "administrador"];

function requireAccountingRole(user: { roles: { nombre: string }[] }) {
  if (!user.roles.some((r) => ALLOWED_ROLES.includes(r.nombre)))
    throw new ApiError(403, "FORBIDDEN", "Acceso restringido a secretario y administrador");
}

export const accountingModule = new Elysia({ prefix: "/api/accounting" })
  .use(authMacro)
  .guard({ requireAuth: true }, (app) =>
    app
      // ── Expense entry ────────────────────────────────────────────────────────
      .post(
        "/entries/expense",
        ({ body, user }) => accountingService.createExpense(body, user.id),
        { body: m.CreateExpenseBody },
      )

      // ── Ledger ───────────────────────────────────────────────────────────────
      .get(
        "/ledger",
        ({ query, user }) => {
          requireAccountingRole(user);
          return accountingService.getLedger(
            {
              type: query.type,
              from: query.from,
              to: query.to,
              concept: query.concept,
              page: query.page,
              pageSize: query.pageSize,
            },
            user.id,
          );
        },
        { query: m.LedgerQuery },
      )

      // ── Income statement ─────────────────────────────────────────────────────
      .get(
        "/income-statement",
        ({ query, user }) => {
          requireAccountingRole(user);
          return accountingService.getIncomeStatement(
            {
              period: query.period,
              year: query.year,
              month: query.month,
              quarter: query.quarter,
              from: query.from,
              to: query.to,
            },
            user.id,
          );
        },
        { query: m.IncomeStatementQuery },
      )

      // ── Exchange rate ────────────────────────────────────────────────────────
      .get("/exchange-rate", () => accountingService.getExchangeRate()),
  );
