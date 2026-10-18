import { getCurrentUser } from '../../session';
import { ROSTER, vaultDb } from '../../vault-db';
import { claimDaily, claimGoal, claimLevel, collectBatch, ensureVault, openPack, setFavorite, vaultState } from '../../../lib/vault-core';
import { pacificDay } from '../../../lib/leaderboard';
const H = { 'Cache-Control': 'no-store' };
const json = (b: unknown, status = 200) => Response.json(b, { status, headers: H });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: 'Sign in to keep your packs on your account.' }, 401);
  try {
    const db = await vaultDb();
    await ensureVault(db, user.userId, new Date());
    return json({ vault: await vaultState(db, user.userId) });
  } catch {
    return json({ error: 'Your vault is temporarily unavailable.' }, 503);
  }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: 'Sign in to keep your packs on your account.' }, 401);
  const origin = request.headers.get('origin');
  if (origin) { try { if (new URL(origin).host !== request.headers.get('host')) return json({ error: 'Not allowed.' }, 403); } catch { return json({ error: 'Not allowed.' }, 403); } }
  let body: { action?: unknown; id?: unknown; n?: unknown; cardKey?: unknown; value?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  try {
    const db = await vaultDb(), now = new Date(), today = pacificDay(now), uid = user.userId;
    await ensureVault(db, uid, now);
    let extra: Record<string, unknown> = {};
    switch (body.action) {
      case 'open': {
        const r = await openPack(db, uid, ROSTER);
        if (!r.ok) return json({ error: r.reason === 'collect-first' ? 'Collect your last cards first.' : 'Play more games to earn a pack.' }, 409);
        break;
      }
      case 'collect': await collectBatch(db, uid); break;
      case 'favorite': await setFavorite(db, uid, String(body.cardKey), body.value === true); break;
      case 'daily': extra = await claimDaily(db, uid, today); break;
      case 'goal': extra = await claimGoal(db, uid, String(body.id), ROSTER, today); break;
      case 'level': extra = await claimLevel(db, uid, Number(body.n), today); break;
      default: return json({ error: 'Unknown request.' }, 400);
    }
    return json({ ok: true, ...extra, vault: await vaultState(db, uid) });
  } catch {
    return json({ error: 'Your vault is temporarily unavailable.' }, 503);
  }
}
