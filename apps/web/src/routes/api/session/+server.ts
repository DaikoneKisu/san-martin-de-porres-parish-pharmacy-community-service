import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /api/session
 * Stores the BetterAuth session token as an httpOnly cookie on the frontend
 * domain so the layout server can read it for SSR session verification.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json() as { token: string; expiresAt?: string };
  const { token, expiresAt } = body;

  if (!token) return json({ error: 'No token provided' }, { status: 400 });

  const maxAge = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : 60 * 60 * 24 * 7; // 7 days fallback

  // httpOnly: false so the browser JS (Eden Treaty fetcher) can read the token
  // and send it as Authorization: Bearer on every API call.
  cookies.set('sanmart.session', token, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  return json({ ok: true });
};

/**
 * DELETE /api/session
 * Clears the frontend session cookie on logout.
 */
export const DELETE: RequestHandler = async ({ cookies }) => {
  cookies.delete('sanmart.session', { path: '/' });
  return json({ ok: true });
};
