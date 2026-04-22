import { Elysia } from "elysia";
import { authMacro } from "../../plugins/auth-macro";
import { inventoryService } from "./service";
import * as m from "./model";

export const inventoryModule = new Elysia({ prefix: "/api/inventory" })
  .use(authMacro)
  .guard({ requireAuth: true }, (app) =>
    app
      // ── Supplies ────────────────────────────────────────────────────────────
      .get("/supplies", () => inventoryService.listSupplies())

      .get("/supplies/:id", ({ params }) => inventoryService.getSupply(params.id), {
        params: m.IdParam,
      })

      .patch(
        "/supplies/:id",
        ({ params, body, user }) =>
          inventoryService.updateSupply(params.id, body, user.id),
        { params: m.IdParam, body: m.UpdateSupplyBody },
      )

      .post(
        "/supplies/:id/dispense",
        ({ params, body, user }) =>
          inventoryService.dispenseSupply(params.id, body, user.id),
        { params: m.IdParam, body: m.DispenseSupplyBody },
      )

      // ── Surgical materials ──────────────────────────────────────────────────
      .get("/surgical-materials", () => inventoryService.listSurgicalMaterials())

      .post(
        "/surgical-materials",
        ({ body, user }) => inventoryService.createSurgicalMaterial(body, user.id),
        { body: m.CreateSurgicalMaterialBody },
      )

      .get(
        "/surgical-materials/:id",
        ({ params }) => inventoryService.getSurgicalMaterial(params.id),
        { params: m.IdParam },
      )

      .patch(
        "/surgical-materials/:id",
        ({ params, body, user }) =>
          inventoryService.updateSurgicalMaterial(params.id, body, user.id),
        { params: m.IdParam, body: m.UpdateSurgicalMaterialBody },
      )

      // ── Medications ─────────────────────────────────────────────────────────
      .get("/medications", () => inventoryService.listMedications())

      .post(
        "/medications",
        ({ body }) => inventoryService.createMedication(body),
        { body: m.CreateMedicationBody },
      )

      .get("/medications/:id", ({ params }) => inventoryService.getMedication(params.id), {
        params: m.IdParam,
      })

      .patch(
        "/medications/:id",
        ({ params, body }) => inventoryService.updateMedication(params.id, body),
        { params: m.IdParam, body: m.UpdateMedicationBody },
      )

      // ── Medication categories ────────────────────────────────────────────────
      .get("/medication-categories", () => inventoryService.listMedicationCategories())

      .post(
        "/medication-categories",
        ({ body }) => inventoryService.createMedicationCategory(body.nombre),
        { body: m.NombreBody },
      )

      .patch(
        "/medication-categories/:id",
        ({ params, body }) =>
          inventoryService.updateMedicationCategory(params.id, body.nombre),
        { params: m.IdParam, body: m.NombreBody },
      )

      // ── Active ingredients ───────────────────────────────────────────────────
      .get("/active-ingredients", () => inventoryService.listActiveIngredients())

      .post(
        "/active-ingredients",
        ({ body }) => inventoryService.createActiveIngredient(body.nombre),
        { body: m.NombreBody },
      )

      .patch(
        "/active-ingredients/:id",
        ({ params, body }) =>
          inventoryService.updateActiveIngredient(params.id, body.nombre),
        { params: m.IdParam, body: m.NombreBody },
      )

      // ── Excipients ──────────────────────────────────────────────────────────
      .get("/excipients", () => inventoryService.listExcipients())

      .post(
        "/excipients",
        ({ body }) => inventoryService.createExcipient(body.nombre),
        { body: m.NombreBody },
      )

      .patch(
        "/excipients/:id",
        ({ params, body }) => inventoryService.updateExcipient(params.id, body.nombre),
        { params: m.IdParam, body: m.NombreBody },
      )

      // ── Administration routes ───────────────────────────────────────────────
      .get("/administration-routes", () => inventoryService.listAdministrationRoutes())

      .post(
        "/administration-routes",
        ({ body }) => inventoryService.createAdministrationRoute(body.nombre),
        { body: m.NombreBody },
      )

      .patch(
        "/administration-routes/:id",
        ({ params, body }) =>
          inventoryService.updateAdministrationRoute(params.id, body.nombre),
        { params: m.IdParam, body: m.NombreBody },
      )

      // ── Pharmaceutical forms ────────────────────────────────────────────────
      .get("/pharmaceutical-forms", () => inventoryService.listPharmaceuticalForms())

      .post(
        "/pharmaceutical-forms",
        ({ body }) => inventoryService.createPharmaceuticalForm(body.nombre),
        { body: m.NombreBody },
      )

      .patch(
        "/pharmaceutical-forms/:id",
        ({ params, body }) =>
          inventoryService.updatePharmaceuticalForm(params.id, body.nombre),
        { params: m.IdParam, body: m.NombreBody },
      )

      // ── Packages ────────────────────────────────────────────────────────────
      .get("/packages", () => inventoryService.listPackages())

      .post(
        "/packages",
        ({ body }) => inventoryService.createPackage(body.nombre),
        { body: m.NombreBody },
      )

      .patch(
        "/packages/:id",
        ({ params, body }) => inventoryService.updatePackage(params.id, body.nombre),
        { params: m.IdParam, body: m.NombreBody },
      )

      // ── Laboratories ────────────────────────────────────────────────────────
      .get("/laboratories", () => inventoryService.listLaboratories())

      .post(
        "/laboratories",
        ({ body }) => inventoryService.createLaboratory(body.nombre),
        { body: m.NombreBody },
      )

      .patch(
        "/laboratories/:id",
        ({ params, body }) =>
          inventoryService.updateLaboratory(params.id, body.nombre),
        { params: m.IdParam, body: m.NombreBody },
      )

      // ── Brands ──────────────────────────────────────────────────────────────
      .get("/brands", () => inventoryService.listBrands())

      .post(
        "/brands",
        ({ body }) => inventoryService.createBrand(body),
        { body: m.CreateBrandBody },
      )

      .patch(
        "/brands/:id",
        ({ params, body }) => inventoryService.updateBrand(params.id, body),
        { params: m.IdParam, body: m.UpdateBrandBody },
      ),
  );
