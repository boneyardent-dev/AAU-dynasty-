# Coaching foundation — October 22, 2026

Local-only implementation in `public/lineup-form.js`; isolated coverage in `scripts/test-coaching.cjs`. Existing unrelated changes remain preserved. No deployments, pushes, production migrations, or live save changes.

## Behavior

- Pregame reports compare simulated opponent offense, defense, and composure. Current lineup/approach adds a bounded −2 to +2 matchup-strength effect. Suggested lineups include this effect.
- Pressure compares lineup defense, energy, and opponent composure, costing 6 additional energy to closing players. Floor general compares passing/IQ against defense and costs 2 additional energy. Both adjustments range from −2 to +3 second-half margin. Composed adds 0.5 margin and saves 2 energy.
- Bench previews and executes one eligible substitution, preserving guard/big and availability requirements. Closing strength and execution are recalculated. Closing five carries to the next pregame, where it can be edited. No eligible reserve disables the call.
- Active-half fatigue and reserve-half fatigue are charged separately. Unavailable players retain their energy. Scoring shares account for both opening and closing roles. Other box-score categories remain estimated, not possession events.
- Game history retains opening/closing lineups, matchup effects, adjustment, fatigue spent, random components and rotation. Postgame explains contributing factors and suggests a next-game focus. Old saves require no migration; ownership, quantities, favorites and reward rules are unchanged.

## Checks

- `node scripts/test-coaching.cjs`: eligible actual rotation; split fatigue; closing-strength calculation; conserved scores; stale clicks; account restoration of lineup and coaching history; directional opponent/energy tradeoffs; unavailable reserves; unchanged ownership; five-game weekend flow and existing reward cadence. Semifinal win is forced to exercise the final; this does not establish balance.
- Existing isolated tests passed: `verify-lineup-form.cjs`, `test-circuit.cjs`, `test-physical.cjs`, `test-account.cjs`, `test-circuit-originals.cjs`, `test-pack-premium.cjs`, `verify-draft.cjs` (including 60 randomized drafts).
- `npm run build` passed after initial implementation and again after the final correction. Final follow-up build output: `.sites-runtime/coaching-build.log`.
- `git diff --check` passed.
- Real built Worker browser at `http://127.0.0.1:8790/`: existing local Mambas United test coach; started local tournament, saw scouting; confirmed halftime and chose bench; Khalil Kaplan replaced Declan Ashby; final 70–69; six eligible players in box score totaling 70; unavailable players had no stats; recap displayed opening/closing strength and named rotation; Level 2 program progression displayed; save badge reached “Saved to your account.” This account is on local D1 only.
- Screenshot: `/Users/leonstancil/Documents/AAU-Dynasty/outputs/coaching-recap.jpg` (ignored output). Screenshot predates the final additional energy-spent sentence and unavailable-player reporting correction.

## Limits and next action

Desktop browser flow verified for one game, not a full browser tournament. Full weekend coverage is isolated/mocked. Mobile layout, cross-device recovery, midgame reload continuation, long-run balance and deployed behavior remain unverified. Midgame recovery is not added by this change. No aging, graduation or year-two transition implemented in this coaching milestone.

Next: playtest a full local weekend, including tired rosters, on desktop and mobile; tune choices based on results. Then implement the separately discussed season/aging transition. Preview startup command: `npm start -- --port 8790`; do not replay local migrations.
