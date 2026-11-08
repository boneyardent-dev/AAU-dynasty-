# AAU Dynasty 2v2 vertical slice — review build

November 8, 2026. Feature branch `feat/holy-shit-2v2`, based on `art/mambas-court-v1`. This is an additive court mode in the canonical AAU Dynasty repository. The existing Lobby → 5v5 Chibi preview, accounts, D1 binding, saves, recruiting, packs, cards, and collection code remain intact. This mode has no storage or season-commit path.

## What can be played

From the lobby choose **PLAY 2 × 2**, or open `/chibi-v0.6/two-on-two.html` in a local build. Tiger Stancil and Harley Hudson face Xander Timmerman and fictional Micah Yoon. WASD/arrows move the controlled player. J crosses over, K passes, L shoots, I dunks near the rim, and Space drives. On defense K switches and L contests. Touch screens receive a joystick and buttons. The half-court possession changes sides after a shot; first to 11 wins. The camera, sound, restart, and a recent-frame replay are optional controls.

The same `ChibiCourt` renderer, Three.js bundle, half-court hoop and Mambas floor branch are used. The three named players have distinct proportions, faces, hairstyles, uniform numbers and provisional attributes. Their likenesses are procedural interpretations pending visual approval; Xander's existing roster record only says “Xander” with provisional 80 ratings, so the surname and tall/slim treatment apply to this review mode only. Micah is an existing fictional AAU Dynasty player.

## Verification

- `node gameplay/chibi/test.cjs` from `gameplay/`: 300 seeded 5v5 possessions and replay passed.
- `node gameplay/chibi/test-render.cjs` from `gameplay/`: existing adapter and finite limb transforms passed.
- `node gameplay/chibi/test-two-on-two.cjs`: movement, crossover, pass/catch, shot/rim, dunk, defense, possession change, renderer, character silhouette, and hand proximity passed.
- `node scripts/test-chibi-integration.cjs`: 5v5 bridge and generated entry passed.
- `npm run build`: final Vinext build and 205-player artwork gate passed; the generated 2v2 files are present in `dist/client/chibi-v0.6/`.
- Simulation-only benchmark: 6,000 fixed steps, 10 actions, 10 ms on the workspace CPU. This excludes WebGL rendering and is **not** a frame-rate result.
- A local HTTP request returned 200 for the 2v2 page. The review browser could not connect to the workspace loopback server, and its file URL policy blocked the offline route. No interactive browser playtest or device FPS measurement was completed.

## Known defects and next iteration

1. The approved 4:3 full-court concept is overlaid on a single-rim half court. Some printed art lines do not line up with the separately rendered half-court markings. Replace this with a calibrated brand-only half-court texture before declaring court geometry final.
2. Player art is an improved shared procedural joint layout, not approved likeness meshes or a production skeletal asset pipeline. Review Tiger, Harley and Xander silhouettes, then build/export consistent skinned models and animations.
3. The opponent AI offers basic drive/shoot/pass choices and defensive spacing. Passing lanes, offensive rebounds, foul rules, full-court transition and a complete season contract remain unfinished.
4. Hand proximity is checked numerically in the renderer; pass release, gather, rim grip, foot planting, touch input and camera framing need on-device visual playtesting. WebGL and phone performance are unknown.

The next iteration should run this review build on Leon's Mac and iPhone, record screen captures and frame rate, then tune ball release, shot timing and the floor texture from observed gameplay. Do not attach 2v2 outcomes to dynasty saves until a separate validated result contract exists.
