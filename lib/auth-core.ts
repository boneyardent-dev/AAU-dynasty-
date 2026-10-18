// Guest accounts with a recovery code. No name, email, or photo is collected, which keeps sign-in
// simple for young players. Sessions are random tokens; only their SHA-256 hash is stored.
// Pure logic against a D1-like interface so it can be tested in Node.
export const SESSION_DAYS = 180;
export const MAX_FAILS = 8;
export const FAIL_WINDOW_SEC = 900;
export const MAX_NEW_PER_HOUR = 10;
export const COOKIE_NAME = 'aau_session';

export interface D1Like {
  prepare(sql: string): {
    bind(...args: unknown[]): {
      run(): Promise<unknown>;
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
    };
  };
}

export const AUTH_CREATE_SQL = [
  `CREATE TABLE IF NOT EXISTS guest_users (user_id TEXT PRIMARY KEY NOT NULL, recovery_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS auth_attempts (key TEXT PRIMARY KEY NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL)`,
];

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0, 1, I, L, O
function randomBytes(n: number): Uint8Array { return crypto.getRandomValues(new Uint8Array(n)); }
export function randomHex(n: number): string { return Array.from(randomBytes(n)).map((b) => b.toString(16).padStart(2, '0')).join(''); }
export function randomToken(): string {
  return btoa(String.fromCharCode(...randomBytes(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function newRecoveryCode(): string {
  let s = '';
  while (s.length < 12) for (const b of randomBytes(24)) { if (b < 248 && s.length < 12) s += ALPHABET[b % 31]; }
  return s.match(/.{4}/g)!.join('-');
}
export function normalizeCode(code: string): string { return String(code).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function parseCookie(header: string | null | undefined, name: string): string | null {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}
export function sessionCookie(token: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
export function clearCookie(): string { return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }

async function isLimited(db: D1Like, key: string, windowSec: number, limit: number, nowSec: number): Promise<boolean> {
  const r = await db.prepare('SELECT window_start, count FROM auth_attempts WHERE key = ?1').bind(key).first<{ window_start: number; count: number }>();
  return !!r && nowSec - r.window_start < windowSec && r.count >= limit;
}
async function addHit(db: D1Like, key: string, windowSec: number, nowSec: number): Promise<void> {
  await db.prepare(`INSERT INTO auth_attempts (key, window_start, count) VALUES (?1, ?2, 1)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN ?2 - window_start >= ?3 THEN 1 ELSE count + 1 END,
      window_start = CASE WHEN ?2 - window_start >= ?3 THEN ?2 ELSE window_start END`).bind(key, nowSec, windowSec).run();
}
async function startSession(db: D1Like, userId: string, now: Date): Promise<string> {
  const token = randomToken();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400000).toISOString();
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?1').bind(now.toISOString()).run();
  await db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)').bind(await sha256Hex(token), userId, now.toISOString(), expires).run();
  return token;
}

export async function createGuest(db: D1Like, o: { now: Date; ipHash: string }) {
  const nowSec = Math.floor(o.now.getTime() / 1000), key = 'new:' + o.ipHash;
  if (await isLimited(db, key, 3600, MAX_NEW_PER_HOUR, nowSec)) return { ok: false as const, reason: 'rate-limited' as const };
  await addHit(db, key, 3600, nowSec);
  const userId = 'g_' + randomHex(16), recoveryCode = newRecoveryCode();
  await db.prepare('INSERT INTO guest_users (user_id, recovery_hash, created_at) VALUES (?1, ?2, ?3)').bind(userId, await sha256Hex(normalizeCode(recoveryCode)), o.now.toISOString()).run();
  return { ok: true as const, userId, recoveryCode, token: await startSession(db, userId, o.now) };
}
export async function recover(db: D1Like, code: string, o: { now: Date; ipHash: string }) {
  const nowSec = Math.floor(o.now.getTime() / 1000), key = 'fail:' + o.ipHash, norm = normalizeCode(code);
  if (await isLimited(db, key, FAIL_WINDOW_SEC, MAX_FAILS, nowSec)) return { ok: false as const, reason: 'rate-limited' as const };
  const row = norm.length === 12 ? await db.prepare('SELECT user_id FROM guest_users WHERE recovery_hash = ?1').bind(await sha256Hex(norm)).first<{ user_id: string }>() : null;
  if (!row) { await addHit(db, key, FAIL_WINDOW_SEC, nowSec); return { ok: false as const, reason: 'invalid' as const }; }
  return { ok: true as const, userId: row.user_id, token: await startSession(db, row.user_id, o.now) };
}
export async function userForToken(db: D1Like, token: string, now: Date): Promise<string | null> {
  const h = await sha256Hex(token);
  const r = await db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?1').bind(h).first<{ user_id: string; expires_at: string }>();
  if (!r) return null;
  if (r.expires_at < now.toISOString()) { await db.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(h).run(); return null; }
  return r.user_id;
}
export async function logout(db: D1Like, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(await sha256Hex(token)).run();
}
export async function newCode(db: D1Like, userId: string): Promise<string> {
  const code = newRecoveryCode();
  await db.prepare('UPDATE guest_users SET recovery_hash = ?1 WHERE user_id = ?2').bind(await sha256Hex(normalizeCode(code)), userId).run();
  return code;
}
