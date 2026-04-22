import { Elysia } from "elysia";
import { authMacro } from "../../plugins/auth-macro";
import { ApiError } from "../../errors";
import { adminService } from "./service";
import * as m from "./model";

function requireAdmin(user: { roles: { nombre: string }[] }) {
  if (!user.roles.some((r) => r.nombre === "administrador"))
    throw new ApiError(403, "FORBIDDEN", "Acceso restringido a administradores");
}

export const adminModule = new Elysia({ prefix: "/api/admin" })
  .use(authMacro)
  .guard({ requireAuth: true }, (app) =>
    app
      // ── Staff ────────────────────────────────────────────────────────────────
      .get("/staff", ({ user }) => {
        requireAdmin(user);
        return adminService.listStaff();
      })

      .post(
        "/staff",
        ({ body, user }) => {
          requireAdmin(user);
          return adminService.createStaff(body, user.id);
        },
        { body: m.CreateStaffBody },
      )

      .get("/staff/:id", ({ params, user }) => {
        requireAdmin(user);
        return adminService.getStaff(params.id);
      }, { params: m.IdParam })

      .patch(
        "/staff/:id",
        ({ params, body, user }) => {
          requireAdmin(user);
          return adminService.updateStaff(params.id, body, user.id);
        },
        { params: m.IdParam, body: m.UpdateStaffBody },
      )

      .post(
        "/staff/:id/deactivate",
        ({ params, user }) => {
          requireAdmin(user);
          return adminService.deactivateStaff(params.id, user.id);
        },
        { params: m.IdParam },
      )

      .post(
        "/staff/:id/activate",
        ({ params, user }) => {
          requireAdmin(user);
          return adminService.activateStaff(params.id, user.id);
        },
        { params: m.IdParam },
      )

      // ── Roles ─────────────────────────────────────────────────────────────
      .get("/roles", ({ user }) => {
        requireAdmin(user);
        return adminService.listRoles();
      })

      // ── Config ────────────────────────────────────────────────────────────
      .get("/config", ({ user }) => {
        requireAdmin(user);
        return adminService.getConfig();
      })

      .patch(
        "/config",
        ({ body, user }) => {
          requireAdmin(user);
          return adminService.patchConfig(body);
        },
        { body: m.PatchConfigBody },
      ),
  );
