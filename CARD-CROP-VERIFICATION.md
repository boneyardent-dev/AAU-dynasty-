# Pack portrait framing — October 22, 2026

User reported Mateo Reyes’s head was cropped in the local pack reveal.

Changed `public/pack-premium.css`: `.pr-silver-card .player-photo` now uses `object-position:center top` instead of `center 23%`. Keep `object-fit:cover` and existing dimensions. This preserves the top of the portrait in compact pack cards, reveal dialogs, and summary cards without changing art files, player identity, ownership, pack draws, quantities or favorites.

Before: browser reported 1024×1536 artwork inside a 270×210 reveal image, using cover at 50% 23%. Visual inspection of the original artwork confirmed the complete head exists near the top; the CSS crop removed it.

Checks: existing `node scripts/test-pack-premium.cjs` passed; `git diff --check` passed. Build log: `.sites-runtime/card-crop-build.log`. Local browser verification and screenshot recorded below after rebuild.

Scope: local only; no new packs opened, rewards claimed, migrations, pushes or deployment. Existing last-batch reveal and collection remain preserved. Change is a reversible CSS correction; no new implementation-mirroring test added.

Build completed successfully. Restarted the local built Worker after its asset manifest became stale during the rebuild. Browser confirmed Mateo’s compact card now computes `object-position:50% 0%` rather than `50% 23%`. Existing last pack remains intact. Revealed the already-awarded second card (Darius Vale) to inspect the same full-size reveal component; no new pack drawn or rewards changed.
