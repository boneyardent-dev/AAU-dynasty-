# Player development foundation — October 24, 2026

Local implementation of Leon’s approved first version: XP from games and training; six individual skill-growth paths; plateaus and breakthroughs; offseason physical changes; a readable development history. Existing game and pack work retained. No deployment, push, migration, live save mutation, or pack opening.

## Source

- `public/player-development.js`: progression engine, minutes/stat allocation, specialist integration, player dashboard, postgame awards, offseason report and year-two handoff.
- `public/player-development.css`: responsive dashboard styles.
- `game.html`: loads these assets after the existing modules and before catalog boot.
- `public/circuit.js`: stops the old every-third-game random rating adjustment when the new development engine is present. Existing scouting observations and previously earned deltas are preserved.
- `scripts/test-player-development.cjs`: isolated progression, persistence and lifecycle coverage.

Pre-existing pack animation, bonus and summary changes are preserved. They are not part of the development implementation and are not published by this task.

## Gameplay contract

### XP and production

A 32-minute game has 160 team minutes. Each half allocates 80: eligible reserves receive about four minutes; the starting unit shares the remainder. A halftime substitution changes those shares. All available players can receive estimated minutes; unavailable players receive neither stats nor XP. These are rotation estimates, not tracked possession events.

Player points, rebounds, assists, steals and blocks are reallocated using minutes plus their relevant skills. Team totals still match the existing simulation, including the final score. XP is `12 + minutes + production`, with production capped at 24. Scoring, rebounding, assists, steals and blocks contribute. No win-only XP gate; reserves and defensive roles can grow.

A saved game receives its development awards once. Repeated result calls do not grant XP again. Historical games are not retroactively replayed for XP.

### Skills and potential

Six separate skills: ball handling, athleticism, shooting, defense, bag work and basketball IQ. Every 100 total XP marks a player level, but level-ups do not automatically add to every rating. Game contributions distribute skill XP; specialist sessions focus it.

Each player/skill has saved, deterministic potential: 3–18 points of headroom from the initial development rating, capped at 99. Skill opportunities cost 60 XP plus 12 per previously gained point. A seeded opportunity can plateau, gain one point or break through for two. Ceilings, attempts and outcomes persist; reloads cannot reroll them. Potential copy remains tentative early in a career. This is a fictional gameplay model, not a sourced prediction.

Specialist sessions retain the existing cost of 14 Director Points and +6 loyalty but replace future flat +4 rating grants with 60 focused XP. Already earned legacy bonuses remain. Successful owned Shooting Specialist support cards keep their existing +2 capped effect and also give 30 shooting XP. Concurrent taps cannot consume/award twice.

Game calculations receive development gains through `player()`. Printed catalog/collection attributes and owned card snapshots do not receive the new gains. Existing support and legacy effects are preserved.

### Offseason and physical changes

The sixth weekend now creates a saved offseason gate instead of repeating indefinitely. Running development is explicit and one-time; starting the next season requires a processed report and resolution of the existing rival offer. Both actions are guarded against stale clicks.

Simulated age starts from the game class year, bounded 14–17 (class of 2027 starts at 17). It advances once per offseason. Known heights can gain 0–2 inches while simulated age is below 18, limited to five inches of total growth and seven-foot-two height. Known weights can gain 2–8 pounds while simulated age is below 20. Missing measurements remain estimates and do not become invented known measurements. Growth is seeded by individual and season; production cannot increase height. These are explicit game assumptions, not real-world growth predictions.

The report awards 40 XP toward each returning player’s weakest development skill and lists physical/attribute changes. Released players who are no longer in the roster or signed pool are excluded. Reports retain the latest eight seasons; each player retains 40 history entries. Physical changes feed the existing size/rebounding calculations, with a bounded contribution to lineup strength.

Beginning the next season resets the weekend/pool, energy, temporary form and attendance calendar while preserving roster identities, saved development, cumulative win/loss totals, game history, program XP, staff, collection, favorites and rewards. Lobby season number updates. Existing wins/losses remain cumulative in this foundation.

**Not implemented here:** graduation, class eligibility, incoming cohorts and roster replacement. This development mode retains the roster. Those are the next dynasty milestone; no existing player is silently removed.

## Verification

- `node scripts/test-player-development.cjs`: passed. Covers conserved stats/160 minutes; halftime rotation shares; unavailable-player XP exclusion; capped production XP; no replay awards; focused training costs/guards; concurrent support taps; bounded ceilings; plateaus/breakthroughs; immutable catalog/inventory; account save/restore and legacy-account isolation; ordinary weekend vs final weekend; one-time offseason; mature/unknown-height handling; deterministic spurt coverage; year-two handoff.
- Existing isolated checks passed: `verify-lineup-form.cjs`, `test-coaching.cjs`, `test-circuit.cjs`, `test-pack-premium.cjs`, `test-recruiting.cjs`, `verify-draft.cjs` (60 randomized drafts), `test-physical.cjs`, `test-card-frame.cjs`, `test-account.cjs`.
- Initial and final local builds passed. Final build log: `.sites-runtime/player-development-build.log`.
- `git diff --check`: passed.
- Browser QA uses the full expanded game template and production modules, with an in-memory auth/save/catalog adapter. No account endpoint or real pack draw. Generated by `.sites-runtime/make-development-preview.cjs`; served on port 8792 by `.sites-runtime/serve-development-preview.cjs`. It inserts the same archetype data that the server route supplies; this is an isolated frontend fixture, not a real D1 runtime test.
- Browser verified training points 208 → 194, XP 299 → 359, level 3 → 4, and a two-point shooting breakthrough. Offseason scenario (test ages explicitly set to 16) showed Shawn Kaplan 6-5 → 6-7 plus a defense gain, and Ezra Pruitt’s handling plateau. Begin next season returned the same eight players to roster. A normal subsequent coached game showed 160 total minutes, a real halftime swap, production-based XP, level milestones, a plateau and skill gains in the postgame panel.
- Responsive check at 390×844: single-column readable cards/training buttons; DOM scroll width equaled viewport width (390); no horizontal overflow. Temporary viewport reset. No browser console errors observed in inspected flow.
- Screenshots: `outputs/player-development.png`, `outputs/player-development-mobile.png`, `outputs/player-offseason.png` (ignored artifacts).

## Limits and next action

Browser fixture and mock tests do not establish real D1 persistence, cross-device recovery, real-device performance, long-term balancing, six actual tournament weekends in the browser or deployed behavior. New development persistence passed account-payload round trips in isolation. No production changes.

Next: Leon reviews the local dashboard and progression pace; separately playtest a full season with isolated local coach data, then implement graduation and incoming recruiting classes. Review specialist XP/cost pacing before release. Existing local preview URL: http://127.0.0.1:8790/; restart after rebuilding to refresh Wrangler’s static asset manifest. Do not replay local migrations.
