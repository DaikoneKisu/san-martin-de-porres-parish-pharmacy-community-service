import { redirect } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import type { LayoutServerLoad } from "./$types";

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
      // Server-to-server call using Bearer token — avoids all cross-origin
      // cookie issues between the Vercel frontend and the Fly.io API.
      const meRes = await fetch(`${PUBLIC_API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
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
