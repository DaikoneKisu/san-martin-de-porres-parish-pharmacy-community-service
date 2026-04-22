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

const DONOR_INCLUDE = {
  donaciones: { select: { id: true } },
} satisfies Prisma.DonanteInclude;

const DONATION_ITEM_INSUMO_INCLUDE = {
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

const DONATION_INCLUDE = {
  donante: true,
  contabilizable: { include: { asientosContables: true } },
  items: {
    include: { insumo: { include: DONATION_ITEM_INSUMO_INCLUDE } },
  },
} satisfies Prisma.DonacionInclude;

type DonationPayload = Prisma.DonacionGetPayload<{ include: typeof DONATION_INCLUDE }>;

function mapDonation(donacion: DonationPayload) {
  return {
    ...donacion,
    items: donacion.items.map((item) => ({
      ...item,
      insumo: {
        ...item.insumo,
        stockDisponible: computeStockDisponible(
          Number(item.insumo.cantidad),
          item.insumo.insumosConsumidos,
        ),
      },
    })),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DonationItemInput =
  | {
      tipo: "MEDICAMENTO";
      medicamentoId: string;
      viaAdministracionId: string;
      formaFarmaceuticaId: string;
      empaqueId: string;
      cantidadPorEmpaque: number;
      numeroLote: string;
      fechaVencimiento: string;
      cantidad: number;
      precioUnitarioReferencial: number;
    }
  | {
      tipo: "MATERIAL";
      nombre: string;
      numeroLote: string;
      fechaVencimiento: string;
      cantidad: number;
      precioUnitarioReferencial: number;
    };

// ─── Service ──────────────────────────────────────────────────────────────────

export class DonationsService {
  // ── Donors ─────────────────────────────────────────────────────────────────

  async listDonors() {
    return db.donante.findMany({ include: DONOR_INCLUDE, orderBy: { nombre: "asc" } });
  }

  async createDonor(
    data: { nombre: string; pais: string; contacto: string; esFijo: boolean },
    actorId: string,
  ) {
    return db.$transaction(async (tx) => {
      const donante = await tx.donante.create({ data, include: DONOR_INCLUDE });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaDonante.create({
        data: {
          auditoriaId: audit.id,
          donanteId: donante.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(donante),
        },
      });

      return donante;
    });
  }

  async getDonor(id: string) {
    const donante = await db.donante.findUnique({ where: { id }, include: DONOR_INCLUDE });
    if (!donante) throw new ApiError(404, "DONOR_NOT_FOUND", "Donante no encontrado");
    return donante;
  }

  async updateDonor(
    id: string,
    data: { nombre?: string; pais?: string; contacto?: string; esFijo?: boolean },
    actorId: string,
  ) {
    const existing = await db.donante.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "DONOR_NOT_FOUND", "Donante no encontrado");

    return db.$transaction(async (tx) => {
      const updated = await tx.donante.update({ where: { id }, data, include: DONOR_INCLUDE });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaDonante.create({
        data: {
          auditoriaId: audit.id,
          donanteId: id,
          personalId: actorId,
          accion: "EDICION",
          datosAnteriores: JSON.stringify(existing),
          datosNuevos: JSON.stringify(updated),
        },
      });

      return updated;
    });
  }

  // ── Donations ──────────────────────────────────────────────────────────────

  async listDonations() {
    const donaciones = await db.donacion.findMany({
      include: DONATION_INCLUDE,
      orderBy: { fechaRecepcion: "desc" },
    });
    return donaciones.map(mapDonation);
  }

  async createDonation(
    data: {
      donanteId: string;
      fechaRecepcion: string;
      observaciones: string;
      items: DonationItemInput[];
    },
    actorId: string,
  ) {
    const donante = await db.donante.findUnique({ where: { id: data.donanteId } });
    if (!donante) throw new ApiError(404, "DONOR_NOT_FOUND", "Donante no encontrado");

    const donacionId = await db.$transaction(async (tx) => {
      // 1. Crear Contabilizable
      const contabilizable = await tx.contabilizable.create({ data: { tipo: "DONACION" } });

      // 2. Crear Donacion
      const donacion = await tx.donacion.create({
        data: {
          contabilizableId: contabilizable.id,
          donanteId: data.donanteId,
          fechaRecepcion: new Date(data.fechaRecepcion),
          observaciones: data.observaciones,
        },
      });

      // 3. Por cada item: crear Insumo + subtipo + ItemDonacion
      const insumoIds: string[] = [];
      for (const item of data.items) {
        const insumo = await tx.insumo.create({
          data: {
            tipo: item.tipo,
            numeroLote: item.numeroLote,
            fechaVencimiento: new Date(item.fechaVencimiento),
            cantidad: item.cantidad,
            precioUnitarioReferencial: item.precioUnitarioReferencial,
            ...(item.tipo === "MEDICAMENTO"
              ? {
                  presentacionMedicamento: {
                    create: {
                      medicamentoId: item.medicamentoId,
                      viaAdministracionId: item.viaAdministracionId,
                      formaFarmaceuticaId: item.formaFarmaceuticaId,
                      empaqueId: item.empaqueId,
                      cantidad: item.cantidadPorEmpaque,
                    },
                  },
                }
              : {
                  materialQuirurgico: {
                    create: { nombre: item.nombre },
                  },
                }),
            itemDonacion: {
              create: { donacionId: donacion.id },
            },
          },
        });
        insumoIds.push(insumo.id);
      }

      // 4. Crear AsientoContable
      const asiento = await tx.asientoContable.create({
        data: {
          contabilizableId: contabilizable.id,
          fecha: new Date(),
          tipo: "INGRESO",
          concepto: `Donación de ${donante.nombre}`,
          monto: 0,
        },
      });

      // Auditoría del asiento (efecto colateral del sistema, personalId=null)
      const auditAsiento = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaAsientoContable.create({
        data: {
          auditoriaId: auditAsiento.id,
          asientoId: asiento.id,
          personalId: null,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(asiento),
        },
      });

      // 5. AuditoriaDonacion
      const auditDonacion = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaDonacion.create({
        data: {
          auditoriaId: auditDonacion.id,
          donacionId: donacion.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(donacion),
        },
      });

      // 6. AuditoriaInsumo por cada insumo
      for (const insumoId of insumoIds) {
        const auditInsumo = await tx.auditoria.create({ data: { fecha: new Date() } });
        await tx.auditoriaInsumo.create({
          data: {
            auditoriaId: auditInsumo.id,
            insumoId,
            personalId: actorId,
            accion: "REGISTRO",
            datosNuevos: JSON.stringify({ insumoId }),
          },
        });
      }

      return donacion.id;
    });

    const result = await db.donacion.findUnique({
      where: { id: donacionId },
      include: DONATION_INCLUDE,
    });
    return mapDonation(result!);
  }

  async getDonation(id: string) {
    const donacion = await db.donacion.findUnique({ where: { id }, include: DONATION_INCLUDE });
    if (!donacion) throw new ApiError(404, "DONATION_NOT_FOUND", "Donación no encontrada");
    return mapDonation(donacion);
  }
}

export const donationsService = new DonationsService();
