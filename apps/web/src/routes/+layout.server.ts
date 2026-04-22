import { redirect } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ url, request }) => {
	const isAuthRoute =
		url.pathname.startsWith("/login") ||
		url.pathname.startsWith("/recover-password") ||
		url.pathname.startsWith("/new-password");

	const cookieHeader = request.headers.get("cookie") ?? "";

	let session: { user: { id: string; email: string; nombre: string; cedula: string; telefono: string; activo: boolean; roles: string[] } } | null = null;

	try {
		// Verify session with BetterAuth
		const sessionRes = await fetch(`${PUBLIC_API_URL}/api/auth/get-session`, {
			headers: { cookie: cookieHeader },
		});

		if (sessionRes.ok) {
			const sessionData = await sessionRes.json() as { user?: unknown } | null;
			if (sessionData?.user) {
				// Load user profile with roles from our /api/me endpoint
				const meRes = await fetch(`${PUBLIC_API_URL}/api/me`, {
					headers: { cookie: cookieHeader },
				});

				if (meRes.ok) {
					const me = await meRes.json() as {
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
			}
		}
	} catch {
		// Network error or API unavailable — treat as unauthenticated
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
