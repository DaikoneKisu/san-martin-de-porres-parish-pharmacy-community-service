import { Elysia } from "elysia";
import { authMacro } from "../../plugins/auth-macro";
import { medicalService } from "./service";
import * as m from "./model";

export const medicalModule = new Elysia({ prefix: "/api/medical" })
  .use(authMacro)
  .guard({ requireAuth: true }, (app) =>
    app
      // ── Staff (public for scheduling) ─────────────────────────────────────
      .get("/staff", () => medicalService.listStaff())

      // ── Patients ──────────────────────────────────────────────────────────
      .get("/patients", () => medicalService.listPatients())

      .post(
        "/patients",
        ({ body, user }) => medicalService.createPatient(body, user.id),
        { body: m.CreatePatientBody },
      )

      .get("/patients/:id", ({ params }) => medicalService.getPatient(params.id), {
        params: m.IdParam,
      })

      .patch(
        "/patients/:id",
        ({ params, body, user }) => medicalService.updatePatient(params.id, body, user.id),
        { params: m.IdParam, body: m.UpdatePatientBody },
      )

      // ── Medical history ───────────────────────────────────────────────────
      .get(
        "/patients/:id/medical-history",
        ({ params }) => medicalService.getMedicalHistory(params.id),
        { params: m.IdParam },
      )

      // ── Antecedents ───────────────────────────────────────────────────────
      .get(
        "/patients/:id/antecedents",
        ({ params }) => medicalService.listAntecedents(params.id),
        { params: m.IdParam },
      )

      .post(
        "/patients/:id/antecedents",
        ({ params, body, user }) =>
          medicalService.createAntecedent(params.id, body, user.id),
        { params: m.IdParam, body: m.CreateAntecedentBody },
      )

      .patch(
        "/patients/:id/antecedents/:antecedentId",
        ({ params, body, user }) =>
          medicalService.updateAntecedent(params.id, params.antecedentId, body, user.id),
        { params: m.PatientAntecedentParams, body: m.UpdateAntecedentBody },
      )

      // ── Antecedent categories ─────────────────────────────────────────────
      .get("/antecedent-categories", () => medicalService.listAntecedentCategories())

      // ── Appointments ──────────────────────────────────────────────────────
      .get("/appointments", () => medicalService.listAppointments())

      .post(
        "/appointments",
        ({ body, user }) => medicalService.createAppointment(body, user.id),
        { body: m.CreateAppointmentBody },
      )

      .get("/appointments/:id", ({ params }) => medicalService.getAppointment(params.id), {
        params: m.IdParam,
      })

      .patch(
        "/appointments/:id/result",
        async ({ params, body, user, status }) => {
          if (!user.roles.some((r) => r.nombre === "doctor")) {
            return status(403, {
              code: "FORBIDDEN",
              message: "Solo los doctores pueden registrar resultados de citas",
            });
          }
          return medicalService.updateAppointmentResult(params.id, body, user.id);
        },
        { params: m.IdParam, body: m.UpdateAppointmentResultBody },
      )

      .get(
        "/appointments/:id/recipe/pdf",
        async ({ params }) => {
          const url = await medicalService.getAppointmentRecipePdf(params.id);
          return { url };
        },
        { params: m.IdParam },
      )

      // ── External recipes ──────────────────────────────────────────────────
      .get("/external-recipes", () => medicalService.listExternalRecipes())

      .post(
        "/external-recipes",
        ({ body, user }) => medicalService.createExternalRecipe(body, user.id),
        { body: m.CreateExternalRecipeBody },
      )

      .get(
        "/external-recipes/:id",
        ({ params }) => medicalService.getExternalRecipe(params.id),
        { params: m.IdParam },
      ),
  );
