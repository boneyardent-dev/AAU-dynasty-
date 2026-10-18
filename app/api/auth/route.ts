import { headers } from 'next/headers';
import { COOKIE_NAME, clearCookie, createGuest, logout, newCode, parseCookie, recover, sessionCookie, sha256Hex } from '../../../lib/auth-core';
import { authDb, getCurrentUser } from '../../session';
import { coachCode } from '../../../lib/leaderboard';
const H = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200, cookie?: string) =>
  Response.json(body, { status, headers: cookie ? { ...H, 'Set-Cookie': cookie } : H });

export async function GET() {
  const u = await getCurrentUser();
  return json(u ? { authenticated: true, kind: u.kind, label: u.label } : { authenticated: false });
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== request.headers.get('host')) return json({ error: 'Not allowed.' }, 403); } catch { return json({ error: 'Not allowed.' }, 403); } }
  let body: { action?: unknown; code?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  try {
    const db = await authDb();
    const now = new Date();
    const ipHash = (await sha256Hex(request.headers.get('cf-connecting-ip') ?? 'unknown')).slice(0, 16);
    const token = parseCookie((await headers()).get('cookie'), COOKIE_NAME);
    switch (body.action) {
      case 'guest': {
        const r = await createGuest(db, { now, ipHash });
        if (!r.ok) return json({ error: 'Too many new profiles from this connection. Try again later.' }, 429);
        return json({ ok: true, recoveryCode: r.recoveryCode, label: `Coach #${await coachCode(r.userId)}` }, 200, sessionCookie(r.token));
      }
      case 'recover': {
        const r = await recover(db, String(body.code ?? ''), { now, ipHash });
        if (!r.ok) return json({ error: r.reason === 'rate-limited' ? 'Too many tries. Wait a few minutes and try again.' : 'That code was not found. Check it and try again.' }, r.reason === 'rate-limited' ? 429 : 404);
        return json({ ok: true, label: `Coach #${await coachCode(r.userId)}` }, 200, sessionCookie(r.token));
      }
      case 'logout':
        if (token) await logout(db, token);
        return json({ ok: true }, 200, clearCookie());
      case 'newcode': {
        const u = await getCurrentUser();
        if (!u || u.kind !== 'guest') return json({ error: 'Sign in with a coach profile first.' }, 401);
        return json({ ok: true, recoveryCode: await newCode(db, u.userId) });
      }
      default:
        return json({ error: 'Unknown request.' }, 400);
    }
  } catch {
    return json({ error: 'Accounts are temporarily unavailable.' }, 503);
  }
}
