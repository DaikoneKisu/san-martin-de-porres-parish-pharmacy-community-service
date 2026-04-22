import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@sanmart/api";

export const createApiClient = (baseUrl: string): Treaty.Create<App> =>
  treaty<App>(baseUrl, { fetch: { credentials: 'include' } });

export type ApiClient = ReturnType<typeof createApiClient>;
