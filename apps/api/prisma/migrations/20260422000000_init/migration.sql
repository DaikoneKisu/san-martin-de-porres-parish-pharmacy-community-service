
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fechaNac" DATETIME NOT NULL,
    "genero" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "lugarNac" TEXT NOT NULL,
    "residencia" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "HistorialMedico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "ultimaActualizacion" DATETIME,
    CONSTRAINT "HistorialMedico_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Antecedente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "historialMedicoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaRegistro" DATETIME,
    "adjuntos" TEXT NOT NULL DEFAULT '[]',
    "ultimaActualizacion" DATETIME NOT NULL,
    CONSTRAINT "Antecedente_historialMedicoId_fkey" FOREIGN KEY ("historialMedicoId") REFERENCES "HistorialMedico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoriaAntecedente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contabilizableId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "motivo" TEXT NOT NULL,
    "estadoPaciente" TEXT,
    "diagnostico" TEXT,
    "precioConsulta" DECIMAL NOT NULL,
    "adjuntos" TEXT NOT NULL DEFAULT '[]',
    "siguienteCitaId" TEXT,
    CONSTRAINT "Cita_contabilizableId_fkey" FOREIGN KEY ("contabilizableId") REFERENCES "Contabilizable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_siguienteCitaId_fkey" FOREIGN KEY ("siguienteCitaId") REFERENCES "Cita" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citaId" TEXT NOT NULL,
    "indicaciones" TEXT NOT NULL,
    "urlPdfCache" TEXT,
    CONSTRAINT "Recipe_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeExterno" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contabilizableId" TEXT NOT NULL,
    "indicaciones" TEXT,
    "adjuntoExterno" TEXT NOT NULL,
    CONSTRAINT "RecipeExterno_contabilizableId_fkey" FOREIGN KEY ("contabilizableId") REFERENCES "Contabilizable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "numeroLote" TEXT NOT NULL,
    "fechaVencimiento" DATETIME NOT NULL,
    "cantidad" REAL NOT NULL,
    "precioUnitarioReferencial" DECIMAL NOT NULL
);

-- CreateTable
CREATE TABLE "PresentacionMedicamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insumoId" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "viaAdministracionId" TEXT NOT NULL,
    "formaFarmaceuticaId" TEXT NOT NULL,
    "empaqueId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    CONSTRAINT "PresentacionMedicamento_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PresentacionMedicamento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PresentacionMedicamento_viaAdministracionId_fkey" FOREIGN KEY ("viaAdministracionId") REFERENCES "ViaAdministracion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PresentacionMedicamento_formaFarmaceuticaId_fkey" FOREIGN KEY ("formaFarmaceuticaId") REFERENCES "FormaFarmaceutica" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PresentacionMedicamento_empaqueId_fkey" FOREIGN KEY ("empaqueId") REFERENCES "Empaque" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialQuirurgico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insumoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    CONSTRAINT "MaterialQuirurgico_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Laboratorio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "esGenerico" BOOLEAN NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    CONSTRAINT "Marca_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "Laboratorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    CONSTRAINT "Medicamento_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoriaMedicamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PrincipioActivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MedicamentoPrincipioActivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicamentoId" TEXT NOT NULL,
    "principioActivoId" TEXT NOT NULL,
    "concentracion" TEXT NOT NULL,
    CONSTRAINT "MedicamentoPrincipioActivo_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MedicamentoPrincipioActivo_principioActivoId_fkey" FOREIGN KEY ("principioActivoId") REFERENCES "PrincipioActivo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Excipiente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MedicamentoExcipiente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicamentoId" TEXT NOT NULL,
    "excipienteId" TEXT NOT NULL,
    "concentracion" TEXT NOT NULL,
    CONSTRAINT "MedicamentoExcipiente_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MedicamentoExcipiente_excipienteId_fkey" FOREIGN KEY ("excipienteId") REFERENCES "Excipiente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViaAdministracion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FormaFarmaceutica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Empaque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InsumoConsumido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citaId" TEXT,
    "recipeExternoId" TEXT,
    "insumoId" TEXT NOT NULL,
    "cantidadDespachada" REAL NOT NULL,
    "precioUnitario" DECIMAL NOT NULL,
    CONSTRAINT "InsumoConsumido_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InsumoConsumido_recipeExternoId_fkey" FOREIGN KEY ("recipeExternoId") REFERENCES "RecipeExterno" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InsumoConsumido_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Donante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "esFijo" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "Donacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contabilizableId" TEXT NOT NULL,
    "donanteId" TEXT NOT NULL,
    "fechaRecepcion" DATETIME NOT NULL,
    "observaciones" TEXT NOT NULL,
    CONSTRAINT "Donacion_contabilizableId_fkey" FOREIGN KEY ("contabilizableId") REFERENCES "Contabilizable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Donacion_donanteId_fkey" FOREIGN KEY ("donanteId") REFERENCES "Donante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemDonacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donacionId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    CONSTRAINT "ItemDonacion_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "Donacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemDonacion_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contabilizable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AsientoContable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contabilizableId" TEXT,
    "fecha" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    CONSTRAINT "AsientoContable_contabilizableId_fkey" FOREIGN KEY ("contabilizableId") REFERENCES "Contabilizable" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditoriaPaciente" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaPaciente_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaPaciente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaPaciente_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaAntecedente" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "antecedenteId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaAntecedente_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaAntecedente_antecedenteId_fkey" FOREIGN KEY ("antecedenteId") REFERENCES "Antecedente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaAntecedente_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaCita" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "citaId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaCita_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaCita_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaCita_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaInsumo" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "insumoId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaInsumo_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaInsumo_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaInsumo_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaDonante" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "donanteId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaDonante_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaDonante_donanteId_fkey" FOREIGN KEY ("donanteId") REFERENCES "Donante" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaDonante_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaDonacion" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "donacionId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaDonacion_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaDonacion_donacionId_fkey" FOREIGN KEY ("donacionId") REFERENCES "Donacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaDonacion_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaAsientoContable" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "asientoId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaAsientoContable_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaAsientoContable_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "AsientoContable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaAsientoContable_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaRecipeExterno" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "recipeExternoId" TEXT NOT NULL,
    "personalId" TEXT,
    "accion" TEXT NOT NULL,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaRecipeExterno_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaRecipeExterno_recipeExternoId_fkey" FOREIGN KEY ("recipeExternoId") REFERENCES "RecipeExterno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaRecipeExterno_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaConsultaContable" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "personalId" TEXT NOT NULL,
    "tipoConsulta" TEXT NOT NULL,
    "parametros" TEXT,
    CONSTRAINT "AuditoriaConsultaContable_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaConsultaContable_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditoriaPersonal" (
    "auditoriaId" TEXT NOT NULL PRIMARY KEY,
    "personalId" TEXT NOT NULL,
    "actorId" TEXT,
    "accion" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    CONSTRAINT "AuditoriaPersonal_auditoriaId_fkey" FOREIGN KEY ("auditoriaId") REFERENCES "Auditoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaPersonal_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditoriaPersonal_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RolToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RolToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Rol" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RolToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AntecedenteToCategoriaAntecedente" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AntecedenteToCategoriaAntecedente_A_fkey" FOREIGN KEY ("A") REFERENCES "Antecedente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AntecedenteToCategoriaAntecedente_B_fkey" FOREIGN KEY ("B") REFERENCES "CategoriaAntecedente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CategoriaMedicamentoToMedicamento" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CategoriaMedicamentoToMedicamento_A_fkey" FOREIGN KEY ("A") REFERENCES "CategoriaMedicamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoriaMedicamentoToMedicamento_B_fkey" FOREIGN KEY ("B") REFERENCES "Medicamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cedula_key" ON "User"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cedula_key" ON "Paciente"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "HistorialMedico_pacienteId_key" ON "HistorialMedico"("pacienteId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaAntecedente_nombre_key" ON "CategoriaAntecedente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_contabilizableId_key" ON "Cita"("contabilizableId");

-- CreateIndex
CREATE UNIQUE INDEX "Cita_siguienteCitaId_key" ON "Cita"("siguienteCitaId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_citaId_key" ON "Recipe"("citaId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeExterno_contabilizableId_key" ON "RecipeExterno"("contabilizableId");

-- CreateIndex
CREATE UNIQUE INDEX "PresentacionMedicamento_insumoId_key" ON "PresentacionMedicamento"("insumoId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialQuirurgico_insumoId_key" ON "MaterialQuirurgico"("insumoId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaMedicamento_nombre_key" ON "CategoriaMedicamento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PrincipioActivo_nombre_key" ON "PrincipioActivo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MedicamentoPrincipioActivo_medicamentoId_principioActivoId_key" ON "MedicamentoPrincipioActivo"("medicamentoId", "principioActivoId");

-- CreateIndex
CREATE UNIQUE INDEX "Excipiente_nombre_key" ON "Excipiente"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MedicamentoExcipiente_medicamentoId_excipienteId_key" ON "MedicamentoExcipiente"("medicamentoId", "excipienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ViaAdministracion_nombre_key" ON "ViaAdministracion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "FormaFarmaceutica_nombre_key" ON "FormaFarmaceutica"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Empaque_nombre_key" ON "Empaque"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Donacion_contabilizableId_key" ON "Donacion"("contabilizableId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemDonacion_insumoId_key" ON "ItemDonacion"("insumoId");

-- CreateIndex
CREATE UNIQUE INDEX "_RolToUser_AB_unique" ON "_RolToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RolToUser_B_index" ON "_RolToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AntecedenteToCategoriaAntecedente_AB_unique" ON "_AntecedenteToCategoriaAntecedente"("A", "B");

-- CreateIndex
CREATE INDEX "_AntecedenteToCategoriaAntecedente_B_index" ON "_AntecedenteToCategoriaAntecedente"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoriaMedicamentoToMedicamento_AB_unique" ON "_CategoriaMedicamentoToMedicamento"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoriaMedicamentoToMedicamento_B_index" ON "_CategoriaMedicamentoToMedicamento"("B");

