# Mac dependency setup verification

Verified October 22, 2026, locally in `/Users/leonstancil/Documents/AAU-Dynasty`.

The existing working-tree repair was retained: `package.json` invokes `scripts/install-dependencies.mjs`, whose portable branch uses Corepack with pinned pnpm 11.25.0 and a frozen lockfile. `pnpm-workspace.yaml` explicitly includes the root package. The managed Linux installer and dependency build-script allowlist remain unchanged. No additional implementation change was necessary on this verification run.

## Results

- Node v24.10.0; Corepack 0.34.0.
- `npm run install:ci`: exit 0, pnpm 11.25.0, dependencies already up to date; lockfile supply-chain policies passed.
- `npm run build`: exit 0; artwork gate covered 212 fictional player identities; all five build stages completed and eight routes were listed.
- Artifacts: `dist/server/index.js`, `dist/server/wrangler.json`, `dist/client/`.
- Existing isolated checks passed: `verify-draft.cjs` (60 randomized drafts), `test-card-frame.cjs`, `test-pack-premium.cjs`, `test-account.cjs`, `verify-lineup-form.cjs`.
- `git diff --check` passed. Lockfile, hosting manifest, data and public assets match Git HEAD. Existing game.html and player API modifications were preserved; their SHA-256 values were identical before and after verification.
- Lockfile SHA-256: `095ba6f301ba3997da2c251dfc4b805c220624bdf0921d905eaceee0d1fb29c9`.

No database commands, account writes, pack openings, migrations, pushes, publishing or deployment were performed. Existing local database state was left in place. Browser gameplay, clean-cache installation and the managed Linux branch were not re-tested. Mock tests and a successful build do not establish deployed save behavior.

To repeat: from the repository root run `npm run install:ci`, then `npm run build`. Do not overlap dependency installers. Next work may separately verify browser gameplay using only local test data.
