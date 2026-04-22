import { redirect } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import type { LayoutServerLoad } from "./$types";

// BetterAuth adds the __Secure- prefix when running over HTTPS.
// In production (fly.dev → HTTPS) the cookie name is __Secure-better-auth.session_token.
// In local dev (HTTP) it is just better-auth.session_token.
const BETTER_AUTH_COOKIE =
  PUBLIC_API_URL.startsWith("https")
    ? "__Secure-better-auth.session_token"
    : "better-auth.session_token";

export const load: LayoutServerLoad = async ({ url, cookies }) => {
  const isAuthRoute =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/recover-password") ||
    url.pathname.startsWith("/new-password");

  // Read the token we stored on the frontend domain after login.
  const sessionToken = cookies.get("sanmart.session");

  let session: {
    user: {
      id: string;
      email: string;
      nombre: string;
      cedula: string;
      telefono: string;
      activo: boolean;
      roles: string[];
    };
  } | null = null;

  if (sessionToken) {
    try {
      // Single call to /api/me — uses authMacro which internally validates
      // the BetterAuth session. Returns 200+user on success, 401 on invalid.
      const cookieHeader = `${BETTER_AUTH_COOKIE}=${sessionToken}`;

      const meRes = await fetch(`${PUBLIC_API_URL}/api/me`, {
        headers: { cookie: cookieHeader },
      });

      if (meRes.ok) {
        const me = (await meRes.json()) as {
          id: string;
          email: string;
          nombre: string;
          cedula: string;
          telefono: string;
          activo: boolean;
          roles: string[];
        };
        session = { user: me };
      }
    } catch {
      // Network error or API unavailable — treat as unauthenticated.
    }
  }

  if (!session && !isAuthRoute) {
    redirect(302, "/login");
  }

  const isAdminRoute =
    url.pathname.startsWith("/audit") || url.pathname.startsWith("/admin");

  if (isAdminRoute && !session?.user.roles.includes("administrador")) {
    redirect(302, "/");
  }

  return { session };
};
