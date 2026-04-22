import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { auth } from "../../auth";
import { db } from "../../db";
import { ApiError } from "../../errors";
import { appConfig, reloadConfig } from "../../config";
import { hashPassword } from "better-auth/crypto";
import { sendWelcomeEmail } from "./email";

const CONFIG_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../config.json",
);

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

const STAFF_INCLUDE = {
  roles: true,
} as const;

export class AdminService {
  // ── Staff ──────────────────────────────────────────────────────────────────

  async listStaff() {
    return db.user.findMany({
      include: STAFF_INCLUDE,
      orderBy: { nombre: "asc" },
    });
  }

  async createStaff(
    data: {
      nombre: string;
      cedula: string;
      telefono: string;
      email: string;
      roles: string[];
    },
    actorId: string,
  ) {
    const roles = await db.rol.findMany({
      where: { nombre: { in: data.roles } },
    });
    if (roles.length !== data.roles.length)
      throw new ApiError(422, "INVALID_ROLES", "Uno o más roles no existen");

    const password = generatePassword();

    const result = await (auth.api.signUpEmail as unknown as (ctx: { body: Record<string, unknown> }) => Promise<{ user: { id: string } } | null>)({
      body: {
        name: data.nombre,
        email: data.email,
        password,
        nombre: data.nombre,
        cedula: data.cedula,
        telefono: data.telefono,
      },
    });

    if (!result || !result.user)
      throw new ApiError(500, "CREATE_FAILED", "Error al crear el usuario");

    const userId = result.user.id;

    await db.user.update({
      where: { id: userId },
      data: { roles: { set: roles.map((r) => ({ id: r.id })) } },
    });

    const audit = await db.auditoria.create({ data: { fecha: new Date() } });
    await db.auditoriaPersonal.create({
      data: {
        auditoriaId: audit.id,
        personalId: userId,
        actorId,
        accion: "REGISTRO",
        datosNuevos: JSON.stringify({ nombre: data.nombre, email: data.email, roles: data.roles }),
      },
    });

    await sendWelcomeEmail({ nombre: data.nombre, email: data.email, password });

    return db.user.findUnique({ where: { id: userId }, include: STAFF_INCLUDE });
  }

  async getStaff(id: string) {
    const user = await db.user.findUnique({ where: { id }, include: STAFF_INCLUDE });
    if (!user) throw new ApiError(404, "NOT_FOUND", "Personal no encontrado");
    return user;
  }

  async updateStaff(
    id: string,
    data: {
      nombre?: string;
      cedula?: string;
      telefono?: string;
      roles?: string[];
      password?: string;
    },
    actorId: string,
  ) {
    const existing = await db.user.findUnique({ where: { id }, include: STAFF_INCLUDE });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Personal no encontrado");

    let roleConnect: { id: string }[] | undefined;
    if (data.roles !== undefined) {
      const roles = await db.rol.findMany({ where: { nombre: { in: data.roles } } });
      if (roles.length !== data.roles.length)
        throw new ApiError(422, "INVALID_ROLES", "Uno o más roles no existen");
      roleConnect = roles.map((r) => ({ id: r.id }));
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre, name: data.nombre }),
        ...(data.cedula && { cedula: data.cedula }),
        ...(data.telefono && { telefono: data.telefono }),
        ...(roleConnect && { roles: { set: roleConnect } }),
      },
      include: STAFF_INCLUDE,
    });

    if (data.password) {
      const hashed = await hashPassword(data.password);
      await db.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: hashed },
      });
    }

    const audit = await db.auditoria.create({ data: { fecha: new Date() } });
    await db.auditoriaPersonal.create({
      data: {
        auditoriaId: audit.id,
        personalId: id,
        actorId,
        accion: "EDICION",
        datosAnteriores: JSON.stringify({ nombre: existing.nombre, cedula: existing.cedula, telefono: existing.telefono }),
        datosNuevos: JSON.stringify(data),
      },
    });

    return updated;
  }

  async deactivateStaff(id: string, actorId: string) {
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Personal no encontrado");
    if (!existing.activo) throw new ApiError(409, "ALREADY_INACTIVE", "El usuario ya está inactivo");

    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { activo: false } });
      await tx.session.deleteMany({ where: { userId: id } });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaPersonal.create({
        data: {
          auditoriaId: audit.id,
          personalId: id,
          actorId,
          accion: "DESACTIVACION",
          datosAnteriores: JSON.stringify({ activo: true }),
          datosNuevos: JSON.stringify({ activo: false }),
        },
      });
    });

    return db.user.findUnique({ where: { id }, include: STAFF_INCLUDE });
  }

  async activateStaff(id: string, actorId: string) {
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Personal no encontrado");
    if (existing.activo) throw new ApiError(409, "ALREADY_ACTIVE", "El usuario ya está activo");

    const updated = await db.user.update({ where: { id }, data: { activo: true }, include: STAFF_INCLUDE });

    const audit = await db.auditoria.create({ data: { fecha: new Date() } });
    await db.auditoriaPersonal.create({
      data: {
        auditoriaId: audit.id,
        personalId: id,
        actorId,
        accion: "ACTIVACION",
        datosAnteriores: JSON.stringify({ activo: false }),
        datosNuevos: JSON.stringify({ activo: true }),
      },
    });

    return updated;
  }

  // ── Roles ──────────────────────────────────────────────────────────────────

  async listRoles() {
    return db.rol.findMany({ orderBy: { nombre: "asc" } });
  }

  // ── Config ─────────────────────────────────────────────────────────────────

  getConfig() {
    return appConfig;
  }

  patchConfig(patch: {
    agenda?: { tiempo_entre_citas_minutos?: number; hora_inicio?: string; hora_fin?: string; dias_habiles?: string[] };
    contabilidad?: { actualizar_tasa_cada_horas?: number };
    sistema?: { nombre?: string; version?: string };
  }) {
    const updated = {
      agenda: { ...appConfig.agenda, ...patch.agenda } as typeof appConfig.agenda,
      contabilidad: { ...appConfig.contabilidad, ...patch.contabilidad },
      sistema: { ...appConfig.sistema, ...patch.sistema },
    };

    if (updated.agenda.hora_inicio >= updated.agenda.hora_fin)
      throw new ApiError(422, "INVALID_CONFIG", "hora_inicio debe ser anterior a hora_fin");

    writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
    reloadConfig();

    return appConfig;
  }
}

export const adminService = new AdminService();
