# AAU Dynasty gameplay merge plan

## Product decision

AAU Dynasty is one game. The roster, coaching, development, personality, collecting and season systems are the dynasty layer. The ten-player 3D Chibi v0.6 court is the match presentation and possession layer. The separate 3-on-3 exhibition is a prototype/reference mode, not a second product.

## Current split

- `game.html` and the `public/` modules own the dynasty loop: roster, five starters, coaching calls, development, traits, three-point tracking, season stats, rewards and saves.
- `public/chibi-integration.js` currently opens the 5-on-5 Chibi court from the lobby, but the 12-possession preview does not yet return an official game result to the dynasty loop.
- `public/three-v-three.js` and `public/three-v-three-renderer.js` remain an optional exhibition prototype. They must not create a second season, roster, reward or save path.
- `public/chibi-v0.6/index.html` is generated output. The editable gameplay source remains under `gameplay/chibi/` and the packaging script.

## Merge boundary

The first full integration should add a versioned match contract between the dynasty shell and Chibi engine:

1. The dynasty shell sends the current starting five, ratings, traits, coaching context, opponent and a stable match seed.
2. Chibi runs the full five-on-five match presentation and emits an immutable result object containing final score, winner, possessions, player minutes, points, rebounds, assists, steals, blocks and three-point makes/attempts.
3. The dynasty shell validates the result against the submitted roster and score totals.
4. Only the dynasty shell commits the result: season win/loss, player development XP, fatigue, traits/moments, three-point season totals, Director Points, packs and account save.
5. Replay, pause and camera controls remain presentation features and cannot commit a second result.

The existing preview must remain explicitly labeled preview until this contract exists. It must not be allowed to award season progression merely because a possession animation finished.

## Canonical flow after the merge

`Lobby → roster/development → PLAY 5 × 5 → Chibi match → verified result → halftime/coaching decisions → final result → development/traits/stats/rewards → season map`

The current text simulation can remain as a temporary fallback during implementation, but it should eventually be replaced by the same match contract rather than remain a competing gameplay path. The 3-on-3 mode can remain accessible as an exhibition only if it is clearly outside the season record and uses no duplicate progression logic.

## Guardrails

- Preserve existing saves, collections, card quantities, favorites, roster identities and rewards.
- Do not treat the current 12-possession preview as a complete season engine.
- Do not fabricate player statistics that the Chibi engine did not emit.
- Do not connect result commits until deterministic replay, stale-result protection, score/stat conservation, save restoration and duplicate-submit tests pass.
- Keep the existing Site identity and D1 binding. This is a local implementation task; deployment remains separately authorized.

## Observable completion checks

- A drafted roster enters the 5-on-5 Chibi match with the selected five and current ratings.
- A completed match returns exactly one validated result to the dynasty shell.
- The result appears in the existing season log and updates XP, traits, fatigue, three-point totals and rewards once.
- Refreshing, replaying or returning to the lobby cannot duplicate the result.
- Existing pack/collection/account tests remain green.
- The 3-on-3 exhibition cannot affect season standings or dynasty saves.

## First contract slice completed

`gameplay/chibi/engine.cjs` now exposes a version-1 `Broadcast.result()` and `validateResult(result, teams)`. The result includes final score, winner, twelve possession records and player lines for points, field goals, threes, assists, rebounds and steals. Validation checks the submitted ten-player roster, score conservation, possession count and three-point bounds. `scripts/test-chibi-integration.cjs` covers a completed result and rejects a tampered player line.

The bridge now receives the validated result through `onComplete`, keeps it in temporary `chibiPendingResult`, and reports that it is ready. It still does not commit a season result, so existing saves and rewards remain untouched.

The bridge now also provides a guarded `chibiCommitResult()` action. It creates one existing-format season record, copies the validated Chibi player lines including three-point fields, awards development from recorded production, updates the season record and Director Points, applies starter energy cost, grants normal match-progress toward packs, saves, and renders the existing result screen. A stable seed/score commit ID prevents duplicate recording. Trait-specific halftime moments and full coaching simulation remain limited to the text match path until the Chibi engine receives those inputs in a later slice.

## Next implementation slice

Build and test the versioned result contract first. Then connect one local five-on-five match to the existing season record behind an explicit local QA flag. Balance, mobile QA and deployment come after the merged loop is observable and save-safe.
