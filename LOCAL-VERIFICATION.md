# Local runtime verification — October 22, 2026

Recovered Circuit Originals source: `/Users/leonstancil/Documents/AAU-Dynasty`.
Local built Worker: http://127.0.0.1:8787 (loopback only).

## Verified

- No `.wrangler/state` existed before initialization. Applied the six existing `drizzle/0000` through `0005` SQL files, in order, using `d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state`. These files have now been applied; do not replay them against this state.
- Created one new coach profile through the local browser, selected Mambas United, drafted Jamal Thibodeaux and Declan Ashby. No real account credentials or production data were used.
- After the first pick, restarted the built server and reloaded: the first player and the same second-round offers remained. After the second pick, reloaded again: both players remained and draft continuation showed 2/8.
- Read the local database: one player save, matching player IDs `dyn-2027-057` and `dyn-2027-159`, with round-three offers preserved. Catalog API returned HTTP 200, `persistent-database`, and all 200 seed players.
- `npm run build`, `node scripts/verify-draft.cjs`, `node scripts/test-account.cjs`, `node scripts/verify-lineup-form.cjs`, and `git diff --check` passed after the runtime fixes.
- Screenshot: `outputs/local-save-verified.jpg` (ignored local artifact). Logs: `.sites-runtime/local-preview.log`. Database: `.wrangler/state/v3/d1/`. Keep these local; do not publish test profiles or state.

## Runtime repairs

`app/api/players/route.ts` now binds an empty source URL when a ranking has none. The existing non-null database column rejects undefined; fictional rankings do not require invented web citations. Catalog/player source data and identities are unchanged.

`game.html` now refreshes the save badge after queued saves on every screen, including the starter draft. Previously, writes succeeded but its footer remained on “Saving…”. The save payload and queue behavior are unchanged.

## Scope and limitations

All work is local. No pack opening, production migration, live-account mutation, Git push or deployment. This verifies fresh-profile creation and mid-draft persistence, not a completed tournament, cross-device recovery, full gameplay, mobile layout or production behavior. The recovered UI retains its existing “The Road to the Peach Jam” title; the source and hosting manifest still identify the selected Circuit Originals recovery.

To restart the built preview from this folder: `npm start -- --port 8787`. Never add `--remote` to the local database commands. The preview uses the existing ignored local database; do not delete it to rerun tests.
