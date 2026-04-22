import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { env } from "./config";

export const auth = betterAuth({
  ...(env.BETTER_AUTH_URL && { baseURL: env.BETTER_AUTH_URL }),
  trustedOrigins: [env.FRONTEND_URL],
  database: prismaAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  session: {
    storeSessionInDatabase: true,
  },
  user: {
    modelName: "user",
    additionalFields: {
      nombre: { type: "string", required: true, returned: true },
      cedula: { type: "string", required: true, returned: true },
      telefono: { type: "string", required: true, returned: true },
      activo: { type: "boolean", required: false, returned: true },
    },
  },
});
