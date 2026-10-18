import { env } from 'cloudflare:workers';
import { getCurrentUser } from '../../session';

const MAX_SAVE_BYTES = 1_000_000;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ authenticated: false, saved: null }, { headers: { 'Cache-Control': 'no-store' } });
  const db = env.DB;
  if (!db) return Response.json({ error: 'Account save is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const row = await db.prepare('SELECT payload, updated_at FROM player_saves WHERE user_id = ?').bind(user.userId).first<{ payload: string; updated_at: string }>();
  return Response.json({ authenticated: true, userId: user.userId, saved: row ? JSON.parse(row.payload) : null, updatedAt: row?.updated_at ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Sign in to save game progress to your account.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const db = env.DB;
  if (!db) return Response.json({ error: 'Account save is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_SAVE_BYTES) return Response.json({ error: 'Save data is too large.' }, { status: 413 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: 'Invalid save data.' }, { status: 400 }); }
  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_SAVE_BYTES) return Response.json({ error: 'Save data is too large.' }, { status: 413 });
  const updatedAt = new Date().toISOString();
  await db.prepare('INSERT INTO player_saves (user_id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(user.userId, serialized, updatedAt).run();
  return Response.json({ saved: true, updatedAt }, { headers: { 'Cache-Control': 'no-store' } });
}
