# Three-point shooting — October 25, 2026

Local implementation in `public/three-point.js`, loaded after trait moments in `game.html`. Adds player/team 3PM–3PA and 3PT% to current and historical box-score tables, tracked totals/percentage/game coverage in Season stats, and a range profile plus program-history shooting record on each development card.

The existing Shooting skill drives conversion and develops through the established training/XP system. Position and archetype affect attempt volume (including Stretch Big and Sharpshooter); execution affects conversion. This does not introduce a seventh independent development skill or change collectible attributes/personality assignments.

## Simulation contract

The current game generates the score first. This extension creates a three-point breakdown within those existing player points, rather than adding points to the score or simulating possessions. Makes are nonnegative integers, at most attempts and floor(player points / 3). Zero-minute players attempt zero shots. Team makes and attempts sum player lines. Unavailable players remain excluded by the existing rotation logic.

A deterministic hash of game/player context generates attempts and conversions without consuming additional Math.random calls. Results are recorded with the existing box-score JSON and account-save path. Rendering does not reroll or award XP/rewards. New row fields: `threeMade`, `threeAttempts`, `threeRating`, `threeStyle`; totals include the first two; box metadata `threePointVersion: 1`.

Old game records remain untouched and display — for untracked fields. Zero attempts display 0–0 and — percentage. Aggregate percentage is total makes / total attempts, only over tracked rows; 3PT GP explicitly shows coverage. Existing season records span program history across years, so the development card labels that scope.

## Verification

- `node scripts/test-three-point.cjs`: score/team conservation, bounded makes/attempts, deterministic output, 200 fixed-seed skill comparisons, DNP/low-score cases, legacy exclusion, weighted percentages, player profile rendering, repeated-render preservation, account restoration, 100 generated box scores.
- Existing development, traits, trait-moments, coaching and lineup/form tests passed.
- Local build passed; `.sites-runtime/three-point-build.log`. Whitespace check passed.
- Full-script isolated browser fixture with in-memory account/catalog endpoints verified game box score, season shooting totals and all roster development profiles. At 390px, document width stayed 390px; the table scrolled within its container. No observed console errors; viewport restored and fixture server stopped.
- Screenshots: `outputs/three-point-box-score.png`, `outputs/three-point-mobile.png`.

No production save writes, actual pack openings, migration, push or deployment. Existing unrelated Vault, trait-moment and reference changes preserved. Real D1/cross-device persistence and long-run statistical balance were not verified in this task. The field-goal/free-throw breakdown remains outside this change.
