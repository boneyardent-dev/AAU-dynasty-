import { env } from 'cloudflare:workers';
import { getCurrentUser } from '../../../session';
import { ensureVault, grantPacks } from '../../../../lib/vault-core';
import { BOARD_SQL, CLAIM_ACK_SQL, CLAIM_GET_SQL, CLAIM_INSERT_SQL, CREATE_SQL, pacificDay, previousWeeks, rewardFor } from '../../../../lib/leaderboard';
const H = { 'Cache-Control': 'no-store' };
type Claim = { week: string; packs: number; rank: number; games: number; tier: string; status: string };
let ready: Promise<unknown> | undefined;
async function database() {
  const db = env.DB;
  if (!db) throw new Error('unavailable');
  ready ??= db.batch(CREATE_SQL.map((s) => db.prepare(s)));
  await ready;
  return db;
}
async function standing(db: Awaited<ReturnType<typeof database>>, userId: string, week: string) {
  const row = await db.prepare(BOARD_SQL).bind(week, week, 0, userId).first<{ rank_now: number; total: number; wins: number; losses: number }>();
  if (!row) return null;
  const games = row.wins + row.losses;
  return { rank: row.rank_now, games, ...rewardFor(row.rank_now, row.total, games) };
}
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ rewards: [] }, { status: 401, headers: H });
  try {
    const db = await database();
    const rewards: Claim[] = [];
    for (const week of previousWeeks(pacificDay(new Date()))) {
      const claim = await db.prepare(CLAIM_GET_SQL).bind(user.userId, week).first<Claim>();
      if (claim) { if (claim.status !== 'applied') rewards.push(claim); continue; }
      const st = await standing(db, user.userId, week);
      if (st && st.packs > 0) rewards.push({ week, packs: st.packs, rank: st.rank, games: st.games, tier: st.tier, status: 'available' });
    }
    return Response.json({ rewards }, { headers: H });
  } catch {
    return Response.json({ rewards: [], error: 'Rewards are temporarily unavailable.' }, { status: 503, headers: H });
  }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Sign in to claim rewards.' }, { status: 401, headers: H });
  let body: { action?: unknown; week?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400, headers: H }); }
  const week = String(body.week);
  if (!previousWeeks(pacificDay(new Date())).includes(week)) return Response.json({ error: 'That week cannot be claimed.' }, { status: 400, headers: H });
  try {
    const db = await database();
    if (body.action === 'ack') {
      await db.prepare(CLAIM_ACK_SQL).bind(user.userId, week).run();
      return Response.json({ ok: true }, { headers: H });
    }
    if (body.action !== 'claim') return Response.json({ error: 'Unknown request.' }, { status: 400, headers: H });
    let claim = await db.prepare(CLAIM_GET_SQL).bind(user.userId, week).first<Claim>();
    if (!claim) {
      const st = await standing(db, user.userId, week);
      if (!st || st.packs < 1) return Response.json({ error: 'No reward for that week.' }, { status: 404, headers: H });
      await db.prepare(CLAIM_INSERT_SQL).bind(user.userId, week, st.packs, st.rank, st.games, st.tier, new Date().toISOString()).run();
      claim = await db.prepare(CLAIM_GET_SQL).bind(user.userId, week).first<Claim>();
    }
    if (!claim || claim.status === 'applied') return Response.json({ already: true }, { headers: H });
    // The server adds the packs itself. The status flip is the lock: only one request can win it.
    const flip = await db.prepare(`UPDATE weekly_claims SET status = 'applied' WHERE user_id = ?1 AND week = ?2 AND status = 'pending'`).bind(user.userId, week).run();
    const won = ((flip as { meta?: { changes?: number } }).meta?.changes ?? 0) === 1;
    if (!won) return Response.json({ already: true }, { headers: H });
    await ensureVault(db as never, user.userId, new Date());
    await grantPacks(db as never, user.userId, claim.packs);
    return Response.json({ granted: claim.packs, claim }, { headers: H });
  } catch {
    return Response.json({ error: 'Rewards are temporarily unavailable.' }, { status: 503, headers: H });
  }
}
