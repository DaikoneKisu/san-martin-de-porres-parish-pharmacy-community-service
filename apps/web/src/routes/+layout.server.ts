import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ url, cookies }) => {
	const isAuthRoute =
		url.pathname.startsWith("/login") ||
		url.pathname.startsWith("/recover-password") ||
		url.pathname.startsWith("/new-password");

	// TODO: reemplazar con verificación real de sesión via BetterAuth API
	const sessionToken = cookies.get("better-auth.session_token");
	const session = sessionToken
		? { user: { roles: ["administrador"] as string[] } }
		: null;

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
