import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { getChatGPTUser } from './chatgpt-auth';
import { AUTH_CREATE_SQL, COOKIE_NAME, parseCookie, userForToken, type D1Like } from '../lib/auth-core';
import { coachCode } from '../lib/leaderboard';

export type AppUser = { userId: string; kind: 'chatgpt' | 'guest'; label: string };
let ready: Promise<unknown> | undefined;
export async function authDb(): Promise<D1Like> {
  const db = env.DB;
  if (!db) throw new Error('Accounts unavailable');
  ready ??= db.batch(AUTH_CREATE_SQL.map((s) => db.prepare(s)));
  await ready;
  return db as unknown as D1Like;
}
/** The signed-in player: a ChatGPT account (if the host provides one) or a guest session cookie. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const chat = await getChatGPTUser();
  if (chat) return { userId: chat.userId, kind: 'chatgpt', label: 'ChatGPT account' };
  const token = parseCookie((await headers()).get('cookie'), COOKIE_NAME);
  if (!token) return null;
  try {
    const userId = await userForToken(await authDb(), token, new Date());
    return userId ? { userId, kind: 'guest', label: `Coach #${await coachCode(userId)}` } : null;
  } catch {
    return null;
  }
}
