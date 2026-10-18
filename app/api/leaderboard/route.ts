import { env } from 'cloudflare:workers';
import { getCurrentUser } from '../../session';
import { ensureVault, grantGame } from '../../../lib/vault-core';
import { ALLOWED_PROGRAMS, BOARD_SQL, CREATE_SQL, EXISTING_SQL, MODES, SUBMIT_SQL, canSubmit, pacificDay, pointsFor, shapeBoard, weekStartFor } from '../../../lib/leaderboard';
const H = { 'Cache-Control': 'no-store' };
let ready: Promise<unknown> | undefined;
async function database() {
  const db = env.DB;
  if (!db) throw new Error('Leaderboard unavailable');
  ready ??= db.batch(CREATE_SQL.map((s) => db.prepare(s)));
  await ready;
  return db;
}
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ authenticated: false }, { status: 401, headers: H });
  try {
    const db = await database();
    const today = pacificDay(new Date());
    const { results } = await db.prepare(BOARD_SQL).bind(weekStartFor(today), today, 25, user.userId).all();
    return Response.json({ authenticated: true, ...(await shapeBoard(results as never, today, user.userId)) }, { headers: H });
  } catch {
    return Response.json({ error: 'Leaderboard is temporarily unavailable.' }, { status: 503, headers: H });
  }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Sign in to join the weekly leaderboard.' }, { status: 401, headers: H });
  let body: { won?: unknown; mode?: unknown; program?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid score.' }, { status: 400, headers: H }); }
  const won = body.won === true;
  const mode = String(body.mode);
  const program = String(body.program);
  if (typeof body.won !== 'boolean' || !(MODES as readonly string[]).includes(mode) || !ALLOWED_PROGRAMS.includes(program))
    return Response.json({ error: 'Invalid score.' }, { status: 400, headers: H });
  try {
    const db = await database();
    const now = new Date();
    const day = pacificDay(now);
    const week = weekStartFor(day);
    const existing = await db.prepare(EXISTING_SQL).bind(user.userId, week).first<{ last_at: string; games: number }>();
    const check = canSubmit(existing ?? null, now.getTime());
    if (!check.ok) return Response.json({ recorded: false, reason: check.reason }, { headers: H });
    const pts = pointsFor(won, mode);
    await db.prepare(SUBMIT_SQL).bind(user.userId, week, program, pts, won ? 1 : 0, won ? 0 : 1, day, now.toISOString()).run();
    await ensureVault(db as never, user.userId, now);
    const vault = await grantGame(db as never, user.userId, day);
    return Response.json({ recorded: true, points: pts, packsGranted: vault.granted }, { headers: H });
  } catch {
    return Response.json({ error: 'Leaderboard is temporarily unavailable.' }, { status: 503, headers: H });
  }
}
