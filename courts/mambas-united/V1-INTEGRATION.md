# Mambas United Court V1 — integration contract

Status: approved **visual concept**; not yet an installed game texture or geometry update.

## Approved reference
User supplied `AAU_Dynasty_Mambas_Court_V1(1).zip` containing:
- `mambas_united_floor_v1_concept.png` (1448 × 1086 RGB; 4:3)
- `README.md` (visual-master and integration requirements)

Keep the artwork unchanged. Black glossy hardwood, red scale-patterned painted areas, silver cobra crest, white lines, red border and "TRUST THE PROCESS" are approved V1 visual direction.

**Important:** The ZIP is a visual reference only, not a calibrated UV texture. Its arcs, lane, center circle and line placement are illustrative and MUST NOT become scoring, physics, out-of-bounds or collision geometry. A 4:3 image stretched over a 94:50 floor would distort it.

## Existing game, inspected November 2, 2026
- Source of truth: `gameplay/chibi/renderer.js`.
- Generated browser output: `public/chibi-v0.6/index.html`; rebuild via `scripts/build-chibi.cjs`, never edit generated HTML directly.
- The current ten-player **5v5** game is a **half-court 12-possession preview**, not a full regulation-court game. Renderer uses a rectangular playable area at x=0..19.5 and z=0..13 (world units), with a single rim at x=18.2, z=6.8.
- The renderer currently draws hardwood planks, lane, arcs, bounds and hoop independently. A full-court graphic cannot be pasted into that scene unchanged.
- Do not modify scoring, player coordinates, court physics, ball, player animations, pack opening, saves or rewards in the visual-art phase.

## Implementation sequence
1. **Preserve source:** Add the original PNG unchanged under `public/courts/mambas-united/v1/concept.png` when binary-asset upload is available. Verify checksum and dimensions against original ZIP. The asset is intentionally not included in this commit.
2. **Design a half-court adaptation:** Create a separate, correctly UV-mapped *brand-only* texture for the existing half-court world bounds. Crop/re-compose artwork instead of stretching. Treat the full-court composition as a guide to placement, not as a direct material.
3. **Geometry-first lines:** Keep rules markings separate from the brand texture. Validate intended youth-court or regulation rules dimensions before replacing existing provisional renderer arcs and lane; use a single measured coordinate map and tests.
4. **Visual toggle:** Implement optional Mambas floor selection in editable renderer, fallback to current floor on missing/failed texture. Keep main gameplay and the chosen ten-player path unchanged.
5. **QA:** Validate mesh orientation, hoop/rim center, feet on playing surface, ball rebounds, arc/paint visibility, camera views and lighting; test on desktop and phone. Run `node gameplay/chibi/test.cjs`, `node gameplay/chibi/test-render.cjs`, `node scripts/test-chibi-integration.cjs`, `npm run build`, and `git diff --check` in canonical checkout; report actual results rather than assume they pass.

## Safety & release boundary
This branch is `art/mambas-court-v1`. No changes to `main`, Site deployment, D1 binding, production accounts or gameplay persistence. The Peach Jam hosted Site is a separate reference and not a deployment target.

## Acceptance criteria for a later playable court
- Actual original asset committed and reproducibly adapted; aspect ratio not warped.
- Court marks calibrated and separately testable.
- Ten 3D Chibi players and current ball-hand behavior still work.
- Before/after screenshots from built local game and evidence of tests.
- User review prior to merge or deployment.
