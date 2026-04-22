import type { Prisma } from "@prisma/client";
import { db } from "../../db";
import { ApiError } from "../../errors";
import { getBcvDollarExchangeRate, ApiError as BcvApiError, ErrorCodes } from "@sanmart/bcv-api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvePeriodRange(params: {
  period: "monthly" | "quarterly" | "custom";
  year?: number;
  month?: number;
  quarter?: number;
  from?: string;
  to?: string;
}): { from: Date; to: Date } {
  if (params.period === "monthly") {
    if (params.year == null || params.month == null)
      throw new ApiError(422, "INVALID_PARAMS", "Se requieren year y month para period=monthly");
    const from = new Date(params.year, params.month - 1, 1);
    const to = new Date(params.year, params.month, 0, 23, 59, 59, 999);
    return { from, to };
  }

  if (params.period === "quarterly") {
    if (params.year == null || params.quarter == null)
      throw new ApiError(422, "INVALID_PARAMS", "Se requieren year y quarter para period=quarterly");
    const startMonth = (params.quarter - 1) * 3;
    const from = new Date(params.year, startMonth, 1);
    const to = new Date(params.year, startMonth + 3, 0, 23, 59, 59, 999);
    return { from, to };
  }

  // custom
  if (!params.from || !params.to)
    throw new ApiError(422, "INVALID_PARAMS", "Se requieren from y to para period=custom");
  return { from: new Date(params.from), to: new Date(params.to) };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AccountingService {
  // ── Expense entry ──────────────────────────────────────────────────────────

  async createExpense(
    data: { concepto: string; monto: number; fecha?: string },
    actorId: string,
  ) {
    const asiento = await db.$transaction(async (tx) => {
      const entry = await tx.asientoContable.create({
        data: {
          contabilizableId: null,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
          tipo: "EGRESO",
          concepto: data.concepto,
          monto: data.monto,
        },
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaAsientoContable.create({
        data: {
          auditoriaId: audit.id,
          asientoId: entry.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(entry),
        },
      });

      return entry;
    });

    return asiento;
  }

  // ── Ledger ──────────────────────────────────────────────────────────────────

  async getLedger(
    params: {
      type?: string;
      from?: string;
      to?: string;
      concept?: string;
      page?: number;
      pageSize?: number;
    },
    actorId: string,
  ) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AsientoContableWhereInput = {
      ...(params.type !== undefined && { tipo: params.type }),
      ...((params.from !== undefined || params.to !== undefined) && {
        fecha: {
          ...(params.from !== undefined && { gte: new Date(params.from) }),
          ...(params.to !== undefined && { lte: new Date(params.to) }),
        },
      }),
      ...(params.concept !== undefined && {
        concepto: { contains: params.concept },
      }),
    };

    const [total, items] = await Promise.all([
      db.asientoContable.count({ where }),
      db.asientoContable.findMany({
        where,
        orderBy: { fecha: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    await db.auditoria.create({
      data: {
        fecha: new Date(),
        auditoriaConsultaContable: {
          create: {
            personalId: actorId,
            tipoConsulta: "LIBRO_DIARIO",
            parametros: JSON.stringify(params),
          },
        },
      },
    });

    return { total, page, pageSize, items };
  }

  // ── Income statement ───────────────────────────────────────────────────────

  async getIncomeStatement(
    params: {
      period: "monthly" | "quarterly" | "custom";
      year?: number;
      month?: number;
      quarter?: number;
      from?: string;
      to?: string;
    },
    actorId: string,
  ) {
    const { from, to } = resolvePeriodRange(params);
    const dateFilter = { gte: from, lte: to };

    const [ingresosAgg, egresosAgg] = await Promise.all([
      db.asientoContable.aggregate({
        where: { tipo: "INGRESO", fecha: dateFilter },
        _sum: { monto: true },
      }),
      db.asientoContable.aggregate({
        where: { tipo: "EGRESO", fecha: dateFilter },
        _sum: { monto: true },
      }),
    ]);

    const ingresos = Number(ingresosAgg._sum.monto ?? 0);
    const egresos = Number(egresosAgg._sum.monto ?? 0);
    const resultado = ingresos - egresos;

    await db.auditoria.create({
      data: {
        fecha: new Date(),
        auditoriaConsultaContable: {
          create: {
            personalId: actorId,
            tipoConsulta: "ESTADO_RESULTADOS",
            parametros: JSON.stringify(params),
          },
        },
      },
    });

    return {
      periodo: { from: from.toISOString(), to: to.toISOString() },
      ingresos,
      egresos,
      resultado,
    };
  }

  // ── Exchange rate ──────────────────────────────────────────────────────────

  async getExchangeRate() {
    try {
      return await getBcvDollarExchangeRate();
    } catch (err) {
      if (err instanceof BcvApiError) {
        const httpStatus =
          err.code === ErrorCodes.BCV_PARSE_ERROR ? 503
          : err.code === ErrorCodes.FINGERPRINT_UNAUTHORIZED_ERROR ? 502
          : err.code === ErrorCodes.BCV_FETCH_ERROR ? 502
          : 500;
        throw new ApiError(httpStatus, err.code, err.message);
      }
      throw err;
    }
  }
}

export const accountingService = new AccountingService();
