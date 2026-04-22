import type { Prisma } from "@prisma/client";
import sanitizeHtml from "sanitize-html";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { UTApi, UTFile } from "uploadthing/server";
import { db } from "../../db";
import { env, appConfig } from "../../config";
import { ApiError } from "../../errors";

const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN });

const ALLOWED_HTML_TAGS = [
  "p", "br", "strong", "em", "u", "s",
  "ol", "ul", "li", "h1", "h2", "h3", "h4",
  "blockquote", "code", "pre",
];

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: {},
  });
}

function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}

function parseAdjuntos(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function computeStockDisponible(
  cantidad: number,
  consumidos: { cantidadDespachada: number }[],
): number {
  return (
    cantidad - consumidos.reduce((sum, ic) => sum + ic.cantidadDespachada, 0)
  );
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

  const stock = computeStockDisponible(
    Number(insumo.cantidad),
    insumo.insumosConsumidos,
  );
  if (stock <= 0)
    throw new ApiError(409, "OUT_OF_STOCK", `Sin stock disponible: ${insumoId}`);
  if (stock < cantidadSolicitada)
    throw new ApiError(409, "INSUFFICIENT_STOCK", `Stock insuficiente para: ${insumoId}`);
}

async function generateRecipePdf(
  indicaciones: string,
  patientName: string,
  doctorName: string,
  systemName: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const drawText = (text: string, options: { bold?: boolean; size?: number }) => {
    const f = options.bold ? boldFont : font;
    const size = options.size ?? 11;
    page.drawText(text, { x: margin, y, font: f, size, color: rgb(0, 0, 0) });
    y -= size + 6;
  };

  drawText(systemName, { bold: true, size: 16 });
  y -= 4;
  drawText("Récipe Médico", { bold: true, size: 13 });
  y -= 8;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 14;

  drawText(`Paciente: ${patientName}`, {});
  drawText(`Doctor: ${doctorName}`, {});
  drawText(`Fecha: ${new Date().toLocaleDateString("es-VE")}`, {});
  y -= 8;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 16;

  const text = stripHtml(indicaciones);
  const maxWidth = width - 2 * margin;
  const fontSize = 11;
  const lineHeight = 17;

  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    const testLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && line) {
      if (y < margin + lineHeight) break;
      page.drawText(line, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
      y -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line && y >= margin) {
    page.drawText(line, { x: margin, y, font, size: fontSize, color: rgb(0, 0, 0) });
  }

  return doc.save();
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export class MedicalService {
  async listPatients() {
    return db.paciente.findMany({ orderBy: { nombre: "asc" } });
  }

  async createPatient(
    data: {
      nombre: string;
      cedula: string;
      fechaNac: string;
      genero: string;
      telefono: string;
      lugarNac: string;
      residencia: string;
    },
    actorId: string,
  ) {
    const existing = await db.paciente.findUnique({ where: { cedula: data.cedula } });
    if (existing) throw new ApiError(409, "CEDULA_TAKEN", "Ya existe un paciente con esa cédula");

    return db.$transaction(async (tx) => {
      const patient = await tx.paciente.create({
        data: {
          nombre: data.nombre,
          cedula: data.cedula,
          fechaNac: new Date(data.fechaNac),
          genero: data.genero,
          telefono: data.telefono,
          lugarNac: data.lugarNac,
          residencia: data.residencia,
          historialMedico: { create: {} },
        },
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaPaciente.create({
        data: {
          auditoriaId: audit.id,
          pacienteId: patient.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(patient),
        },
      });

      return patient;
    });
  }

  async getPatient(id: string) {
    const patient = await db.paciente.findUnique({ where: { id } });
    if (!patient) throw new ApiError(404, "PATIENT_NOT_FOUND", "Paciente no encontrado");
    return patient;
  }

  async updatePatient(
    id: string,
    data: Partial<{
      nombre: string;
      cedula: string;
      fechaNac: string;
      genero: string;
      telefono: string;
      lugarNac: string;
      residencia: string;
    }>,
    actorId: string,
  ) {
    const existing = await db.paciente.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "PATIENT_NOT_FOUND", "Paciente no encontrado");

    if (data.cedula && data.cedula !== existing.cedula) {
      const taken = await db.paciente.findUnique({ where: { cedula: data.cedula } });
      if (taken) throw new ApiError(409, "CEDULA_TAKEN", "Ya existe un paciente con esa cédula");
    }

    return db.$transaction(async (tx) => {
      const updated = await tx.paciente.update({
        where: { id },
        data: {
          ...data,
          fechaNac: data.fechaNac ? new Date(data.fechaNac) : undefined,
        },
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaPaciente.create({
        data: {
          auditoriaId: audit.id,
          pacienteId: id,
          personalId: actorId,
          accion: "EDICION",
          datosAnteriores: JSON.stringify(existing),
          datosNuevos: JSON.stringify(updated),
        },
      });

      return updated;
    });
  }

  // ─── Medical History ──────────────────────────────────────────────────────

  async getMedicalHistory(patientId: string) {
    const patient = await db.paciente.findUnique({ where: { id: patientId } });
    if (!patient) throw new ApiError(404, "PATIENT_NOT_FOUND", "Paciente no encontrado");

    const history = await db.historialMedico.findUnique({
      where: { pacienteId: patientId },
      include: {
        antecedentes: {
          include: { categorias: true },
          orderBy: { ultimaActualizacion: "desc" },
        },
      },
    });

    if (!history) throw new ApiError(404, "HISTORY_NOT_FOUND", "Historial médico no encontrado");

    return {
      ...history,
      antecedentes: history.antecedentes.map((a) => ({
        ...a,
        adjuntos: parseAdjuntos(a.adjuntos),
      })),
    };
  }

  // ─── Antecedents ──────────────────────────────────────────────────────────

  async listAntecedents(patientId: string) {
    const patient = await db.paciente.findUnique({ where: { id: patientId } });
    if (!patient) throw new ApiError(404, "PATIENT_NOT_FOUND", "Paciente no encontrado");

    const history = await db.historialMedico.findUnique({ where: { pacienteId: patientId } });
    if (!history) throw new ApiError(404, "HISTORY_NOT_FOUND", "Historial médico no encontrado");

    const antecedents = await db.antecedente.findMany({
      where: { historialMedicoId: history.id },
      include: { categorias: true },
      orderBy: { ultimaActualizacion: "desc" },
    });

    return antecedents.map((a) => ({ ...a, adjuntos: parseAdjuntos(a.adjuntos) }));
  }

  async createAntecedent(
    patientId: string,
    data: {
      descripcion: string;
      fechaRegistro?: string;
      adjuntos?: string[];
      categoriaIds?: string[];
    },
    actorId: string,
  ) {
    const history = await db.historialMedico.findUnique({ where: { pacienteId: patientId } });
    if (!history) throw new ApiError(404, "HISTORY_NOT_FOUND", "Historial médico no encontrado");

    return db.$transaction(async (tx) => {
      const antecedent = await tx.antecedente.create({
        data: {
          historialMedicoId: history.id,
          descripcion: data.descripcion,
          fechaRegistro: data.fechaRegistro ? new Date(data.fechaRegistro) : undefined,
          adjuntos: JSON.stringify(data.adjuntos ?? []),
          ultimaActualizacion: new Date(),
          categorias: data.categoriaIds?.length
            ? { connect: data.categoriaIds.map((id) => ({ id })) }
            : undefined,
        },
        include: { categorias: true },
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaAntecedente.create({
        data: {
          auditoriaId: audit.id,
          antecedenteId: antecedent.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(antecedent),
        },
      });

      return { ...antecedent, adjuntos: parseAdjuntos(antecedent.adjuntos) };
    });
  }

  async updateAntecedent(
    patientId: string,
    antecedentId: string,
    data: Partial<{
      descripcion: string;
      fechaRegistro?: string;
      adjuntos?: string[];
      categoriaIds?: string[];
    }>,
    actorId: string,
  ) {
    const history = await db.historialMedico.findUnique({ where: { pacienteId: patientId } });
    if (!history) throw new ApiError(404, "HISTORY_NOT_FOUND", "Historial médico no encontrado");

    const existing = await db.antecedente.findUnique({
      where: { id: antecedentId, historialMedicoId: history.id },
    });
    if (!existing) throw new ApiError(404, "ANTECEDENT_NOT_FOUND", "Antecedente no encontrado");

    return db.$transaction(async (tx) => {
      const updated = await tx.antecedente.update({
        where: { id: antecedentId },
        data: {
          descripcion: data.descripcion,
          fechaRegistro: data.fechaRegistro ? new Date(data.fechaRegistro) : undefined,
          adjuntos: data.adjuntos !== undefined ? JSON.stringify(data.adjuntos) : undefined,
          ultimaActualizacion: new Date(),
          categorias: data.categoriaIds !== undefined
            ? { set: data.categoriaIds.map((id) => ({ id })) }
            : undefined,
        },
        include: { categorias: true },
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaAntecedente.create({
        data: {
          auditoriaId: audit.id,
          antecedenteId: antecedentId,
          personalId: actorId,
          accion: "EDICION",
          datosAnteriores: JSON.stringify(existing),
          datosNuevos: JSON.stringify(updated),
        },
      });

      return { ...updated, adjuntos: parseAdjuntos(updated.adjuntos) };
    });
  }

  // ─── Antecedent Categories ────────────────────────────────────────────────

  async listAntecedentCategories() {
    return db.categoriaAntecedente.findMany({ orderBy: { nombre: "asc" } });
  }

  // ─── Appointments ─────────────────────────────────────────────────────────

  async listAppointments() {
    const appointments = await db.cita.findMany({
      include: {
        paciente: true,
        personal: { select: { id: true, nombre: true, cedula: true } },
        recipe: true,
      },
      orderBy: { fechaHora: "desc" },
    });
    return appointments.map((c) => ({ ...c, adjuntos: parseAdjuntos(c.adjuntos) }));
  }

  async createAppointment(
    data: {
      pacienteId: string;
      personalId: string;
      fechaHora: string;
      motivo: string;
      precioConsulta: number;
      adjuntos?: string[];
      siguienteCitaId?: string;
    },
    actorId: string,
  ) {
    const fechaHora = new Date(data.fechaHora);
    const gapMs = appConfig.agenda.tiempo_entre_citas_minutos * 60_000;

    const conflicting = await db.cita.findFirst({
      where: {
        personalId: data.personalId,
        fechaHora: {
          gt: new Date(fechaHora.getTime() - gapMs),
          lt: new Date(fechaHora.getTime() + gapMs),
        },
      },
    });
    if (conflicting)
      throw new ApiError(409, "SCHEDULE_CONFLICT", "El médico tiene otra cita en ese horario");

    const motivo = sanitize(data.motivo);

    return db.$transaction(async (tx) => {
      const contabilizable = await tx.contabilizable.create({ data: { tipo: "CITA" } });

      await tx.asientoContable.create({
        data: {
          contabilizableId: contabilizable.id,
          fecha: fechaHora,
          tipo: "INGRESO",
          concepto: "Consulta médica",
          monto: data.precioConsulta,
        },
      });

      const cita = await tx.cita.create({
        data: {
          contabilizableId: contabilizable.id,
          pacienteId: data.pacienteId,
          personalId: data.personalId,
          fechaHora,
          motivo,
          precioConsulta: data.precioConsulta,
          adjuntos: JSON.stringify(data.adjuntos ?? []),
          siguienteCitaId: data.siguienteCitaId,
        },
        include: {
          paciente: true,
          personal: { select: { id: true, nombre: true, cedula: true } },
        },
      });

      const audit = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaCita.create({
        data: {
          auditoriaId: audit.id,
          citaId: cita.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(cita),
        },
      });

      return { ...cita, adjuntos: parseAdjuntos(cita.adjuntos) };
    });
  }

  async getAppointment(id: string) {
    const cita = await db.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        personal: { select: { id: true, nombre: true, cedula: true } },
        recipe: true,
        insumosConsumidos: {
          include: {
            insumo: {
              include: { insumosConsumidos: { select: { cantidadDespachada: true } } },
            },
          },
        },
      },
    });
    if (!cita) throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Cita no encontrada");

    return {
      ...cita,
      adjuntos: parseAdjuntos(cita.adjuntos),
      insumosConsumidos: cita.insumosConsumidos.map((ic) => ({
        ...ic,
        insumo: {
          ...ic.insumo,
          stockDisponible: computeStockDisponible(
            Number(ic.insumo.cantidad),
            ic.insumo.insumosConsumidos,
          ),
        },
      })),
    };
  }

  async updateAppointmentResult(
    id: string,
    data: {
      estadoPaciente?: string;
      diagnostico?: string;
      recipe?: { indicaciones: string };
      insumosConsumidos?: { insumoId: string; cantidadDespachada: number; precioUnitario: number }[];
    },
    actorId: string,
  ) {
    const cita = await db.cita.findUnique({
      where: { id },
      include: { recipe: true },
    });
    if (!cita) throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Cita no encontrada");

    const estadoPaciente = data.estadoPaciente ? sanitize(data.estadoPaciente) : undefined;
    const diagnostico = data.diagnostico ? sanitize(data.diagnostico) : undefined;
    const indicaciones = data.recipe?.indicaciones ? sanitize(data.recipe.indicaciones) : undefined;

    return db.$transaction(async (tx) => {
      for (const ic of data.insumosConsumidos ?? []) {
        await validateStockTx(tx, ic.insumoId, ic.cantidadDespachada);
      }

      const updatedCita = await tx.cita.update({
        where: { id },
        data: { estadoPaciente, diagnostico },
      });

      let recipe = cita.recipe;
      if (indicaciones !== undefined) {
        if (recipe) {
          recipe = await tx.recipe.update({
            where: { id: recipe.id },
            data: { indicaciones, urlPdfCache: null },
          });
        } else {
          recipe = await tx.recipe.create({
            data: { citaId: id, indicaciones },
          });
        }
      }

      const insumosCreados = [];
      for (const ic of data.insumosConsumidos ?? []) {
        const created = await tx.insumoConsumido.create({
          data: {
            citaId: id,
            insumoId: ic.insumoId,
            cantidadDespachada: ic.cantidadDespachada,
            precioUnitario: ic.precioUnitario,
          },
        });
        insumosCreados.push({ ...created, insumoId: ic.insumoId });
      }

      const auditCita = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaCita.create({
        data: {
          auditoriaId: auditCita.id,
          citaId: id,
          personalId: actorId,
          accion: "EDICION_RESULTADO",
          datosAnteriores: JSON.stringify(cita),
          datosNuevos: JSON.stringify(updatedCita),
        },
      });

      for (const ic of insumosCreados) {
        const auditInsumo = await tx.auditoria.create({ data: { fecha: new Date() } });
        await tx.auditoriaInsumo.create({
          data: {
            auditoriaId: auditInsumo.id,
            insumoId: ic.insumoId,
            personalId: actorId,
            accion: "DISPENSACION",
            datosNuevos: JSON.stringify(ic),
          },
        });
      }

      return { ...updatedCita, recipe };
    });
  }

  async getAppointmentRecipePdf(id: string): Promise<string> {
    const cita = await db.cita.findUnique({
      where: { id },
      include: {
        recipe: true,
        paciente: true,
        personal: { select: { nombre: true } },
      },
    });
    if (!cita) throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Cita no encontrada");
    if (!cita.recipe) throw new ApiError(404, "RECIPE_NOT_FOUND", "Esta cita no tiene récipe");

    if (cita.recipe.urlPdfCache) return cita.recipe.urlPdfCache;

    const pdfBytes = await generateRecipePdf(
      cita.recipe.indicaciones,
      cita.paciente.nombre,
      cita.personal.nombre,
      appConfig.sistema.nombre,
    );

    const file = new UTFile([pdfBytes], `recipe-${cita.recipe.id}.pdf`, {
      type: "application/pdf",
    });
    const result = await utapi.uploadFiles(file);
    if (result.error)
      throw new ApiError(500, "PDF_UPLOAD_FAILED", "Error al subir el PDF a UploadThing");

    const pdfUrl = result.data.ufsUrl;

    await db.recipe.update({
      where: { id: cita.recipe.id },
      data: { urlPdfCache: pdfUrl },
    });

    return pdfUrl;
  }

  // ─── External Recipes ─────────────────────────────────────────────────────

  async listExternalRecipes() {
    const recipes = await db.recipeExterno.findMany({
      include: {
        insumosConsumidos: {
          include: {
            insumo: {
              include: { insumosConsumidos: { select: { cantidadDespachada: true } } },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return recipes.map((r) => ({
      ...r,
      insumosConsumidos: r.insumosConsumidos.map((ic) => ({
        ...ic,
        insumo: {
          ...ic.insumo,
          stockDisponible: computeStockDisponible(
            Number(ic.insumo.cantidad),
            ic.insumo.insumosConsumidos,
          ),
        },
      })),
    }));
  }

  async createExternalRecipe(
    data: {
      indicaciones?: string;
      adjuntoExterno: string;
      insumosConsumidos: { insumoId: string; cantidadDespachada: number; precioUnitario: number }[];
    },
    actorId: string,
  ) {
    const indicaciones = data.indicaciones ? sanitize(data.indicaciones) : undefined;

    return db.$transaction(async (tx) => {
      for (const ic of data.insumosConsumidos) {
        await validateStockTx(tx, ic.insumoId, ic.cantidadDespachada);
      }

      const monto = data.insumosConsumidos.reduce(
        (sum, ic) => sum + ic.cantidadDespachada * ic.precioUnitario,
        0,
      );

      const contabilizable = await tx.contabilizable.create({
        data: { tipo: "RECIPE_EXTERNO" },
      });

      await tx.asientoContable.create({
        data: {
          contabilizableId: contabilizable.id,
          fecha: new Date(),
          tipo: "INGRESO",
          concepto: "Récipe externo",
          monto,
        },
      });

      const recipe = await tx.recipeExterno.create({
        data: {
          contabilizableId: contabilizable.id,
          indicaciones,
          adjuntoExterno: data.adjuntoExterno,
        },
      });

      const insumosCreados = [];
      for (const ic of data.insumosConsumidos) {
        const created = await tx.insumoConsumido.create({
          data: {
            recipeExternoId: recipe.id,
            insumoId: ic.insumoId,
            cantidadDespachada: ic.cantidadDespachada,
            precioUnitario: ic.precioUnitario,
          },
        });
        insumosCreados.push({ ...created, insumoId: ic.insumoId });
      }

      const auditRecipe = await tx.auditoria.create({ data: { fecha: new Date() } });
      await tx.auditoriaRecipeExterno.create({
        data: {
          auditoriaId: auditRecipe.id,
          recipeExternoId: recipe.id,
          personalId: actorId,
          accion: "REGISTRO",
          datosNuevos: JSON.stringify(recipe),
        },
      });

      for (const ic of insumosCreados) {
        const auditInsumo = await tx.auditoria.create({ data: { fecha: new Date() } });
        await tx.auditoriaInsumo.create({
          data: {
            auditoriaId: auditInsumo.id,
            insumoId: ic.insumoId,
            personalId: actorId,
            accion: "DISPENSACION",
            datosNuevos: JSON.stringify(ic),
          },
        });
      }

      return recipe;
    });
  }

  async getExternalRecipe(id: string) {
    const recipe = await db.recipeExterno.findUnique({
      where: { id },
      include: {
        insumosConsumidos: {
          include: {
            insumo: {
              include: { insumosConsumidos: { select: { cantidadDespachada: true } } },
            },
          },
        },
      },
    });
    if (!recipe) throw new ApiError(404, "EXTERNAL_RECIPE_NOT_FOUND", "Récipe externo no encontrado");

    return {
      ...recipe,
      insumosConsumidos: recipe.insumosConsumidos.map((ic) => ({
        ...ic,
        insumo: {
          ...ic.insumo,
          stockDisponible: computeStockDisponible(
            Number(ic.insumo.cantidad),
            ic.insumo.insumosConsumidos,
          ),
        },
      })),
    };
  }
}

export const medicalService = new MedicalService();
