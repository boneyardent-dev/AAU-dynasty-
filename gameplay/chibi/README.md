# AAU Dynasty — 3D Chibi Courtside v0.6

Open `index.html` directly in Chrome or Safari. Everything, including Three.js, is embedded; no server or download is required. Sound starts off: press Sound to enable it.

This extends the v0.5 HTML gameplay lab. The possession engine, seeded outcomes, audio, replay ledger, coaching coverage, play log and 12-possession watch run are preserved. The new renderer consumes the same Match state; it does not award points or rewards.

## New presentation

- Ten procedural 3D chibi models with eyes, faces, hair variations, jersey numbers, team colors, distinct big-player proportions, and jointed arms and legs.
- Dribbling hands track the ball; defensive stances, Euro-step lean, shot gather/follow-through, airborne dunk approach, rim grip and landing.
- Hardwood court, glass backboard, 3D rim/net reactions, crowd seating, lighting and shadows on WebGL browsers.
- Broadcast, courtside and tactical cameras.
- CPU-projected fallback for browsers without WebGL. Same models; simplified shading, no shadows, potentially much slower playback.

## Source

`renderer.js` is the 3D presentation adapter. `software.js` provides the fallback. `base.html` is the recovered v0.5 reference. `build.py` creates the standalone `index.html`. `engine.cjs` and `teams.json` are extracted only for tests.

Run `python3 build.py` from the parent directory with this folder named `chibi`, or adjust the relative paths in build.py. Run `node chibi/test.cjs` and `node chibi/test-render.cjs` from the parent directory.

## Validation and limits

300 seeded possessions across both sides passed completion, finite positions, score/event accounting, and deterministic replay. A complete 12-possession simulation and replay left the live score and totals unchanged. Adapter tests exercised 25 phase/finish combinations, finite limb positions, three cameras and software projection.

Browser checks: fallback rendered the court and characters; live pass/cut updates and camera-button state changes were observed. The browser disables WebGL, so GPU lighting/shadows, WebGL performance, full-match browser playback, mobile devices, and listening QA remain unverified. Automated adapter checks do not establish final animation quality.

Characters are procedural review models, not final or approved player likenesses. Offense retains the v0.5 structured sequence and is not a complete autonomous full-court basketball engine. This is an alternating half-court lab; there are no changes to live saves, rewards, deployment or season integration.

Desktop HQ PROJECT-BRIEF.md and STATUS.md were unavailable in this environment. The attached source snapshot and recovered v0.5 lab provided context. The live Circuit Originals source remains unchanged.

Three.js r160.1 is included under its MIT license; see THREE-LICENSE.txt. New application code is separate from the vendored library.
