# 3-on-3 exhibition — October 29, 2026

Leon selected a separate playable mode. Added a lobby entry in the existing game; season games remain unchanged. Local implementation only, not deployed.

## Implementation

- `public/three-v-three.js`: choose exactly three current roster players (or existing fictional catalog players when fewer than three are drafted), face three distinct catalog opponents, coach Attack the rim / Hunt threes / Push the pace, pause, advance a play, change playback speed and start another matchup.
- `public/three-v-three-renderer.js`: software-rendered 3D geometry with perspective projection, depth-sorted polygons, articulated limbs, a ball, half court and hoop. Stylized block models are generic representatives, not approved character likenesses. No new dependency or downloaded model assets.
- `public/three-v-three.css`: court, selection and stats layouts. Existing portraits are reused for selection.
- `game.html`: loads the mode and rendering assets after the existing three-point extension.

The possession engine produces events first, then updates score and player statistics from those events. Shooting, athleticism, ball handling, defense and temporary exhibition energy influence outcomes. Hunt threes increases perimeter attempts. Push the pace increases dunk opportunities with greater turnover risk and energy cost. Tracks points, 3PM–3PA, weighted player 3PT%, dunks, assists, rebounds, steals and blocks. Two-point/three-point scoring is an arcade rule, not official 3x3 scoring. First to at least 21 wins; otherwise the lead after 48 possessions wins. Ties continue to at most 60 possessions and may finish drawn.

Exhibitions are session-only and award no XP, packs or season results. They do not write account saves or modify roster ownership. Opening the actual local game used the pre-existing local preview account; QA only clicked exhibition controls. No production interaction, pack opening or migration occurred. Underlying game startup/account machinery was not replaced. Preview logs show existing startup autosave POSTs to the local player-state endpoint; therefore this browser session was not read-only at the local-account level. No before/after database snapshot was taken, so unchanged local save bytes are not claimed.

## Verification

- `node scripts/test-three-v-three.cjs`: 250 complete exhibitions; event/score/player-total conservation; three-point and dunk bounds; energy bounds; six distinct players; deterministic seeded outcomes; terminal-game guard; shooting-plan comparison across 100 seeds.
- Existing three-point, trait-moment, vault-client, development, coaching and 60-run draft tests passed.
- Final `npm run build` passed. Log: `.sites-runtime/three-v-three-build.log`.
- Whitespace check passed. Dependency inputs, lockfile, Site identity/DB binding, migration files and catalog unchanged. Existing unrelated local edits preserved.
- Actual server-served desktop game at 127.0.0.1:5184: verified lobby entry, roster portraits, deselection disabling tip-off, replacement selection, six 3D figures, pause, manual steps, Hunt threes, and matching displayed dunk/three statistics. Observed a 7–6 game at possession 11 with Micah Sato 1–2 from three and Jamal Thibodeaux one dunk. No errors in the inspected browser console.
- Phone-width check and saved screenshot could not be completed: browser capability calls began returning `browser.user is unavailable`. No mobile-quality claim. Earlier desktop screenshot was inspected inline but not saved as an artifact.

## Limits and next action

Animations are scripted from actual possession outcomes, not physics-driven ball/player collisions. No fouls, free throws, offensive rebounds, persistent exhibition history or season integration. Simplified models/animation and long-run balance need Leon’s review; no realism or visual approval claim. Physical-device performance and responsive browser QA remain outstanding.

The October 28 release-candidate archives are unchanged and exclude this new mode; they must not be presented as a package for these changes. After review, prepare a fresh candidate before separately authorized publication.

Restart local preview from `/Users/leonstancil/Documents/AAU-Dynasty` with `npm run dev -- --port 5184`, then open http://127.0.0.1:5184/ and choose PLAY 3 × 3. Local QA server is stopped at task teardown.
