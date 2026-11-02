# Card rarity presentation — October 29, 2026

Local implementation, not published. Extends the existing six rarity values and preserves owned card keys, quantities, favorites, attributes, pack rewards and all draw odds.

## Findings and behavior

Drafting and packs share player identities by design: the draft signs a player, while packs collect player-plus-rarity editions. No player exclusions were added; Leon explicitly selected keeping roster players collectible, with rare editions clearly special. No change to existing saves or draws was needed for the presentation request.

The signed-in vault normally draws from the combined base/catalog roster; Concrete Royalty has its own six-player pool and five distinct draws. The offline premium draw normally uses Circuit Originals. That existing pool difference was identified but not reconciled here. This inspection does not establish the cause of any specific live sequence of repeated pulls; no live packs were opened.

Pack reveal/summary previously used a separate generic silver layout. They now render the same rarity-aware card front as the collection. Rarity is a collectible tier, independent of overall rating; no artificial rating boosts or new player identities were introduced.

## Six tiers

| Tier | Rarity | Finish | Per-card odds |
| --- | --- | --- | --- |
| 1 | Common | Matte silver; no holographic overlay | 55% |
| 2 | Uncommon | Emerald stripes | 25% |
| 3 | Rare | Blue chrome | 12% |
| 4 | Epic | Purple prism | 6% |
| 5 | Legendary | Etched gold, crown and ELITE stamp | 1.7% |
| 6 | Mythic | Cosmic rainbow, stars, crown and ELITE stamp | 0.3% |

Each front shows a prominent rarity name, symbol, numbered tier, finish and edition name. The back identifies the same rarity. Color is not the only identifier. Reduced-motion settings stop foil animation. Existing art is preserved; Concrete Royalty artwork no longer overrides the tier finish.

The Pack Room now links to a six-tier guide explaining odds, draft/collection differences and duplicates. Pack copy says NEW CARD EDITION rather than NEW PLAYER. Reveals identify a player already on the roster. Elite designation is visual/collectible, not a new gameplay advantage or guaranteed pull.

## Source and verification

- Source: `public/card-frame.js`, `card-frame.css`, `public/pack-premium.js`, `pack-premium.css`.
- Updated `scripts/test-card-frame.cjs` and `scripts/test-pack-premium.cjs`.
- Passed card frame tests including explicit tier numbers, elite-only marks, unchanged OVR and noninteractive fronts inside reveal buttons; premium pack tests including five rewards, rarity rolls, duplicates, favorites, account snapshots and reduced motion; vault client, SQLite vault core and account tests.
- Final local build and whitespace check passed. Logs: `outputs/rarity-2026-10-29/`.
- Isolated browser fixtures generated from real rendering functions verified the six-tier gallery, pack summary and Mythic reveal. At 390×844, summary and reveal document width was 390; cards scroll within the summary; resized reveal kept its confirmation button visible. Temporary viewport reset.
- Screenshot: `outputs/rarity-2026-10-29/six-tiers.png`. Additional mobile screenshots: `pack-mobile.png`, `mythic-mobile.png` (captured before final NEW CARD EDITION wording change).
- These are isolated design fixtures, not raw-template runtime or live/account-backed opening verification. No live/local account endpoints were accessed, no packs opened and no data migration performed. Physical-device performance and subjective design approval remain unverified.

No dependency/lockfile/hosting/catalog changes, push or deployment. Unrelated 3-on-3 and pending release work preserved. Next: Leon reviews the rarity hierarchy. Roster players remain eligible by his explicit choice; the existing server/offline pool difference remains a separate follow-up. A future release needs a fresh candidate; October 28 archives exclude these changes.
