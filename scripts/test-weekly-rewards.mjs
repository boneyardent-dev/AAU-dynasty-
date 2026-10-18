import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import * as L from '../lib/leaderboard.ts';
// reward tiers
const r = (rank, total, games) => L.rewardFor(rank, total, games);
assert.deepEqual([r(1, 30, 6).packs, r(1, 30, 6).tier], [5, 'Champion']);
assert.deepEqual([r(2, 30, 6).packs, r(3, 30, 4).packs], [4, 4]);
assert.deepEqual([r(4, 30, 4).packs, r(10, 30, 9).packs], [3, 3]);
assert.deepEqual([r(11, 44, 4).packs, r(11, 44, 4).tier], [2, 'Top quarter'], 'top quarter only matters in big fields');
assert.equal(r(12, 44, 4).packs, 0, 'outside the top quarter needs 5 games');
assert.deepEqual([r(30, 44, 5).packs, r(30, 44, 5).tier], [1, 'Participant']);
assert.equal(r(1, 30, 2).packs, 0, 'under 3 games earns nothing, even in first place');
assert.equal(r(1, 1, 3).packs, 5, 'a lone player with 3 games still places first');
assert.deepEqual(L.previousWeeks('2026-10-19'), ['2026-10-12', '2026-10-05', '2026-09-28']);
assert.deepEqual(L.previousWeeks('2026-10-25'), ['2026-10-12', '2026-10-05', '2026-09-28'], 'mid-week uses the same completed weeks');
// real SQL: standings for a finished week, then claims
const db = new DatabaseSync(':memory:'); L.CREATE_SQL.forEach((s) => db.exec(s));
let tick = 0;
const play = (u, wins, losses) => { for (let i = 0; i < wins + losses; i++) { const won = i < wins; db.prepare(L.SUBMIT_SQL).run(u, '2026-10-12', L.ALLOWED_PROGRAMS[0], L.pointsFor(won, 'pool'), won ? 1 : 0, won ? 0 : 1, '2026-10-13', new Date(Date.parse('2026-10-13T18:00:00Z') + tick++ * 1000).toISOString()); } };
play('A', 6, 0); play('B', 5, 0); play('C', 4, 0); for (let i = 0; i < 7; i++) play('P' + i, 3, 0); play('S', 0, 5); play('T', 3, 0); play('Z', 1, 1);
const stand = (u) => { const row = db.prepare(L.BOARD_SQL).get('2026-10-12', '2026-10-12', 0, u); if (!row) return null; const g = row.wins + row.losses; return { rank: row.rank_now, games: g, ...L.rewardFor(row.rank_now, row.total, g) }; };
assert.equal(stand('A').packs, 5); assert.equal(stand('B').packs, 4); assert.equal(stand('C').packs, 4);
assert.equal(stand('P0').packs, 3, 'ranks 4 to 10 get 3 packs');
assert.equal(stand('S').packs, 1, 'five losses still earn a participation pack (15 points, 5 games)');
assert.equal(stand('Z').packs, 0, 'two games earns nothing');
assert.equal(stand('nobody'), null, 'a player who did not play has no standing');
assert.equal(db.prepare(L.BOARD_SQL).all('2026-10-12', '2026-10-12', 0, 'A').length, 1, 'limit 0 returns only the caller');
// claims are recorded once; pending stays claimable until acknowledged
const get = (u, w) => db.prepare(L.CLAIM_GET_SQL).get(u, w) ?? null;
assert.equal(get('A', '2026-10-12'), null);
db.prepare(L.CLAIM_INSERT_SQL).run('A', '2026-10-12', 5, 1, 6, 'Champion', 't1');
db.prepare(L.CLAIM_INSERT_SQL).run('A', '2026-10-12', 99, 9, 9, 'Hacked', 't2');
assert.deepEqual([get('A', '2026-10-12').packs, get('A', '2026-10-12').status, get('A', '2026-10-12').tier], [5, 'pending', 'Champion'], 'second insert cannot change the reward');
db.prepare(L.CLAIM_ACK_SQL).run('A', '2026-10-12'); assert.equal(get('A', '2026-10-12').status, 'applied');
assert.equal(get('B', '2026-10-12'), null, 'claims are per player');
// the status flip is the lock: only the first request wins
const flip = () => db.prepare(`UPDATE weekly_claims SET status = 'applied' WHERE user_id = ?1 AND week = ?2 AND status = 'pending'`);
db.prepare(L.CLAIM_INSERT_SQL).run('B', '2026-10-12', 4, 2, 5, 'Podium', 't3');
assert.equal(flip().run('B', '2026-10-12').changes, 1, 'first claim wins the lock'); assert.equal(flip().run('B', '2026-10-12').changes, 0, 'second claim cannot win it');
console.log('PASS: reward tiers, minimum games, claimable weeks, standings from the real SQL, claim recorded once, pending until acknowledged.');
