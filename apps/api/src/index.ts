import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { auth } from "./auth";
import { env } from "./config";
import { ApiError } from "./errors";
import { medicalModule } from "./modules/medical";
import { inventoryModule } from "./modules/inventory";
import { donationsModule } from "./modules/donations";
import { accountingModule } from "./modules/accounting";
import { auditModule } from "./modules/audit";
import { adminModule } from "./modules/admin";
import { updateTrust } from "@sanmart/bcv-api";
import { appConfig } from "./config";

updateTrust().then(({ success, error }) => {
  if (!success) console.error("[BCV] Trust update failed on startup:", error?.message);
});

const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          title: appConfig.sistema.nombre,
          version: appConfig.sistema.version,
          description: "API del sistema de gestión farmacéutica Sanmart — Parroquia San Martín de Porres",
        },
      },
    }),
  )
  .use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .onError(({ code, error }) => {
    if (error instanceof ApiError) {
      return new Response(
        JSON.stringify({ code: error.code, message: error.message }),
        { status: error.httpStatus, headers: { "Content-Type": "application/json" } },
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    const statusCode =
      code === "NOT_FOUND"
        ? 404
        : code === "VALIDATION"
          ? 422
          : code === "PARSE"
            ? 400
            : 500;

    return new Response(
      JSON.stringify({ code: code as string, message }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      },
    );
  })
  .mount(auth.handler)
  .use(medicalModule)
  .use(inventoryModule)
  .use(donationsModule)
  .use(accountingModule)
  .use(auditModule)
  .use(adminModule)
  .listen(env.PORT);

console.log(`Elysia running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
