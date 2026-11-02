# AAU Dynasty — canonical source and shared workflow

Updated November 1, 2026.

## Canonical source

The canonical engineering source is this checkout:

`/Users/leonstancil/Documents/AAU-Dynasty`

It contains the recovered Circuit Originals source, the current dynasty systems, and the selected ten-player 3D Chibi v0.6 gameplay path. The Peach Jam 4v4 presentation pass is preserved in repository history and the consolidation records; it is not a separate product or source tree.

The existing ChatGPT Sites identity remains unchanged:

- Site ID: `appgprj_6ad4527a2ba48191b67d643ded486955`
- Binding: `DB`
- Separate Peach Jam Site: reference only; do not merge or deploy to it

## Source precedence

When versions disagree, use this order:

1. The working repository and its Git history.
2. `GAMEPLAY-SOURCE.md`, `AGENTS.md`, and the verification records in this repository.
3. Dated recovery archives under `outputs/`.
4. Google Drive creative assets and documentation.
5. Older GitHub placeholders, exported HTML, cloud snapshots, and screenshots.

Drive is the shared library for art references, source archives, design notes, and verification evidence. It is not a second code repository and must not silently replace the working source.

## Future-session workflow

1. Start in `/Users/leonstancil/Documents/AAU-Dynasty` and read `AGENTS.md`, the HQ `PROJECT-BRIEF.md` and `STATUS.md`, then `GAMEPLAY-SOURCE.md` for gameplay work.
2. Check `git status` before editing. Preserve unrelated changes, saves, collections, rewards, roster identities, and the existing Site manifest.
3. Inspect Drive for the relevant creative or documentation reference; record the Drive link in the repository note or verification record when it affects a decision.
4. Make and verify local changes first. Keep generated Chibi output generated from `gameplay/chibi/` and `scripts/build-chibi.cjs`.
5. Run the narrow tests, then the local build and `git diff --check`. Distinguish isolated tests, local browser checks, and deployed behavior.
6. Update the HQ status with exact files, checks, limitations, and next action.
7. Push or publish only after the task explicitly authorizes that release scope and the canonical GitHub repository has confirmed write access.

## GitHub consolidation status

Repository inspection and push verification on November 1, 2026 found:

- `Smackgod/AAU-DYNASTY`: private placeholder; its README says the playable source has not been migrated. Do not use it as the canonical source without an explicit migration decision.
- `boneyardent-dev/AAU-dynasty-`: the owner-controlled canonical GitHub repository. Its `main` branch now contains commit `f09ea96`.
- This checkout has the `origin` remote configured as `https://github.com/boneyardent-dev/AAU-dynasty-.git` and tracks `origin/main`.

Therefore the canonical source is consolidated locally and on GitHub. Future pushes still require task-specific authorization; do not push unrelated archives, screenshots, duplicate exports, or cloud-chat references by assumption.

## Preservation boundary

The selected local gameplay remains Lobby → PLAY 5 × 5 using the ten-player Chibi v0.6 path. The 12-possession court preview is not a full season engine. The optional 3-on-3 path remains exhibition-only. The prior 4v4 presentation pass remains preserved as history/reference and must not be deleted while the canonical repository is being established.
