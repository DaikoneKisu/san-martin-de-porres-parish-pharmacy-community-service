import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@sanmart/api";

/**
 * Custom fetcher that reads the session token from the `sanmart.session`
 * cookie (set as httpOnly:false so JS can access it) and adds an
 * `Authorization: Bearer` header to every API call. This avoids all
 * cross-origin cookie issues when the API lives on a different domain.
 */
function createBearerFetcher() {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let token: string | undefined;

    if (typeof document !== "undefined") {
      const match = document.cookie.match(
        /(?:^|;\s*)sanmart\.session=([^;]*)/
      );
      token = match ? decodeURIComponent(match[1]) : undefined;
    }

    return fetch(input, {
      ...init,
      headers: {
        ...(init?.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };
}

export const createApiClient = (baseUrl: string): Treaty.Create<App> =>
  treaty<App>(baseUrl, { fetcher: createBearerFetcher() as typeof fetch });

export type ApiClient = ReturnType<typeof createApiClient>;
