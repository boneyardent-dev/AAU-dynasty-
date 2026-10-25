# Player traits — October 24, 2026

Local-only addition of Leon’s eleven requested traits. Two stable traits per player: one work habit (Gym Rat, Hustler, Hates Cardio) and one court personality (Flashy, Cocky, Jumpy, Crashout, Hacker, Clutch, Nervous, Streaky). Defaults derive from player identity and persist on gameplay/training. Old saves derive the same defaults without a migration. Account restoration clears missing trait state so it cannot leak between coaches.

Implementation: `public/player-traits.js`, `public/player-traits.css`, asset links in `game.html`. Small integration points in `public/lineup-form.js` capture execution effects before score calculation, apply second-half personality margin and charge trait fatigue; `public/player-development.js` supplies explicit XP sources and displays training bonus history. Permanent attributes, development ceilings, printed cards, identities, ownership, quantities, favorites and pack rewards remain separate.

## Rules

- Gym Rat: +20% specialist/support training XP (60 → 72; 30 → 36). No bonus to game or offseason XP.
- Hustler: 1.15× rebounding/steal allocation weight; +1 energy for a full game in starting units.
- Hates Cardio: +3 energy with pace/press, otherwise +1, prorated across starting halves.
- Flashy: ±0.05 execution depending on whether the base roll is above/below normal.
- Cocky: +0.04 execution after the program’s most recent win, −0.04 after a loss; neutral before first game.
- Jumpy: ±0.03 execution; 1.15× block allocation weight; +1 energy prorated by starting halves.
- Crashout: when trailing at least six at halftime, pressure gives −1 second-half margin; composed gives +0.4.
- Hacker: with pressure, +0.03 execution or −0.06 for base rolls below 0.9, with 1.15×/0.85× steal allocation weight respectively; +1 energy prorated by starting halves. This is a simulated discipline/execution effect, not tracked foul counts or ejections.
- Clutch: +0.8 second-half margin in the closing five if halftime gap is six or fewer.
- Nervous: −0.8 in that same close-game condition; composed reduces penalty to −0.3.
- Streaky: amplifies base execution deviation from 1 by 35%.

Execution is bounded to 0.60–1.40. Combined second-half personality margin is bounded to ±2.5. Stats remain allocated after the team score; all totals are conserved. Unavailable players receive no game stats or trait fatigue. Per-game execution, notes, closing responses and energy costs are saved in the game simulation snapshot; rendering a recap never rerolls effects. No trait changes physical growth or collection ownership.

Visible in player development, pregame, a trait guide, halftime reminders and postgame recap. Effects are described as fictional game personalities, not recruiting facts.

## Checks and limits

- `scripts/test-player-traits.cjs` passed: all 11 traits represented; two-family assignments; training-only XP; close/calm/tilt rules and cap; fatigue proration; execution swings; real rebounding allocation change with conserved stats; saved trait/game snapshots; account isolation; no stale rerolls/rewards; raw catalog/inventory preservation and guide display.
- Existing development, coaching, lineup, circuit, premium pack, physical, card-frame, account and 60-run draft checks passed. Coaching fatigue assertions now separate base fatigue from recorded trait costs.
- Local build passed; `.sites-runtime/player-traits-build.log`. Whitespace check passed.
- Browser fixture: full expanded game scripts with in-memory auth/save/catalog adapters, no real account writes or pack draws. Controlled sample pairings show Gym Rat/Clutch, Hates Cardio/Crashout and the remaining traits. Verified visible badges, 72-XP training labels and all eleven guide entries. At 390×844, guide scroll width equals viewport width; no horizontal overflow. No console errors observed; temporary viewport restored.
- Screenshot: `outputs/player-traits.png`. Generator/server: `.sites-runtime/make-traits-preview.cjs`, `.sites-runtime/serve-traits-preview.cjs` (ignored). Isolated QA server stopped after verification. Existing game preview refreshed on port 8790.
- No deployment, push, migration, production data change or actual pack opening. Full browser tournament with trait effects, real D1/cross-device persistence, subjective balance and physical-device performance remain unverified. Next: Leon playtests personalities and tradeoffs locally; tune before a separately authorized release.
