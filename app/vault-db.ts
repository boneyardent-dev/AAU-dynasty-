import { env } from 'cloudflare:workers';
import { CREATE_SQL } from '../lib/leaderboard';
import { VAULT_CREATE_SQL } from '../lib/vault-core';
import type { D1Like } from '../lib/auth-core';
import catalog from '../data/players.json';
import base from '../data/base-roster.json';
import type { RosterPlayer } from '../lib/vault-core';

let ready: Promise<unknown> | undefined;
export async function vaultDb(): Promise<D1Like> {
  const db = env.DB;
  if (!db) throw new Error('Vault unavailable');
  ready ??= db.batch([...VAULT_CREATE_SQL, ...CREATE_SQL].map((s) => db.prepare(s)));
  await ready;
  return db as unknown as D1Like;
}
const group = (position: string) => (['PG', 'SG', 'CG'].includes(position) ? 'G' : ['C', 'PF'].includes(position) ? 'B' : 'W');
/** Everything a pack can contain: the 12 starter players plus the whole recruiting class. */
export const ROSTER: RosterPlayer[] = [
  ...(base as RosterPlayer[]),
  ...(catalog.players as { id: string; position: string; archetype?: string; originalSeries?: string }[]).map((c) => {
    const p = group(c.position);
    return { id: c.id, p, r: c.archetype || (p === 'G' ? 'National Guard' : p === 'B' ? 'National Big' : 'National Wing'), series: c.originalSeries };
  }),
];
