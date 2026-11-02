# AAU Dynasty gameplay source of truth

Confirmed by Leon on October 30, 2026: preserve **ten-player 3D Chibi v0.6**.

Master repository: `/Users/leonstancil/Documents/AAU-Dynasty`.
Do not start another replacement gameplay project or treat the six-player exhibition as the selected gameplay.

- `gameplay/chibi/`: original ZIP contents, including complete source, bundled Three.js, license and original tests. These files were imported without modification; subsequent presentation edits are recorded below. The supplied ZIP remains the untouched reference.
- `public/chibi-v0.6/index.html`: generated browser entry, packaged from that original by `scripts/build-chibi.cjs`. Do not edit this generated file; edit the source and packaging script.
- `public/chibi-integration.js`: lobby, current-roster adapter and court cleanup. Uses current starting five, filling vacancies from the roster. With fewer than five roster players, preserves original sample teams. Opponents come from the fictional catalog with distinct IDs.
- Main game path: Lobby → PLAY 5 × 5. The optional 3-on-3 mode remains available separately.
- `outputs/consolidation-2026-10-30/`: untouched supplied ZIP, SHA-256 provenance and pre-integration source backup, including unpublished edits.

The v0.6 engine is a 12-possession alternating half-court watch preview, not a full season match. Ratings are copied into temporary court state. A completed preview only affects the dynasty after the user explicitly selects “Record game + apply development XP”; that action uses the existing capped player-development award path and records a local season result. Full season integration still requires a deliberate engine/results contract; do not fabricate season results from an unvalidated preview.

Cloud uploads and release archives are dated snapshots, not independent working sources or automatic synchronization. Return proposed changes to this repository. Existing hosted Site identity and account database stay unchanged. This integration is local only.

Run `npm run dev -- --port 5184` from the master folder. Both dev and build regenerate the browser entry. Original checks: from `gameplay/`, run `node chibi/test.cjs` and `node chibi/test-render.cjs`.

## Chibi source consolidation — October 30, 2026

- Leon selected ten-player 3D Chibi v0.6. Imported all 12 original archive files byte-for-byte into `/Users/leonstancil/Documents/AAU-Dynasty/gameplay/chibi/`. Source ZIP, SHA-256 manifest and pre-integration source backup are under `outputs/consolidation-2026-10-30/` in that repository.
- Added primary Lobby → PLAY 5 × 5 entry; uses current starters/current ratings with original sample teams for incomplete rosters. Generated court is `public/chibi-v0.6/index.html`; bridge is `public/chibi-integration.js`. Optional 3-on-3 remains separate. Master guide: `/Users/leonstancil/Documents/AAU-Dynasty/GAMEPLAY-SOURCE.md`; repository AGENTS.md records the selected gameplay.
- Original 300-seed simulation/replay and 3D adapter tests passed. New bridge tests passed for starter order, ten distinct IDs, rating transfer, sample fallback, no roster mutation and cleanup. Existing 250-exhibition, account and player-development checks passed. Final local build and whitespace check passed.
- Isolated browser fixture verified roster-fed court, ten 3D models, live score/play log, pause and return to lobby; standalone camera switching verified. No captured browser errors. Screenshot: `outputs/consolidation-2026-10-30/integrated-court.png`. Browser tests used sample roster data and no account backend. Full account-backed browser integration, mobile and listening QA remain unverified.
- This is the original 12-possession half-court preview, not complete season integration. No season results, XP, packs or live saves were changed. No deployment, Git push or cloud upload. Temporary QA servers stopped after testing.
- Next: Leon reviews retained gameplay; implement a deliberate full-season engine/results contract before linking these possessions to persistent wins/rewards. Use this master repository for all future changes; cloud snapshots must be refreshed explicitly.

## Four-on-four presentation pass — October 31, 2026

- The local preview now runs four players per side (eight total) to reduce visual congestion; the source engine accepts four-player teams and the bridge selects four starters plus four distinct opponents. The earlier five-player source remains preserved in the consolidation archive.
- Added a fourth camera preset, `shoulder`, alongside broadcast, tactical and baseline views. Dunks now hold the player at the rim briefly with a hanging pose, while the existing rim, net and audio impact effects remain active.
- Expanded procedural hairstyles to five variants and softened the 3D geometry with rounder limb segments. The presentation source remains `gameplay/chibi/renderer.js`; the generated browser entry is refreshed by `scripts/build-chibi.cjs`.
- Checks passed: four-on-four engine/replay, integration validation, 300 seeded deterministic possessions, render adapter, player-art gate, local build and whitespace. No deployment or season-save changes.
- Startup follow-up: regenerated the browser package from the four-player source and restored the result-validation export used by the main-game bridge. The local preview was restarted after that correction.
- Lightweight progression: validated four-on-four results now show a small XP preview before commit. The explicit commit action records the game and routes box-score production through the existing capped development system; no reward is applied when the user exits or leaves the result uncommitted.
- Checks passed after progression wiring: bridge integration, four-on-four replay, render adapter, player-art gate, local build and whitespace.

## Ten-player 5v5 restoration — November 1, 2026

- Restored the selected ten-player 3D Chibi v0.6 path in the editable engine, packaged browser entry, roster bridge and integration tests. The temporary four-on-four presentation pass remains preserved in history, but is no longer the active local game path.
- Restored five-player sample teams and current-roster/opponent selection. The main lobby now reads Lobby → PLAY 5 × 5, with ten articulated players and the existing validated result/progression boundary.
- Checks passed: ten-player bridge integration, 300 deterministic possessions and replay, 3D render adapter, coaching, account, lineup, traits, three-point, exhibition, artwork gate, local production build and whitespace. Browser smoke test showed the roster-fed five-on-five court at `http://127.0.0.1:8791/`.
- No deployment, production database write, account-save mutation, Git push or cloud upload occurred. The 12-possession preview is still not a full season engine; only the explicit dynasty commit action applies local progression.

## Court presentation — October 30, 2026

- In `gameplay/chibi/renderer.js`, ball radius is now 0.1442: 3% above the original 0.14, per Leon’s correction. Seams scale proportionally. Removed the center-court Mambas United banner.
- `scripts/build-chibi.cjs` now refreshes the embedded renderer from editable source when packaging the browser entry. Original source ZIP remains preserved.
- Packaging, bridge checks and whitespace check passed after the correction. Renderer adapter checks passed before the final radius adjustment. Final browser verification remains incomplete: automatic approval review hit a usage limit. No deployment.
- Next: refresh local preview and visually review the larger ball.
