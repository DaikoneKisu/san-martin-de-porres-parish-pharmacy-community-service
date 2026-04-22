import type { Prisma } from "@prisma/client";
import { db } from "../../db";
import { ApiError } from "../../errors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStockDisponible(
  cantidad: number,
  consumidos: { cantidadDespachada: number }[],
): number {
  return cantidad - consumidos.reduce((s, ic) => s + ic.cantidadDespachada, 0);
}

async function validateStockTx(
  tx: Prisma.TransactionClient,
  insumoId: string,
  cantidadSolicitada: number,
): Promise<void> {
  const insumo = await tx.insumo.findUnique({
    where: { id: insumoId },
    include: { insumosConsumidos: { select: { cantidadDespachada: true } } },
  });
  if (!insumo) throw new ApiError(404, "INSUMO_NOT_FOUND", `Insumo no encontrado: ${insumoId}`);

  const stock = computeStockDisponible(Number(insumo.cantidad), insumo.insumosConsumidos);
  if (stock <= 0) throw new ApiError(409, "OUT_OF_STOCK", "Sin stock disponible");
  if (stock < cantidadSolicitada)
    throw new ApiError(409, "INSUFFICIENT_STOCK", "Stock insuficiente");
}

function computeMedicationName(
  marca: { nombre: string; esGenerico: boolean; laboratorio: { nombre: string } },
  principiosActivos: { principioActivo: { nombre: string }; concentracion: string }[],
): string {
  if (marca.esGenerico && principiosActivos.length > 0) {
    const ingredientes = principiosActivos
      .map((mpa) => `${mpa.principioActivo.nombre} ${mpa.concentracion}`)
      .join(" + ");
    return `${ingredientes} - ${marca.laboratorio.nombre}`;
  }
  return marca.nombre;
}

const SUPPLY_INCLUDE = {
  insumosConsumidos: { select: { cantidadDespachada: true } },
  presentacionMedicamento: {
    include: {
      medicamento: {
        include: {
          marca: { include: { laboratorio: true } },
          principiosActivos: { include: { principioActivo: true } },
          categorias: true,
        },
      },
      viaAdministracion: true,
      formaFarmaceutica: true,
      empaque: true,
    },
  },
  materialQuirurgico: true,
} satisfies Prisma.InsumoInclude;

function mapSupply(
  insumo: Prisma.InsumoGetPayload<{ include: typeof SUPPLY_INCLUDE }>,
) {
  return {
    ...insumo,
    stockDisponible: computeStockDisponible(
      Number(insumo.cantidad),
      insumo.insumosConsumidos,
    ),
  };
}

const MEDICATION_INCLUDE = {
  marca: { include: { laboratorio: true } },
  categorias: true,
  principiosActivos: { include: { principioActivo: true } },
  excipientes: { include: { excipiente: true } },
  presentaciones: {
    include: {
      insumo: {
        include: { insumosConsumidos: { select: { cantidadDespachada: true } } },
      },
      viaAdministracion: true,
      formaFarmaceutica: true,
      empaque: true,
    },
  },
} satisfies Prisma.MedicamentoInclude;

function mapMedication(
  med: Prisma.MedicamentoGetPayload<{ include: typeof MEDICATION_INCLUDE }>,
) {
  return {
    ...med,
    nombre: computeMedicationName(med.marca, med.principiosActivos),
    presentaciones: med.presentaciones.map((p) => ({
      ...p,
      insumo: {
        ...p.insumo,
        stockDisponible: computeStockDisponible(
          Number(p.insumo.cantidad),
          p.insumo.insumosConsumidos,
        ),
      },
    })),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class InventoryService {
  // ── Supplies ──────────────────────────────────────────────────────────────

  async listSupplies() {
    const insumos = await db.insumo.findMany({
      include: SUPPLY_INCLUDE,
      orderBy: { id: "asc" },
    });
    return insumos.map(mapSupply);
  }

  async getSupply(id: string) {
    const insumo = await db.insumo.findUnique({ where: { id }, include: SUPPLY_INCLUDE });
    if (!insumo) throw new ApiError(404, "SUPPLY_NOT_FOUND", "Insumo no encontrado");
    return mapSupply(insumo);
  }

  async updateSupply(
    id: string,
    data: {
      numeroLote?: string;
      fechaVencimiento?: string;
      cantidad?: number;
      precioUnitarioReferencial?: number;
    },
    actorId: string,
  ) {
    const existing = await db.insumo.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "SUPPLY_NOT_FOUND", "Insumo no encontrado");

    return db.$transaction(async (tx) => {
      const updated = await tx.insumo.update({
        where: { id },
        data: {
          ...data,
          fechaVencimiento: data.fechaVencimiento
            ? new Date(data.fechaVencimiento)
            : undefined,
        },
        include: SUPPLY_INCLUDE,
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaInsumo.create({
        data: {
          auditoriaId: audit.id,
          insumoId: id,
          personalId: actorId,
          accion: "EDICION",
          datosAnteriores: JSON.stringify(existing),
          datosNuevos: JSON.stringify(updated),
        },
      });

      return mapSupply(updated);
    });
  }

  async dispenseSupply(
    id: string,
    data: { cantidadDespachada: number; precioUnitario: number },
    actorId: string,
  ) {
    const insumo = await db.insumo.findUnique({ where: { id } });
    if (!insumo) throw new ApiError(404, "SUPPLY_NOT_FOUND", "Insumo no encontrado");

    return db.$transaction(async (tx) => {
      await validateStockTx(tx, id, data.cantidadDespachada);

      const dispensed = await tx.insumoConsumido.create({
        data: {
          insumoId: id,
          cantidadDespachada: data.cantidadDespachada,
          precioUnitario: data.precioUnitario,
        },
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaInsumo.create({
        data: {
          auditoriaId: audit.id,
          insumoId: id,
          personalId: actorId,
          accion: "DISPENSACION",
          datosNuevos: JSON.stringify(dispensed),
        },
      });

      const refreshed = await tx.insumo.findUnique({
        where: { id },
        include: SUPPLY_INCLUDE,
      });

      return mapSupply(refreshed!);
    });
  }

  // ── Surgical materials ────────────────────────────────────────────────────

  async listSurgicalMaterials() {
    const items = await db.materialQuirurgico.findMany({
      include: {
        insumo: { include: SUPPLY_INCLUDE },
      },
      orderBy: { nombre: "asc" },
    });
    return items.map((m) => ({ ...m, insumo: mapSupply(m.insumo) }));
  }

  async createSurgicalMaterial(
    data: {
      nombre: string;
      numeroLote: string;
      fechaVencimiento: string;
      cantidad: number;
      precioUnitarioReferencial: number;
    },
    actorId: string,
  ) {
    return db.$transaction(async (tx) => {
      const insumo = await tx.insumo.create({
        data: {
          tipo: "MATERIAL",
          numeroLote: data.numeroLote,
          fechaVencimiento: new Date(data.fechaVencimiento),
          cantidad: data.cantidad,
          precioUnitarioReferencial: data.precioUnitarioReferencial,
          materialQuirurgico: { create: { nombre: data.nombre } },
        },
        include: SUPPLY_INCLUDE,
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaInsumo.create({
        data: {
          auditoriaId: audit.id,
          insumoId: insumo.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(insumo),
        },
      });

      return { ...insumo.materialQuirurgico!, insumo: mapSupply(insumo) };
    });
  }

  async getSurgicalMaterial(id: string) {
    const item = await db.materialQuirurgico.findUnique({
      where: { id },
      include: { insumo: { include: SUPPLY_INCLUDE } },
    });
    if (!item) throw new ApiError(404, "SURGICAL_MATERIAL_NOT_FOUND", "Material quirúrgico no encontrado");
    return { ...item, insumo: mapSupply(item.insumo) };
  }

  async updateSurgicalMaterial(
    id: string,
    data: {
      nombre?: string;
      numeroLote?: string;
      fechaVencimiento?: string;
      cantidad?: number;
      precioUnitarioReferencial?: number;
    },
    actorId: string,
  ) {
    const existing = await db.materialQuirurgico.findUnique({
      where: { id },
      include: { insumo: true },
    });
    if (!existing) throw new ApiError(404, "SURGICAL_MATERIAL_NOT_FOUND", "Material quirúrgico no encontrado");

    return db.$transaction(async (tx) => {
      const { nombre, fechaVencimiento, ...insumoFields } = data;

      const updatedInsumo = await tx.insumo.update({
        where: { id: existing.insumoId },
        data: {
          ...insumoFields,
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
        },
        include: SUPPLY_INCLUDE,
      });

      const updatedMaterial = nombre !== undefined
        ? await tx.materialQuirurgico.update({ where: { id }, data: { nombre } })
        : existing;

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaInsumo.create({
        data: {
          auditoriaId: audit.id,
          insumoId: existing.insumoId,
          personalId: actorId,
          accion: "EDICION",
          datosAnteriores: JSON.stringify(existing),
          datosNuevos: JSON.stringify({ ...updatedMaterial, insumo: updatedInsumo }),
        },
      });

      return { ...updatedMaterial, insumo: mapSupply(updatedInsumo) };
    });
  }

  // ── Medications ───────────────────────────────────────────────────────────

  async listMedications() {
    const meds = await db.medicamento.findMany({
      include: MEDICATION_INCLUDE,
      orderBy: { nombre: "asc" },
    });
    return meds.map(mapMedication);
  }

  async createMedication(data: {
    marcaId: string;
    categoriaIds?: string[];
    principiosActivos?: { principioActivoId: string; concentracion: string }[];
    excipientes?: { excipienteId: string; concentracion: string }[];
  }) {
    const marca = await db.marca.findUnique({
      where: { id: data.marcaId },
      include: { laboratorio: true },
    });
    if (!marca) throw new ApiError(404, "BRAND_NOT_FOUND", "Marca no encontrada");

    const pasForName = await Promise.all(
      (data.principiosActivos ?? []).map(async (pa) => {
        const principioActivo = await db.principioActivo.findUnique({
          where: { id: pa.principioActivoId },
        });
        if (!principioActivo)
          throw new ApiError(404, "ACTIVE_INGREDIENT_NOT_FOUND", `Principio activo no encontrado: ${pa.principioActivoId}`);
        return { principioActivo, concentracion: pa.concentracion };
      }),
    );

    const nombre = computeMedicationName(marca, pasForName);

    const med = await db.medicamento.create({
      data: {
        nombre,
        marcaId: data.marcaId,
        categorias: data.categoriaIds?.length
          ? { connect: data.categoriaIds.map((id) => ({ id })) }
          : undefined,
        principiosActivos: data.principiosActivos?.length
          ? {
              create: data.principiosActivos.map((pa) => ({
                principioActivoId: pa.principioActivoId,
                concentracion: pa.concentracion,
              })),
            }
          : undefined,
        excipientes: data.excipientes?.length
          ? {
              create: data.excipientes.map((e) => ({
                excipienteId: e.excipienteId,
                concentracion: e.concentracion,
              })),
            }
          : undefined,
      },
      include: MEDICATION_INCLUDE,
    });

    return mapMedication(med);
  }

  async getMedication(id: string) {
    const med = await db.medicamento.findUnique({
      where: { id },
      include: MEDICATION_INCLUDE,
    });
    if (!med) throw new ApiError(404, "MEDICATION_NOT_FOUND", "Medicamento no encontrado");
    return mapMedication(med);
  }

  async updateMedication(
    id: string,
    data: {
      marcaId?: string;
      categoriaIds?: string[];
      principiosActivos?: { principioActivoId: string; concentracion: string }[];
      excipientes?: { excipienteId: string; concentracion: string }[];
    },
  ) {
    const existing = await db.medicamento.findUnique({
      where: { id },
      include: MEDICATION_INCLUDE,
    });
    if (!existing) throw new ApiError(404, "MEDICATION_NOT_FOUND", "Medicamento no encontrado");

    const marcaId = data.marcaId ?? existing.marcaId;
    const marca = await db.marca.findUnique({
      where: { id: marcaId },
      include: { laboratorio: true },
    });
    if (!marca) throw new ApiError(404, "BRAND_NOT_FOUND", "Marca no encontrada");

    const pasForName = await Promise.all(
      (data.principiosActivos ?? existing.principiosActivos.map((mpa) => ({
        principioActivoId: mpa.principioActivoId,
        concentracion: mpa.concentracion,
      }))).map(async (pa) => {
        const principioActivo = await db.principioActivo.findUnique({
          where: { id: pa.principioActivoId },
        });
        if (!principioActivo)
          throw new ApiError(404, "ACTIVE_INGREDIENT_NOT_FOUND", `Principio activo no encontrado: ${pa.principioActivoId}`);
        return { principioActivo, concentracion: pa.concentracion };
      }),
    );

    const nombre = computeMedicationName(marca, pasForName);

    return db.$transaction(async (tx) => {
      if (data.principiosActivos !== undefined) {
        await tx.medicamentoPrincipioActivo.deleteMany({ where: { medicamentoId: id } });
      }
      if (data.excipientes !== undefined) {
        await tx.medicamentoExcipiente.deleteMany({ where: { medicamentoId: id } });
      }

      const updated = await tx.medicamento.update({
        where: { id },
        data: {
          nombre,
          marcaId: data.marcaId,
          categorias: data.categoriaIds !== undefined
            ? { set: data.categoriaIds.map((cid) => ({ id: cid })) }
            : undefined,
          principiosActivos: data.principiosActivos?.length
            ? {
                create: data.principiosActivos.map((pa) => ({
                  principioActivoId: pa.principioActivoId,
                  concentracion: pa.concentracion,
                })),
              }
            : undefined,
          excipientes: data.excipientes?.length
            ? {
                create: data.excipientes.map((e) => ({
                  excipienteId: e.excipienteId,
                  concentracion: e.concentracion,
                })),
              }
            : undefined,
        },
        include: MEDICATION_INCLUDE,
      });

      return mapMedication(updated);
    });
  }

  // ── Catalog: Medication categories ────────────────────────────────────────

  async listMedicationCategories() {
    return db.categoriaMedicamento.findMany({ orderBy: { nombre: "asc" } });
  }

  async createMedicationCategory(nombre: string) {
    const exists = await db.categoriaMedicamento.findUnique({ where: { nombre } });
    if (exists) throw new ApiError(409, "ALREADY_EXISTS", "La categoría ya existe");
    return db.categoriaMedicamento.create({ data: { nombre } });
  }

  async updateMedicationCategory(id: string, nombre: string) {
    const exists = await db.categoriaMedicamento.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Categoría no encontrada");
    return db.categoriaMedicamento.update({ where: { id }, data: { nombre } });
  }

  // ── Catalog: Active ingredients ───────────────────────────────────────────

  async listActiveIngredients() {
    return db.principioActivo.findMany({ orderBy: { nombre: "asc" } });
  }

  async createActiveIngredient(nombre: string) {
    const exists = await db.principioActivo.findUnique({ where: { nombre } });
    if (exists) throw new ApiError(409, "ALREADY_EXISTS", "El principio activo ya existe");
    return db.principioActivo.create({ data: { nombre } });
  }

  async updateActiveIngredient(id: string, nombre: string) {
    const exists = await db.principioActivo.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Principio activo no encontrado");
    return db.principioActivo.update({ where: { id }, data: { nombre } });
  }

  // ── Catalog: Excipients ───────────────────────────────────────────────────

  async listExcipients() {
    return db.excipiente.findMany({ orderBy: { nombre: "asc" } });
  }

  async createExcipient(nombre: string) {
    const exists = await db.excipiente.findUnique({ where: { nombre } });
    if (exists) throw new ApiError(409, "ALREADY_EXISTS", "El excipiente ya existe");
    return db.excipiente.create({ data: { nombre } });
  }

  async updateExcipient(id: string, nombre: string) {
    const exists = await db.excipiente.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Excipiente no encontrado");
    return db.excipiente.update({ where: { id }, data: { nombre } });
  }

  // ── Catalog: Administration routes ───────────────────────────────────────

  async listAdministrationRoutes() {
    return db.viaAdministracion.findMany({ orderBy: { nombre: "asc" } });
  }

  async createAdministrationRoute(nombre: string) {
    const exists = await db.viaAdministracion.findUnique({ where: { nombre } });
    if (exists) throw new ApiError(409, "ALREADY_EXISTS", "La vía de administración ya existe");
    return db.viaAdministracion.create({ data: { nombre } });
  }

  async updateAdministrationRoute(id: string, nombre: string) {
    const exists = await db.viaAdministracion.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Vía de administración no encontrada");
    return db.viaAdministracion.update({ where: { id }, data: { nombre } });
  }

  // ── Catalog: Pharmaceutical forms ─────────────────────────────────────────

  async listPharmaceuticalForms() {
    return db.formaFarmaceutica.findMany({ orderBy: { nombre: "asc" } });
  }

  async createPharmaceuticalForm(nombre: string) {
    const exists = await db.formaFarmaceutica.findUnique({ where: { nombre } });
    if (exists) throw new ApiError(409, "ALREADY_EXISTS", "La forma farmacéutica ya existe");
    return db.formaFarmaceutica.create({ data: { nombre } });
  }

  async updatePharmaceuticalForm(id: string, nombre: string) {
    const exists = await db.formaFarmaceutica.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Forma farmacéutica no encontrada");
    return db.formaFarmaceutica.update({ where: { id }, data: { nombre } });
  }

  // ── Catalog: Packages ─────────────────────────────────────────────────────

  async listPackages() {
    return db.empaque.findMany({ orderBy: { nombre: "asc" } });
  }

  async createPackage(nombre: string) {
    const exists = await db.empaque.findUnique({ where: { nombre } });
    if (exists) throw new ApiError(409, "ALREADY_EXISTS", "El empaque ya existe");
    return db.empaque.create({ data: { nombre } });
  }

  async updatePackage(id: string, nombre: string) {
    const exists = await db.empaque.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Empaque no encontrado");
    return db.empaque.update({ where: { id }, data: { nombre } });
  }

  // ── Catalog: Laboratories ─────────────────────────────────────────────────

  async listLaboratories() {
    return db.laboratorio.findMany({
      include: { marcas: true },
      orderBy: { nombre: "asc" },
    });
  }

  async createLaboratory(nombre: string) {
    return db.laboratorio.create({ data: { nombre } });
  }

  async updateLaboratory(id: string, nombre: string) {
    const exists = await db.laboratorio.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Laboratorio no encontrado");
    return db.laboratorio.update({ where: { id }, data: { nombre } });
  }

  // ── Catalog: Brands ───────────────────────────────────────────────────────

  async listBrands() {
    return db.marca.findMany({
      include: { laboratorio: true },
      orderBy: { nombre: "asc" },
    });
  }

  async createBrand(data: { nombre: string; esGenerico: boolean; laboratorioId: string }) {
    const lab = await db.laboratorio.findUnique({ where: { id: data.laboratorioId } });
    if (!lab) throw new ApiError(404, "LABORATORY_NOT_FOUND", "Laboratorio no encontrado");
    return db.marca.create({ data, include: { laboratorio: true } });
  }

  async updateBrand(
    id: string,
    data: { nombre?: string; esGenerico?: boolean; laboratorioId?: string },
  ) {
    const exists = await db.marca.findUnique({ where: { id } });
    if (!exists) throw new ApiError(404, "NOT_FOUND", "Marca no encontrada");
    if (data.laboratorioId) {
      const lab = await db.laboratorio.findUnique({ where: { id: data.laboratorioId } });
      if (!lab) throw new ApiError(404, "LABORATORY_NOT_FOUND", "Laboratorio no encontrado");
    }
    return db.marca.update({ where: { id }, data, include: { laboratorio: true } });
  }
}

export const inventoryService = new InventoryService();
