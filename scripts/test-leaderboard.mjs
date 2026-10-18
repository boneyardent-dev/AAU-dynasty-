import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import * as L from '../lib/leaderboard.ts';
// week helpers (Monday to Sunday)
assert.equal(L.weekStartFor('2026-10-14'), '2026-10-12');
assert.equal(L.weekStartFor('2026-10-18'), '2026-10-12', 'Sunday belongs to the week that started Monday');
assert.equal(L.weekStartFor('2026-10-19'), '2026-10-19');
assert.equal(L.nextWeekStart('2026-10-14'), '2026-10-19');
assert.deepEqual([L.pointsFor(true, 'pool'), L.pointsFor(true, 'semi'), L.pointsFor(true, 'final'), L.pointsFor(false, 'final')], [10, 15, 15, 3]);
// rate limits
assert.equal(L.canSubmit(null, 0).ok, true);
assert.equal(L.canSubmit({ last_at: new Date(1000).toISOString(), games: 3 }, 1000 + 5000).reason, 'too-fast');
assert.equal(L.canSubmit({ last_at: new Date(1000).toISOString(), games: 3 }, 1000 + 25000).ok, true);
assert.equal(L.canSubmit({ last_at: new Date(1000).toISOString(), games: 60 }, 9e9).reason, 'weekly-cap');
assert.notEqual(await L.coachCode('a'), await L.coachCode('b'));
assert.match(await L.coachCode('user-1'), /^[0-9A-Z]{4}$/);
// real SQL against SQLite
const db = new DatabaseSync(':memory:');
L.CREATE_SQL.forEach((s) => db.exec(s));
let tick = 0;
const score = (u, day, won, mode = 'pool', prog = L.ALLOWED_PROGRAMS[0]) => {
  const at = new Date(Date.parse(day + 'T18:00:00Z') + tick++ * 1000).toISOString();
  db.prepare(L.SUBMIT_SQL).run(u, L.weekStartFor(day), prog, L.pointsFor(won, mode), won ? 1 : 0, won ? 0 : 1, day, at);
};
const board = (day, me = 'A') => L.shapeBoard(db.prepare(L.BOARD_SQL).all(L.weekStartFor(day), day, 25, me), day, me);
// Monday: A wins (10), C wins (10), B loses (3)
score('A', '2026-10-12', true); score('C', '2026-10-12', true); score('B', '2026-10-12', false);
let b = await board('2026-10-12');
assert.deepEqual(b.entries.map((e) => e.rank), [1, 2, 3]);
assert.ok(b.entries.every((e) => !e.isNew), 'nobody is NEW on the first day of the week');
// Tuesday: B wins twice (23 total), D joins with a loss
score('B', '2026-10-13', true); score('B', '2026-10-13', true); score('D', '2026-10-13', false);
b = await board('2026-10-13');
const by = (label) => b.entries.find((e) => e.label.startsWith(label));
const rows = db.prepare('SELECT user_id, points FROM weekly_scores ORDER BY points DESC').all();
assert.equal(rows[0].user_id, 'B', 'B leads after two wins');
const me = b.entries.find((e) => e.isMe);
assert.deepEqual([me.rank, me.movement], [2, -1], 'A fell from 1 to 2');
const top = b.entries[0];
assert.deepEqual([top.rank, top.movement, top.points, top.wins, top.losses], [1, 2, 23, 2, 1], 'B moved up two spots');
assert.equal(b.entries.find((e) => e.isNew).rank, 4, 'D is new and ranked last');
assert.equal(b.total, 4);
// Wednesday with no new scores: movement compares with the start of Wednesday, so everyone is flat
b = await board('2026-10-14');
assert.ok(b.entries.every((e) => e.movement === 0 && !e.isNew), 'no change on a quiet day');
// a new week starts empty
b = await board('2026-10-19');
assert.equal(b.total, 0); assert.equal(b.entries.length, 0);
// caller outside the top rows is still returned
for (let i = 0; i < 30; i++) score('P' + i, '2026-10-20', true);
score('Z', '2026-10-20', false);
const rowsZ = db.prepare(L.BOARD_SQL).all('2026-10-19', '2026-10-20', 25, 'Z');
assert.equal(rowsZ.length, 26); assert.equal(rowsZ.at(-1).user_id, 'Z');
console.log('PASS: weeks, points, rate limits, anonymous codes, rank movement up/down, NEW tag, quiet day, weekly reset, caller outside top 25.');
