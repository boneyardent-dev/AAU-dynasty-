# Account-backed pack playtest — October 25, 2026

## Scope and outcome

Local continuation of Leon's request to improve the existing game. Read the current brief/status: version 14 already published the prior pack, development and trait work. This milestone tests the current account-backed pack flow and fixes its persistence gaps. These fixes have not been published.

Changed only `public/vault.js` and `scripts/test-vault-client.cjs` for this milestone. Concurrent edits to `game.html`, trait files and other artifacts were preserved. Site identity, lockfile, catalog and migration sources are unchanged.

## Fixes

1. Pack-summary favorites now use the server vault endpoint, through the same guarded helper as collection favorites. Before the fix, a summary star appeared immediately but disappeared on reload; reproduced in the real local browser. Confirmed favorite state is updated after server acknowledgement. Failure preserves the prior state; repeated taps on the same card are guarded.
2. Account-backed Finish Opening now waits for the server instead of clearing the local summary first and swallowing failures. Offline/failed requests leave the summary and enabled retry button available with an explicit error. Success updates the local mirror and presentation phase. Signed-out local behavior retains its existing path.
3. Successful support deliveries record the latest 64 batch receipts in the existing account collection JSON. Replayed successful open responses cannot increment support again, including receipt round-trips. Existing same-batch saved support is treated as already delivered; no historical quantities are deducted or rewritten. No database migration.

## Real local runtime

- Created a new isolated D1 state at `.wrangler/pack-playtest-20261025/`. Applied the six existing migrations there once, all with `--local`; do not replay them. Existing `.wrangler/state` was not used for testing.
- Created one disposable local coach using the actual account UI. Recovery code stayed in tool-session memory and was discarded; no credentials saved in artifacts or output.
- Used IPv6 loopback `http://[::1]:8792/`, separating browser cookies/storage from Leon's existing `127.0.0.1:8790` game. A second origin on port 8793 verified account restoration with fresh browser storage and the same local session.
- The first alternative 127.0.0.2 bind was unavailable on this Mac; no network settings changed. An initial second-preview attempt served empty JavaScript responses during concurrent local preview/build activity. A fixed compiled snapshot in `.sites-runtime/pack-playtest-dist/` plus a unique worker name/runtime registry resolved the preview collision. Final checks used this stable snapshot. Its vault.js SHA-256 matches the changed source: `30776af0ca75d44a4febb31995f17f0dd8583c24ec0b411739bed2ba1779a0f5`.
- Stable preview command used `SITES_RUNTIME_ROOT=.sites-runtime/pack-playtest-runtime`, worker name `aau-pack-playtest`, snapshot config `.sites-runtime/pack-playtest-dist/server/wrangler.json`, isolated persistence above, `--local`, `--ip ::1` and port 8793. Owned QA servers were stopped after verification. The main user preview was not restarted or its saves modified.

## Browser acceptance checks

- Welcome pack: one server draw, five player cards, one bonus. Chose card 3 first; reloaded midway and returned to the same 1/5 reveal progress. Revealed the remaining four manually, then the bonus.
- Reproduced the summary favorite disappearing on reload before the fix; after the fix it survived reload, server restart, finishing, and fresh-origin restoration. The same five identities and bonus quantity remained.
- At 390 × 844, page scroll width was 390, summary row stayed within its container, and the saved star/support panel remained readable. This is desktop viewport emulation, not a physical phone test.
- Finished the first pack, then restored all five cards, the favorite, and exactly one Defensive Architect coach into a fresh browser origin via the real D1-backed account.
- Used the existing free testing purchase on the isolated account to open one Concrete Royalty pack. Reveal All reached the six-reward summary, including bonus progress.
- Stopped the QA server while that summary was open. Finish Opening showed an alert, retained the summary and enabled retry. Restarted the identical snapshot against the same isolated database; retry completed successfully. The original favorite remained available through Favorites Only.
- Final read-only D1 aggregates: 10 card editions, 10 player cards owned, 1 favorite, 0 unopened packs, last_batch null, 2 bonus receipts, 2 total bonus cards. Counts log: `.sites-runtime/pack-playtest-final-counts.log`.

## Checks and artifacts

Passed:

- `node scripts/test-vault-client.cjs` — new summary favorite, failed favorite, repeated taps, failed finish, concurrent finish and successful-open replay assertions.
- `node scripts/test-vault.mjs` — real in-memory SQLite vault logic, draws, duplicates, odds, simultaneous opens, rewards and refunds.
- `node scripts/test-pack-premium.cjs`, `node scripts/test-account.cjs`, `node scripts/test-circuit.cjs`.
- `npm run build` — `.sites-runtime/full-pack-playtest-build.log`.
- `git diff --check`; lockfile/hosting/catalog/migration sources unchanged.

Screenshots (ignored local artifacts):

- `outputs/account-pack-verified.png`: actual account-backed six-reward summary.
- `outputs/account-pack-mobile.png`: retained favorite and bonus at phone width.
- `outputs/account-vault-restored.png`: favorite retained after fresh-origin restoration and interrupted-finish retry.

## Limits and next action

No production save access, production migrations, deployments or Git push. Only the disposable isolated local coach opened packs. This does not establish physical-device audio/performance, geographically separate devices, concurrent multi-device ordering, or recovery if the initial opening response is lost before its first local application. The first-generation support inventory still travels in the account JSON; this pass does not convert it into a fully server-authoritative ledger.

Next useful gameplay milestone: a complete isolated season playtest covering coaching, traits, XP, fatigue and offseason handoff. Tune observed problems before introducing graduation/incoming cohorts, which need an explicit roster-transition contract. Release these pack fixes only under a separately authorized publication scope.
