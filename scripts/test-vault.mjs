import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import * as V from '../lib/vault-core.ts';
const raw = new DatabaseSync(':memory:');
const db = { prepare: (sql) => ({ bind: (...a) => ({ run: async () => raw.prepare(sql).run(...a), first: async () => raw.prepare(sql).get(...a) ?? null, all: async () => ({ results: raw.prepare(sql).all(...a) }) }) }) };
V.VAULT_CREATE_SQL.forEach((s) => raw.exec(s));
const now = new Date('2026-10-20T18:00:00Z');
const roster = [...Array(10)].map((_, i) => ({ id: 'p' + i, p: i < 5 ? 'G' : i < 8 ? 'W' : 'B', r: 'Style' + (i % 7) }));
const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
// welcome pack, idempotent
await V.ensureVault(db, 'u1', now); await V.ensureVault(db, 'u1', now);
let st = await V.vaultState(db, 'u1'); assert.equal(st.packs, 1); assert.equal(st.last, null);
// opening: server draws five cards, spends one pack, keeps the batch until collected
const rng = seq(0.05, 0.1, 0.35, 0.5, 0.65, 0.85, 0.95, 0.99, 0.999, 0.2, 0.7);
const o = await V.openPack(db, 'u1', roster, rng);
assert(o.ok && o.batch.cards.length === 5 && ['shooting', 'scout', 'defense'].includes(o.batch.bonusSupport));
st = await V.vaultState(db, 'u1'); assert.equal(st.packs, 0); assert.equal(st.cards.reduce((a, c) => a + c.quantity, 0), 5); assert.equal(st.last.batchId, o.batch.batchId);
assert.deepEqual((await V.openPack(db, 'u1', roster)).reason, 'collect-first', 'cannot open again before collecting');
await V.collectBatch(db, 'u1'); assert.equal((await V.vaultState(db, 'u1')).last, null);
assert.equal((await V.openPack(db, 'u1', roster)).reason, 'no-packs', 'no packs, no draw');
await V.ensureVault(db, 'shop', now); assert.equal(await V.grantTestPack(db, 'shop', 'midnight-run'), true); let shop = await V.vaultState(db, 'shop'); assert.equal(shop.packs, 2); assert.deepEqual(shop.packThemes, ['midnight-run'], 'testing purchase grants a themed pack on the server');
assert.equal(await V.grantTestPack(db, 'shop', 'not-a-theme'), false); shop = await V.vaultState(db, 'shop'); assert.equal(shop.packs, 2, 'invalid test themes grant nothing');
const concreteRoster = [...Array(6)].map((_, i) => ({ id: 'concrete-' + i, p: 'G', r: 'Concrete', series: 'concrete-royalty-v1' }));
await V.ensureVault(db, 'concrete', now); assert.equal(await V.grantTestPack(db, 'concrete', 'concrete-royalty'), true, 'Concrete Royalty is an approved featured theme');
const concreteOpen = await V.openPack(db, 'concrete', [...roster, ...concreteRoster], () => 0);
assert(concreteOpen.ok); assert.equal(concreteOpen.batch.themeId, 'concrete-royalty');
assert.equal(new Set(concreteOpen.batch.cards.map((c) => c.playerId)).size, 5, 'the themed server draw contains five unique players');
assert(concreteOpen.batch.cards.every((c) => c.playerId.startsWith('concrete-')), 'Concrete Royalty packs draw only from their six-player roster');
// rarity odds match the game's table, and special editions follow rarity
const counts = {}; const r2 = (() => { const a = new Uint32Array(1); return () => (crypto.getRandomValues(a), a[0] / 4294967296); })();
for (let i = 0; i < 40000; i++) { const k = V.rarityFor(r2()); counts[k] = (counts[k] || 0) + 1; }
for (const [k, p] of Object.entries({ Common: .55, Uncommon: .25, Rare: .12, Epic: .06, Legendary: .017, Mythic: .003 })) assert(Math.abs(counts[k] / 40000 - p) < 0.012, k + ' share ' + counts[k] / 40000);
assert.equal(V.rarityFor(0.999), 'Mythic'); assert.equal(V.rarityFor(0.0), 'Common');
// duplicates stack; special edition recorded; a failing draw refunds the pack
await V.grantPacks(db, 'u1', 2);
const fixed = seq(0.0, 0.999, 0.0, 0.999, 0.0, 0.999, 0.0, 0.999, 0.0, 0.999, 0.1);
const d = await V.openPack(db, 'u1', roster, fixed); await V.collectBatch(db, 'u1');
assert(d.batch.cards.every((c) => c.rarity === 'Mythic' && c.playerId === 'p0') && d.batch.cards.filter((c) => c.duplicate).length === 4, 'same player and rarity stacks');
st = await V.vaultState(db, 'u1'); const my = st.cards.find((c) => c.rarity === 'Mythic'); assert.equal(my.quantity, 5); assert.equal(my.specialEdition, 'PEACH JAM LEGENDS');
await assert.rejects(V.openPack(db, 'u1', roster, () => { throw new Error('boom'); }));
st = await V.vaultState(db, 'u1'); assert.equal(st.packs, 1, 'pack refunded after a failed draw'); assert.equal(st.last, null);
// two simultaneous opens with one pack: only one wins
const [a, b] = await Promise.all([V.openPack(db, 'u1', roster), V.openPack(db, 'u1', roster)]);
assert.equal([a, b].filter((x) => x.ok).length, 1, 'only one of two simultaneous opens succeeds'); await V.collectBatch(db, 'u1');
// games: a pack every third game, season XP counts only inside the season
await V.ensureVault(db, 'g', now);
const before = (await V.vaultState(db, 'g')).packs; const gr = [];
for (let i = 0; i < 6; i++) gr.push((await V.grantGame(db, 'g', '2026-10-20')).granted);
assert.deepEqual(gr, [0, 0, 1, 0, 0, 1]); st = await V.vaultState(db, 'g'); assert.equal(st.packs, before + 2); assert.equal(st.season.xp, 120);
await V.grantGame(db, 'g', '2026-12-01'); assert.equal((await V.vaultState(db, 'g')).season.xp, 120, 'no XP after the season ends');
// daily rewards on the server clock
await V.ensureVault(db, 'd', now); const days = []; 
for (let i = 0; i < 8; i++) days.push((await V.claimDaily(db, 'd', new Date(Date.parse('2026-10-20T00:00:00Z') + i * 864e5).toISOString().slice(0, 10))).granted);
assert.deepEqual(days, [1, 1, 2, 1, 1, 1, 3, 1], 'day 3 and 7 bonuses, then the cycle restarts');
assert.equal((await V.claimDaily(db, 'd', '2026-10-27')).granted, 0, 'no double claim in one day');
assert.equal((await V.claimDaily(db, 'd', '2026-10-26')).granted, 0, 'a clock set backwards cannot claim');
assert.equal((await V.claimDaily(db, 'd', '2026-10-30')).streak, 1, 'a missed day resets the streak'); assert.equal((await V.vaultState(db, 'd')).daily.best, 8);
// goals use the server's own card list
await V.ensureVault(db, 'k', now);
const give = (u, id, rar = 'Rare') => raw.prepare("INSERT OR IGNORE INTO vault_cards VALUES (?1,?2,?3,?4,1,0,NULL)").run(u, V.cardKey(id, rar), id, rar);
for (const id of ['p0', 'p1', 'p2', 'p3']) give('k', id);
assert.equal((await V.claimGoal(db, 'k', 'guards5', roster, '2026-10-21')).granted, 0, 'four guards is not enough');
give('k', 'p0', 'Epic'); assert.equal((await V.claimGoal(db, 'k', 'guards5', roster, '2026-10-21')).granted, 0, 'two cards of one player count once');
give('k', 'p4'); const p0 = (await V.vaultState(db, 'k')).packs;
assert.equal((await V.claimGoal(db, 'k', 'guards5', roster, '2026-10-21')).granted, 1); assert.equal((await V.vaultState(db, 'k')).packs, p0 + 1);
assert.equal((await V.claimGoal(db, 'k', 'guards5', roster, '2026-10-21')).granted, 0, 'pays once'); assert.equal((await V.claimGoal(db, 'k', 'nope', roster, '2026-10-21')).granted, 0);
assert.equal((await V.vaultState(db, 'k')).season.xp, 30, 'goal XP');
// season levels
await V.ensureVault(db, 's', now); raw.prepare("UPDATE vaults SET season_id='s1', season_xp=250 WHERE user_id='s'").run();
assert.equal((await V.claimLevel(db, 's', 3, '2026-10-21')).granted, 0, 'locked level');
assert.equal((await V.claimLevel(db, 's', 2, '2026-10-21')).granted, 1); assert.equal((await V.claimLevel(db, 's', 2, '2026-10-21')).granted, 0, 'pays once');
assert.equal((await V.claimLevel(db, 's', 0, '2026-10-21')).granted + (await V.claimLevel(db, 's', 99, '2026-10-21')).granted + (await V.claimLevel(db, 's', 1.5, '2026-10-21')).granted, 0, 'invalid levels');
raw.prepare("UPDATE vaults SET season_id='old', season_xp=900 WHERE user_id='s'").run(); assert.equal((await V.vaultState(db, 's')).season.xp, 0, 'a new season starts at zero');
// the server's rules match the ones in the game files
const read = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const ctx = vm.createContext({ inventoryRead: () => ({}), inventoryChange() {}, players: [], Date, Math, JSON, Set, Number, Object, Array, Promise, fetch() {} });
vm.runInContext(read('public/retention.js'), ctx);
const cl = (e) => JSON.parse(JSON.stringify(vm.runInContext(e, ctx))); // plain copies: arrays from the vm have a different prototype
assert.deepEqual(cl('RT_CYCLE.map(x=>x.pk)'), V.DAILY_CYCLE); assert.deepEqual(cl('RT_LEVELS'), V.LEVEL_PACKS); assert.equal(cl('RT_XP_PER'), V.XP_PER_LEVEL);
assert.deepEqual(cl('[SEASON.id,SEASON.start,SEASON.days]'), [V.SEASON.id, V.SEASON.start, V.SEASON.days]);
assert.deepEqual(cl('RT_GOALS.map(g=>[g.id,g.n,g.pk])'), V.GOALS.map((g) => [g.id, g.n, g.pk]), 'goal list matches');
const game = read('game.html'); const cuts = /n<\.55\?'Common':n<\.80\?'Uncommon':n<\.92\?'Rare':n<\.98\?'Epic':n<\.997\?'Legendary':'Mythic'/.test(game); assert(cuts, 'rarity table matches the game');
const base = JSON.parse(read('data/base-roster.json')); const lit = game.slice(game.indexOf('const players=['), game.indexOf('];', game.indexOf('const players=[')));
assert.deepEqual([...lit.matchAll(/\{id:'([^']+)',n:'[^']*',r:'([^']*)',p:'([^']*)'/g)].map((m) => ({ id: m[1], r: m[2], p: m[3] })), base, 'starter roster file matches game.html');
console.log('PASS: welcome pack, server draws and odds, stacking and special editions, refund on failure, simultaneous opens, games, daily on the server clock, goals, season levels, and the rules match the game files.');
