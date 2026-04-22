import { Elysia } from "elysia";
import { auth } from "../auth";
import { db } from "../db";

export const authMacro = new Elysia({ name: "auth-macro" }).macro({
  requireAuth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({ headers });
      if (!session)
        return status(401, { code: "UNAUTHORIZED", message: "No autenticado" });

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { roles: true },
      });

      if (!user || !user.activo)
        return status(401, { code: "UNAUTHORIZED", message: "No autenticado" });

      return { user };
    },
  },
});
