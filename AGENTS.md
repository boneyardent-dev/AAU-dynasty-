# AAU Dynasty — engineering and mentor instructions

This repository is AAU Dynasty: Circuit Originals, a game project separate from House of Hooperz. Extend the existing game rather than creating a replacement demo.

## Canonical source and chat continuity

- This checkout and the GitHub repository [boneyardent-dev/AAU-dynasty-](https://github.com/boneyardent-dev/AAU-dynasty-) are the same canonical AAU Dynasty source. The `main` branch is the shared continuity point.
- This rule applies whether work begins in the Codex desktop app, an AAU Dynasty project chat, or an app-based workflow. New chats must open this repository and read these instructions before proposing a new game or source tree.
- Start by checking `git status`, the current branch, and the `origin` remote. Use the existing source and history; do not recreate the game from a prompt, screenshot, ZIP archive, cloud snapshot, or older chat when the canonical repository is available.
- Keep archives, screenshots, duplicate exports, and cloud-chat references as references unless a task explicitly promotes a specific item into the canonical source. Push reviewed project changes to `main` only when the task explicitly authorizes the release.

## Start here

- Read `/Users/leonstancil/Documents/Leon-Work-HQ/Games/AAU-Dynasty/PROJECT-BRIEF.md` and `STATUS.md` for current product context and verification evidence. If those files are unavailable in a future environment, report that limitation rather than assume their contents.
- Read `README.md`, `package.json`, `.openai/hosting.json`, and instructions closest to affected code before engineering changes. Keep existing Site identity `appgprj_6ad4527a2ba48191b67d643ded486955` and DB binding. The separate Peach Jam Site is not this deployment target.
- Treat archived exports and generated pages as references; this repository is the selected working source. Do not import HOH branding, Smack, or reel workflow rules into the game.

## Work with Leon

Complete authorized technical work. Explain one transferable concept at meaningful checkpoints in plain language; translate unfamiliar terms and give exact paths/commands when needed. For substantial tasks state the deliverable and observable completion checks. Ask only about gaps that materially affect scope, accuracy, authorization or costly decisions.

## Preserve and verify

- Preserve unrelated changes and existing saves, collection ownership, duplicate quantities, favorites, roster identities and pack rewards unless the task explicitly requires changing them.
- Use established assets. Never infer visual approval from filenames, file presence, metadata or test labels. Separate fictional game ratings from sourced real-world recruiting facts.
- Inspect existing tests and run relevant checks. Differentiate isolated/mock tests, a local build, browser checks and deployed behavior; success in one does not prove the others.
- `game.html` is a server-served template; `app/route.ts` inserts archetype JSON. Opening the raw HTML is not an equivalent runtime.
- Package setup currently has a documented Mac portability blocker. Do not claim dependency installation or build success until verified. Preserve lockfiles and package build-script restrictions when repairing setup.
- Keep credentials and tokens out of tracked files, instruction documents, shell arguments and user-facing output.

## Local work and release scope

Onboarding is local-only: no live data mutations, production migrations, pack openings, Git pushes or deployments. Future tasks must establish their release scope; do not treat a local test as publication authorization. Preserve the existing restricted audience. A request to inspect the live game does not authorize changing its saves.

At milestones update the HQ status with exact artifact locations, checks, limitations and next action. Keep code/engineering documentation in this repository; HQ holds pointers and coordination. Do not duplicate the repository inside HQ.

## Leon handoff links

- After every update, include a clickable, verified link in the chat to the relevant result. Use the local preview for local changes, the GitHub repository or changed file for source changes, and the deployed game only when publication was explicitly authorized and verified. Label the link as local, GitHub, or deployed.
- After every code update, include a clickable local preview link in the chat: `[Try the local preview](http://127.0.0.1:8790/)`.
- When the change affects a specific screen or route, include that route as a second clickable link when available (for example, the Chibi court entry).
- Include clickable links to the main changed source files using absolute repository paths, plus a brief verification summary. Do not claim the link is live or deployed unless publication was explicitly authorized and verified.
- If the local preview server is not running, start it for verification or clearly say that the link requires the user to run the documented local start command.

## Selected gameplay — October 30, 2026

Read `GAMEPLAY-SOURCE.md` before gameplay work. Leon selected the original ten-player 3D Chibi v0.6. The master remains this repository; cloud snapshots are references. Preserve the 5-on-5 entry and imported source. Do not substitute the optional 3-on-3 exhibition or claim the 12-possession preview is already a full season engine.
