import { db } from "../../db";

type BaseAuditParams = {
  from?: string;
  to?: string;
  personalId?: string;
  accion?: string;
  page?: number;
  pageSize?: number;
};

type AccountingAccessParams = Omit<BaseAuditParams, "accion"> & {
  tipoConsulta?: string;
};

function buildDateFilter(from?: string, to?: string) {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to) }),
  };
}

function pagination(page?: number, pageSize?: number) {
  const p = page ?? 1;
  const ps = pageSize ?? 20;
  return { page: p, pageSize: ps, skip: (p - 1) * ps };
}

export class AuditService {
  async getPersonalAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaPersonal.count({ where }),
      db.auditoriaPersonal.findMany({
        where,
        include: { auditoria: true, personal: true, actor: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getPatientAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaPaciente.count({ where }),
      db.auditoriaPaciente.findMany({
        where,
        include: { auditoria: true, paciente: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getAntecedentAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaAntecedente.count({ where }),
      db.auditoriaAntecedente.findMany({
        where,
        include: { auditoria: true, antecedente: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getAppointmentAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaCita.count({ where }),
      db.auditoriaCita.findMany({
        where,
        include: { auditoria: true, cita: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getSupplyAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaInsumo.count({ where }),
      db.auditoriaInsumo.findMany({
        where,
        include: { auditoria: true, insumo: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getDonorAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaDonante.count({ where }),
      db.auditoriaDonante.findMany({
        where,
        include: { auditoria: true, donante: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getDonationAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaDonacion.count({ where }),
      db.auditoriaDonacion.findMany({
        where,
        include: { auditoria: true, donacion: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getAccountingEntryAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaAsientoContable.count({ where }),
      db.auditoriaAsientoContable.findMany({
        where,
        include: { auditoria: true, asiento: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getExternalRecipeAudit(params: BaseAuditParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.accion && { accion: params.accion }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaRecipeExterno.count({ where }),
      db.auditoriaRecipeExterno.findMany({
        where,
        include: { auditoria: true, recipeExterno: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async getAccountingAccessAudit(params: AccountingAccessParams) {
    const { page, pageSize, skip } = pagination(params.page, params.pageSize);
    const dateFilter = buildDateFilter(params.from, params.to);
    const where = {
      ...(dateFilter && { auditoria: { fecha: dateFilter } }),
      ...(params.personalId && { personalId: params.personalId }),
      ...(params.tipoConsulta && { tipoConsulta: params.tipoConsulta }),
    };

    const [total, items] = await Promise.all([
      db.auditoriaConsultaContable.count({ where }),
      db.auditoriaConsultaContable.findMany({
        where,
        include: { auditoria: true, personal: true },
        orderBy: { auditoria: { fecha: "desc" } },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, items };
  }
}

export const auditService = new AuditService();
