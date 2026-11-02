# Chibi procedural art upgrade

The 3D Chibi renderer now leans into a polished toy-basketball look inspired by the supplied Rockets reference image, while staying code-native and preserving the selected ten-player v0.6 gameplay source.

## What changed

- Rounded, slightly oversized head and face proportions for clearer expressions at the wide broadcast camera.
- Layered jersey trim, shorts, and colored side panels so team identity reads on the court.
- More readable eyes, brows, nose, mouth, cheeks, hands, and feet.
- Slightly smoother, low-metal toy materials for a more finished collectible feel.
- Existing hair variants, jersey numbers, nameplates, limb animation, and CPU fallback remain intact.

## Source and generated output

- Editable renderer: `gameplay/chibi/renderer.js`
- Generated court: `public/chibi-v0.6/index.html`
- Build: `npm run build`

This is a procedural renderer upgrade, not an imported rigged model pack. Adding external GLB/GLTF characters would be a separate asset and licensing decision.

## Verification

- `node gameplay/chibi/test.cjs`
- `node gameplay/chibi/test-render.cjs`
- `node scripts/test-chibi-integration.cjs`
- `git diff --check`
- `npm run build`
- Local browser preview at `http://127.0.0.1:8790/` visually reviewed at the 3D Chibi Courtside screen.
