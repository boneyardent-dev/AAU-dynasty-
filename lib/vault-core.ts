// Server-held vault: packs, cards, daily streak, goals, and season pass for a signed-in player.
// The server decides every pack grant and every card draw; the phone only displays the result.
// Pure logic against a D1-like interface so it can be tested in Node.
import type { D1Like } from './auth-core';

export type RosterPlayer = { id: string; p: string; r: string; series?: string };
export const RARITY_CUTS: [number, string][] = [[0.55, 'Common'], [0.8, 'Uncommon'], [0.92, 'Rare'], [0.98, 'Epic'], [0.997, 'Legendary']];
export const SPECIAL: Record<string, string> = { Rare: 'STOCK RISERS', Epic: 'CIRCUIT BREAKERS', Legendary: 'PEACH JAM ELITE', Mythic: 'PEACH JAM LEGENDS' };
export const DAILY_CYCLE = [1, 1, 2, 1, 1, 1, 3];
export const SEASON = { id: 's1', start: '2026-10-12', days: 28 };
export const LEVEL_PACKS = [1, 1, 1, 1, 2, 1, 1, 2, 1, 4];
export const XP_PER_LEVEL = 100;
export const XP_DAILY = 20, XP_GAME = 20, XP_GOAL = 30;
export const GOALS: { id: string; n: number; pk: number; count: (o: RosterPlayer[]) => number }[] = [
  { id: 'guards5', n: 5, pk: 1, count: (o) => o.filter((p) => p.p === 'G').length },
  { id: 'wings5', n: 5, pk: 1, count: (o) => o.filter((p) => p.p === 'W').length },
  { id: 'bigs5', n: 5, pk: 1, count: (o) => o.filter((p) => p.p === 'B').length },
  { id: 'styles6', n: 6, pk: 1, count: (o) => new Set(o.map((p) => p.r)).size },
  { id: 'col25', n: 25, pk: 2, count: (o) => o.length },
  { id: 'col75', n: 75, pk: 4, count: (o) => o.length },
];

export const VAULT_CREATE_SQL = [
  `CREATE TABLE IF NOT EXISTS vaults (
    user_id TEXT PRIMARY KEY NOT NULL, packs INTEGER NOT NULL DEFAULT 1, matches INTEGER NOT NULL DEFAULT 0,
    pack_themes TEXT NOT NULL DEFAULT '[]', last_batch TEXT, season_id TEXT, season_xp INTEGER NOT NULL DEFAULT 0,
    season_claimed TEXT NOT NULL DEFAULT '[]', goals_claimed TEXT NOT NULL DEFAULT '{}',
    daily_last TEXT, daily_streak INTEGER NOT NULL DEFAULT 0, daily_best INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS vault_cards (
    user_id TEXT NOT NULL, card_key TEXT NOT NULL, player_id TEXT NOT NULL, rarity TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1, favorite INTEGER NOT NULL DEFAULT 0, special_edition TEXT,
    PRIMARY KEY (user_id, card_key))`,
];

type Row = { user_id: string; packs: number; matches: number; pack_themes: string; last_batch: string | null; season_id: string | null; season_xp: number; season_claimed: string; goals_claimed: string; daily_last: string | null; daily_streak: number; daily_best: number };
const secureRandom = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const changes = (r: unknown) => ((r as { meta?: { changes?: number }; changes?: number })?.meta?.changes ?? (r as { changes?: number })?.changes ?? 0);
export const cardKey = (id: string, rarity: string) => `${id}:silver-foil:${rarity}`;
export const rarityFor = (n: number) => (RARITY_CUTS.find(([cut]) => n < cut) ?? [1, 'Mythic'])[1];
export const seasonEnd = () => new Date(Date.parse(SEASON.start + 'T00:00:00Z') + (SEASON.days - 1) * 864e5).toISOString().slice(0, 10);
const gap = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

export async function ensureVault(db: D1Like, userId: string, now: Date): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO vaults (user_id, packs, created_at) VALUES (?1, 1, ?2)').bind(userId, now.toISOString()).run();
}
async function getRow(db: D1Like, userId: string): Promise<Row> {
  const r = await db.prepare('SELECT * FROM vaults WHERE user_id = ?1').bind(userId).first<Row>();
  if (!r) throw new Error('no vault');
  return r;
}
function season(row: Row) {
  return row.season_id === SEASON.id ? { id: SEASON.id, xp: row.season_xp, claimed: JSON.parse(row.season_claimed) as number[] } : { id: SEASON.id, xp: 0, claimed: [] as number[] };
}
/** Season fields after adding XP on a given server day (no XP outside the season). */
function withXp(row: Row, add: number, today: string) {
  const s = season(row);
  if (today >= SEASON.start && today <= seasonEnd()) s.xp = Math.min(LEVEL_PACKS.length * XP_PER_LEVEL, s.xp + add);
  return s;
}
async function saveSeason(db: D1Like, userId: string, s: { id: string; xp: number; claimed: number[] }, extraPacks = 0) {
  await db.prepare('UPDATE vaults SET season_id = ?2, season_xp = ?3, season_claimed = ?4, packs = packs + ?5 WHERE user_id = ?1').bind(userId, s.id, s.xp, JSON.stringify(s.claimed), extraPacks).run();
}

export async function vaultState(db: D1Like, userId: string) {
  const row = await getRow(db, userId);
  const cards = (await db.prepare('SELECT card_key, player_id, rarity, quantity, favorite, special_edition FROM vault_cards WHERE user_id = ?1 ORDER BY card_key').bind(userId).all<{ card_key: string; player_id: string; rarity: string; quantity: number; favorite: number; special_edition: string | null }>()).results;
  return {
    packs: row.packs, matches: row.matches, packThemes: JSON.parse(row.pack_themes) as string[],
    last: row.last_batch ? (JSON.parse(row.last_batch) as { batchId?: string }) : null,
    cards: cards.map((c) => ({ cardKey: c.card_key, playerId: c.player_id, rarity: c.rarity, quantity: c.quantity, favorite: !!c.favorite, specialEdition: c.special_edition })),
    daily: { last: row.daily_last, streak: row.daily_streak, best: row.daily_best },
    season: season(row), goals: JSON.parse(row.goals_claimed) as Record<string, string>,
  };
}

export async function openPack(db: D1Like, userId: string, roster: RosterPlayer[], rng: () => number = secureRandom) {
  const row = await getRow(db, userId);
  const start = await db.prepare(`UPDATE vaults SET packs = packs - 1, last_batch = '{}' WHERE user_id = ?1 AND packs >= 1 AND last_batch IS NULL`).bind(userId).run();
  if (changes(start) !== 1) return { ok: false as const, reason: row.last_batch ? ('collect-first' as const) : ('no-packs' as const) };
  try {
    const themes = JSON.parse(row.pack_themes) as string[];
    const themeId = themes.shift() || 'silver-standard';
    const themedRoster = themeId === 'concrete-royalty' ? roster.filter((p) => p.series === 'concrete-royalty-v1') : [];
    const concreteDrop = themedRoster.length >= 5;
    const drawPool = [...themedRoster];
    const cards: Record<string, unknown>[] = [];
    for (let i = 0; i < 5; i++) {
      const p = concreteDrop ? drawPool.splice(Math.floor(rng() * drawPool.length), 1)[0] : roster[Math.floor(rng() * roster.length)], rarity = rarityFor(rng()), key = cardKey(p.id, rarity);
      const existing = await db.prepare('SELECT quantity FROM vault_cards WHERE user_id = ?1 AND card_key = ?2').bind(userId, key).first<{ quantity: number }>();
      if (existing) await db.prepare('UPDATE vault_cards SET quantity = quantity + 1 WHERE user_id = ?1 AND card_key = ?2').bind(userId, key).run();
      else await db.prepare('INSERT INTO vault_cards (user_id, card_key, player_id, rarity, quantity, favorite, special_edition) VALUES (?1, ?2, ?3, ?4, 1, 0, ?5)').bind(userId, key, p.id, rarity, SPECIAL[rarity] ?? null).run();
      cards.push({ pullId: crypto.randomUUID(), playerId: p.id, edition: 'silver-foil', rarity, duplicate: !!existing, cardKey: key, themeId, specialEdition: SPECIAL[rarity] ?? null });
    }
    const s = rng();
    const batch = { batchId: crypto.randomUUID(), themeId, cards, bonusSupport: s < 0.5 ? 'shooting' : s < 0.85 ? 'scout' : 'defense' };
    await db.prepare('UPDATE vaults SET last_batch = ?2, pack_themes = ?3 WHERE user_id = ?1').bind(userId, JSON.stringify(batch), JSON.stringify(themes)).run();
    return { ok: true as const, batch };
  } catch (e) {
    await db.prepare('UPDATE vaults SET packs = packs + 1, last_batch = NULL WHERE user_id = ?1').bind(userId).run();
    throw e;
  }
}
export async function collectBatch(db: D1Like, userId: string) {
  await db.prepare('UPDATE vaults SET last_batch = NULL WHERE user_id = ?1').bind(userId).run();
}
export async function setFavorite(db: D1Like, userId: string, key: string, value: boolean) {
  await db.prepare('UPDATE vault_cards SET favorite = ?3 WHERE user_id = ?1 AND card_key = ?2').bind(userId, key, value ? 1 : 0).run();
}
export async function grantPacks(db: D1Like, userId: string, n: number) {
  await db.prepare('UPDATE vaults SET packs = packs + ?2 WHERE user_id = ?1').bind(userId, Math.max(0, Math.floor(n))).run();
}
/** Private-site testing purchase: one no-cost featured pack with a server-validated theme. */
export async function grantTestPack(db: D1Like, userId: string, theme: string) {
  if (!['concrete-royalty', 'midnight-run', 'finals-gold', 'redline-rivalry'].includes(theme)) return false;
  const row = await getRow(db, userId), themes = JSON.parse(row.pack_themes) as string[];
  themes.push(theme);
  await db.prepare('UPDATE vaults SET packs = packs + 1, pack_themes = ?2 WHERE user_id = ?1').bind(userId, JSON.stringify(themes)).run();
  return true;
}
/** One finished game: a pack every third game, and season XP. */
export async function grantGame(db: D1Like, userId: string, today: string) {
  const row = await getRow(db, userId), matches = row.matches + 1, granted = matches % 3 === 0 ? 1 : 0;
  await db.prepare('UPDATE vaults SET matches = ?2 WHERE user_id = ?1').bind(userId, matches).run();
  await saveSeason(db, userId, withXp(row, XP_GAME, today), granted);
  return { granted };
}
export async function claimDaily(db: D1Like, userId: string, today: string) {
  const row = await getRow(db, userId);
  if (row.daily_last && row.daily_last >= today) return { granted: 0, streak: row.daily_streak };
  const streak = (row.daily_last && gap(row.daily_last, today) === 1 ? row.daily_streak : 0) + 1, pk = DAILY_CYCLE[(streak - 1) % 7];
  await db.prepare('UPDATE vaults SET daily_last = ?2, daily_streak = ?3, daily_best = ?4 WHERE user_id = ?1').bind(userId, today, streak, Math.max(row.daily_best, streak)).run();
  await saveSeason(db, userId, withXp(row, XP_DAILY, today), pk);
  return { granted: pk, streak };
}
export async function claimGoal(db: D1Like, userId: string, id: string, roster: RosterPlayer[], today: string) {
  const row = await getRow(db, userId), goal = GOALS.find((g) => g.id === id), claimed = JSON.parse(row.goals_claimed) as Record<string, string>;
  if (!goal || claimed[id]) return { granted: 0 };
  const byId = new Map(roster.map((p) => [p.id, p]));
  const owned = (await db.prepare('SELECT DISTINCT player_id FROM vault_cards WHERE user_id = ?1').bind(userId).all<{ player_id: string }>()).results.map((r) => byId.get(r.player_id)).filter(Boolean) as RosterPlayer[];
  if (goal.count(owned) < goal.n) return { granted: 0 };
  claimed[id] = today;
  await db.prepare('UPDATE vaults SET goals_claimed = ?2 WHERE user_id = ?1').bind(userId, JSON.stringify(claimed)).run();
  await saveSeason(db, userId, withXp(row, XP_GOAL, today), goal.pk);
  return { granted: goal.pk };
}
export async function claimLevel(db: D1Like, userId: string, n: number, today: string) {
  const row = await getRow(db, userId), s = season(row), level = Math.floor(s.xp / XP_PER_LEVEL);
  if (!Number.isInteger(n) || n < 1 || n > LEVEL_PACKS.length || n > level || s.claimed.includes(n)) return { granted: 0 };
  s.claimed = [...s.claimed, n];
  await saveSeason(db, userId, s, LEVEL_PACKS[n - 1]);
  return { granted: LEVEL_PACKS[n - 1] };
}
