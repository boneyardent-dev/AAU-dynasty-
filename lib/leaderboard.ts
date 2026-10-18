// Weekly leaderboard logic. Pure (no Cloudflare imports) so it can be tested in Node.
// Weeks run Monday to Sunday in Pacific time. Entries show a program name plus an anonymous
// code, never account names, so there is no player-written text to moderate.
export const ALLOWED_PROGRAMS = ["Mambas United", "The Soldiers", "The Barons", "Next Level", "SacTown Ballerz", "The City Boyz"];
export const MODES = ['pool', 'semi', 'final'] as const;
export const MIN_SECONDS_BETWEEN_GAMES = 20;
export const MAX_GAMES_PER_WEEK = 60;

export function pacificDay(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}
export function weekStartFor(day: string): string {
  const t = Date.parse(day + 'T00:00:00Z');
  const dow = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
  return new Date(t - dow * 864e5).toISOString().slice(0, 10);
}
export function nextWeekStart(day: string): string {
  return new Date(Date.parse(weekStartFor(day) + 'T00:00:00Z') + 7 * 864e5).toISOString().slice(0, 10);
}
export function pointsFor(won: boolean, mode: string): number {
  if (!won) return 3;
  return 10 + (mode === 'semi' || mode === 'final' ? 5 : 0);
}
export function canSubmit(existing: { last_at: string; games: number } | null, nowMs: number): { ok: boolean; reason?: string } {
  if (!existing) return { ok: true };
  if (existing.games >= MAX_GAMES_PER_WEEK) return { ok: false, reason: 'weekly-cap' };
  if (nowMs - Date.parse(existing.last_at) < MIN_SECONDS_BETWEEN_GAMES * 1000) return { ok: false, reason: 'too-fast' };
  return { ok: true };
}
export async function coachCode(userId: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('aau-dynasty:' + userId));
  return Array.from(new Uint8Array(buf)).slice(0, 3).map((b) => b.toString(36).toUpperCase().padStart(2, '0')).join('').slice(0, 4);
}

export const CREATE_SQL = [
  `CREATE TABLE IF NOT EXISTS weekly_scores (
    user_id TEXT NOT NULL, week TEXT NOT NULL, program TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0,
    day TEXT NOT NULL, points_at_day_start INTEGER NOT NULL DEFAULT 0,
    first_day TEXT NOT NULL, first_at TEXT NOT NULL, last_at TEXT NOT NULL,
    PRIMARY KEY (user_id, week))`,
  `CREATE INDEX IF NOT EXISTS weekly_scores_week_points ON weekly_scores (week, points DESC)`,
  `CREATE TABLE IF NOT EXISTS weekly_claims (
    user_id TEXT NOT NULL, week TEXT NOT NULL, packs INTEGER NOT NULL, rank INTEGER NOT NULL, games INTEGER NOT NULL,
    tier TEXT NOT NULL, status TEXT NOT NULL, claimed_at TEXT NOT NULL, PRIMARY KEY (user_id, week))`,
];

export const SUBMIT_SQL = `INSERT INTO weekly_scores
  (user_id, week, program, points, wins, losses, day, points_at_day_start, first_day, first_at, last_at)
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, ?7, ?8, ?8)
  ON CONFLICT(user_id, week) DO UPDATE SET
    points_at_day_start = CASE WHEN day = excluded.day THEN points_at_day_start ELSE points END,
    day = excluded.day, points = points + excluded.points, wins = wins + excluded.wins,
    losses = losses + excluded.losses, program = excluded.program, last_at = excluded.last_at`;

export const EXISTING_SQL = `SELECT last_at, wins + losses AS games FROM weekly_scores WHERE user_id = ?1 AND week = ?2`;

// ?1 week, ?2 today, ?3 how many top rows, ?4 the caller's user id
export const BOARD_SQL = `WITH s AS (
  SELECT user_id, program, points, wins, losses, first_day, first_at,
         CASE WHEN day = ?2 THEN points_at_day_start ELSE points END AS start_pts
  FROM weekly_scores WHERE week = ?1),
r AS (
  SELECT *, ROW_NUMBER() OVER (ORDER BY points DESC, first_at ASC, user_id ASC) AS rank_now,
            ROW_NUMBER() OVER (ORDER BY start_pts DESC, first_at ASC, user_id ASC) AS rank_prev FROM s)
SELECT user_id, program, points, wins, losses, first_day, rank_now, rank_prev, (SELECT COUNT(*) FROM s) AS total
FROM r WHERE rank_now <= ?3 OR user_id = ?4 ORDER BY rank_now`;

export type BoardRow = { user_id: string; program: string; points: number; wins: number; losses: number; first_day: string; rank_now: number; rank_prev: number; total: number };
export async function shapeBoard(rows: BoardRow[], today: string, me: string) {
  const weekStart = weekStartFor(today);
  const entries = [];
  for (const r of rows) {
    const isNew = r.first_day === today && today !== weekStart;
    entries.push({
      rank: r.rank_now, movement: isNew ? null : r.rank_prev - r.rank_now, isNew,
      label: `${r.program} #${await coachCode(r.user_id)}`, wins: r.wins, losses: r.losses, points: r.points, isMe: r.user_id === me,
    });
  }
  return { weekStart, resetsOn: nextWeekStart(today), total: rows[0]?.total ?? 0, entries };
}

// ---- End-of-week rewards -------------------------------------------------------------------
export const REWARD_MIN_GAMES = 3;      // fewer games than this earns nothing
export const PARTICIPATION_GAMES = 5;   // this many games earns at least a participation pack
export const CLAIM_WEEKS = 3;           // how many past weeks stay claimable
export function rewardFor(rank: number, total: number, games: number): { packs: number; tier: string } {
  if (games < REWARD_MIN_GAMES) return { packs: 0, tier: 'none' };
  if (rank <= 1) return { packs: 5, tier: 'Champion' };
  if (rank <= 3) return { packs: 4, tier: 'Podium' };
  if (rank <= 10) return { packs: 3, tier: 'Top 10' };
  if (rank <= Math.max(1, Math.ceil(total * 0.25))) return { packs: 2, tier: 'Top quarter' };
  if (games >= PARTICIPATION_GAMES) return { packs: 1, tier: 'Participant' };
  return { packs: 0, tier: 'none' };
}
export function previousWeeks(today: string, n = CLAIM_WEEKS): string[] {
  const start = Date.parse(weekStartFor(today) + 'T00:00:00Z');
  return Array.from({ length: n }, (_, i) => new Date(start - (i + 1) * 7 * 864e5).toISOString().slice(0, 10));
}
export const CLAIM_GET_SQL = `SELECT week, packs, rank, games, tier, status FROM weekly_claims WHERE user_id = ?1 AND week = ?2`;
export const CLAIM_INSERT_SQL = `INSERT INTO weekly_claims (user_id, week, packs, rank, games, tier, status, claimed_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', ?7) ON CONFLICT(user_id, week) DO NOTHING`;
export const CLAIM_ACK_SQL = `UPDATE weekly_claims SET status = 'applied' WHERE user_id = ?1 AND week = ?2`;
