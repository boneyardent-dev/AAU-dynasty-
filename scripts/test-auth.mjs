import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import * as A from '../lib/auth-core.ts';
const raw = new DatabaseSync(':memory:');
const db = { prepare: (sql) => ({ bind: (...a) => ({ run: async () => raw.prepare(sql).run(...a), first: async () => raw.prepare(sql).get(...a) ?? null, all: async () => ({ results: raw.prepare(sql).all(...a) }) }) }) };
A.AUTH_CREATE_SQL.forEach((s) => raw.exec(s));
const t0 = new Date('2026-10-16T12:00:00Z'), ip = 'iphash1';
// codes and tokens
const code = A.newRecoveryCode();
assert.match(code, /^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/, 'recovery code format, no look-alike characters');
assert.equal(A.normalizeCode(' abcd-efgh jkmn '), 'ABCDEFGHJKMN');
assert.notEqual(A.newRecoveryCode(), A.newRecoveryCode()); assert.notEqual(A.randomToken(), A.randomToken());
assert.equal(A.parseCookie('a=1; aau_session=tok%2Fx; b=2', 'aau_session'), 'tok/x'); assert.equal(A.parseCookie('a=1', 'aau_session'), null);
for (const c of [A.sessionCookie('t')]) assert(/HttpOnly/.test(c) && /Secure/.test(c) && /SameSite=Lax/.test(c) && /Max-Age=15552000/.test(c), 'cookie flags');
assert(/Max-Age=0/.test(A.clearCookie()));
// create a guest, session works, nothing secret is stored in plain text
const g = await A.createGuest(db, { now: t0, ipHash: ip });
assert(g.ok && g.userId.startsWith('g_') && g.token && g.recoveryCode);
assert.equal(await A.userForToken(db, g.token, t0), g.userId, 'session resolves to the user');
assert.equal(await A.userForToken(db, 'not-a-token', t0), null);
const stored = JSON.stringify([raw.prepare('SELECT * FROM sessions').all(), raw.prepare('SELECT * FROM guest_users').all()]);
assert(!stored.includes(g.token) && !stored.includes(A.normalizeCode(g.recoveryCode)), 'tokens and codes are stored only as hashes');
// sessions expire after 180 days
const ge = await A.createGuest(db, { now: t0, ipHash: 'expiry' });
assert.equal(await A.userForToken(db, ge.token, new Date(t0.getTime() + 179 * 864e5)), ge.userId);
assert.equal(await A.userForToken(db, ge.token, new Date(t0.getTime() + 181 * 864e5)), null, 'expired session rejected');
assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?').get(ge.userId).n, 0, 'expired session row is deleted');
// recovery on another device
const r = await A.recover(db, g.recoveryCode.toLowerCase().replace(/-/g, ' '), { now: t0, ipHash: 'other' });
assert(r.ok && r.userId === g.userId && r.token !== g.token, 'recovery code signs in as the same user with a new session');
assert.equal(await A.userForToken(db, r.token, t0), g.userId);
// logout ends only that session
await A.logout(db, r.token); assert.equal(await A.userForToken(db, r.token, t0), null); assert.equal(await A.userForToken(db, g.token, t0), g.userId);
// new code replaces the old one
const nc = await A.newCode(db, g.userId);
assert.equal((await A.recover(db, g.recoveryCode, { now: t0, ipHash: 'x1' })).reason, 'invalid', 'old code stops working');
assert((await A.recover(db, nc, { now: t0, ipHash: 'x2' })).ok, 'new code works');
// failed guesses are rate limited per connection, then the window resets
for (let i = 0; i < A.MAX_FAILS; i++) assert.equal((await A.recover(db, 'AAAA-BBBB-CCCC', { now: t0, ipHash: 'bad' })).reason, 'invalid');
assert.equal((await A.recover(db, 'AAAA-BBBB-CCCC', { now: t0, ipHash: 'bad' })).reason, 'rate-limited');
assert.equal((await A.recover(db, nc, { now: t0, ipHash: 'bad' })).reason, 'rate-limited', 'even a right code is blocked while limited');
assert.equal((await A.recover(db, 'AAAA-BBBB-CCCC', { now: new Date(t0.getTime() + 16 * 60000), ipHash: 'bad' })).reason, 'invalid', 'limit resets after the window');
assert.equal((await A.recover(db, 'short', { now: t0, ipHash: 'fresh' })).reason, 'invalid', 'malformed codes rejected');
// new profile creation is limited per connection
for (let i = 0; i < A.MAX_NEW_PER_HOUR; i++) assert((await A.createGuest(db, { now: t0, ipHash: 'farm' })).ok);
assert.equal((await A.createGuest(db, { now: t0, ipHash: 'farm' })).reason, 'rate-limited', 'profile farming limited');
assert((await A.createGuest(db, { now: new Date(t0.getTime() + 3700e3), ipHash: 'farm' })).ok, 'allowed again after an hour');
console.log('PASS: code format, cookie flags, hashed storage, sessions and expiry, recovery on a new device, logout, new code, rate limits for guesses and profile creation.');
