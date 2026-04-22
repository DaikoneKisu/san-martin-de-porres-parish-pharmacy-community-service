import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@sanmart/api";

export const createApiClient = (baseUrl: string): Treaty.Create<App> =>
  treaty<App>(baseUrl);

export type ApiClient = ReturnType<typeof createApiClient>;
