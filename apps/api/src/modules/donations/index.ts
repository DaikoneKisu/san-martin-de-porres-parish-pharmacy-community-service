import { Elysia } from "elysia";
import { authMacro } from "../../plugins/auth-macro";
import { donationsService } from "./service";
import * as m from "./model";

export const donationsModule = new Elysia({ prefix: "/api/donations" })
  .use(authMacro)
  .guard({ requireAuth: true }, (app) =>
    app
      // ── Donors ──────────────────────────────────────────────────────────────
      .get("/donors", () => donationsService.listDonors())

      .post(
        "/donors",
        ({ body, user }) => donationsService.createDonor(body, user.id),
        { body: m.CreateDonorBody },
      )

      .get(
        "/donors/:id",
        ({ params }) => donationsService.getDonor(params.id),
        { params: m.IdParam },
      )

      .patch(
        "/donors/:id",
        ({ params, body, user }) => donationsService.updateDonor(params.id, body, user.id),
        { params: m.IdParam, body: m.UpdateDonorBody },
      )

      // ── Donations ────────────────────────────────────────────────────────────
      .get("/", () => donationsService.listDonations())

      .post(
        "/",
        ({ body, user }) => donationsService.createDonation(body, user.id),
        { body: m.CreateDonationBody },
      )

      .get(
        "/:id",
        ({ params }) => donationsService.getDonation(params.id),
        { params: m.IdParam },
      ),
  );
