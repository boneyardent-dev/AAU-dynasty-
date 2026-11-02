# Circuit Originals release candidate — October 28, 2026

Prepared locally for Leon’s review; not published or pushed. Baseline is the documented version 14 source commit `fef1783af85e3347a71a3a4be0bd81f01637d8c7`. Current hosted version/audience was not re-queried; refresh both before any authorized release.

## Player-facing changes

- Pack-summary favorites persist through the server vault. Finish Opening waits for confirmation and offers retry after failure. Bounded bonus receipts prevent replaying successful responses from awarding the same support twice.
- Trait moments explain recorded personality effects at halftime and after games, with a Personality notebook in Season stats.
- Three-point makes, attempts and percentages appear in box scores, season totals and development profiles. Legacy games remain untracked; the breakdown fits within existing scores.
- Graduation and incoming cohorts remain deferred.

## Verification performed today

All 12 checks passed: vault client, SQLite vault core, three-point shooting, trait moments, player traits, development, coaching, lineup/form, circuit, premium packs, account and 60 randomized draft runs. Commands and exit codes are in `outputs/release-candidate-2026-10-28/checks.json`; individual logs are alongside it.

Premium-pack test initially failed because its artwork assertion depended on the real calendar remaining in Concrete Royalty week. Only the test changed: fixed fixture clock plus explicit checks for all four weekly drops and wraparound. Its full rerun passed; initial failure log retained.

Sites build helper completed successfully, including the 212-player artwork gate. `git diff --check` passed. Dependency inputs, lockfile, hosting identity/DB binding, catalog and migrations match the baseline. No dependency reinstall was needed. Test labels do not establish visual approval.

## Exact local artifacts

Directory: `/Users/leonstancil/Documents/AAU-Dynasty/outputs/release-candidate-2026-10-28/`

- `source-snapshot.tar.gz`: 648 source/test/document files, including the new feature files and test repair. Excludes untracked cloud-reference imports and local runtime/save directories.
- `source-manifest.json`: per-file SHA-256 fingerprints for that snapshot.
- `built-preview.tar.gz`: captured `dist/` from the successful build; local review artifact, not a Sites publication-helper archive.
- `SHA256SUMS`: archive, manifest and check-result fingerprints.
- `build.log`, `checks.json`, individual test logs.

Verified archived built vault/three-point/trait-moment assets byte-for-byte against source. These snapshots preserve the reviewed inputs even if the working checkout changes. Publication must use the supported Sites source helper after authorization and reconcile any intervening changes.

## Evidence boundaries and remaining review

Today’s checks are isolated/mock tests, in-memory SQLite and a local build/package check. No new browser gameplay test was run today. Prior October 25 browser evidence is recorded in `PACK-ACCOUNT-PLAYTEST.md`, `TRAIT-MOMENTS.md` and `THREE-POINT-SHOOTING.md`; it is not a fresh full-season test of this candidate.

Still unverified: full-season interaction/balance, physical-phone audio/performance, true multi-device concurrency, initial pack-opening response-loss recovery, and deployed behavior of these changes. Support inventory still uses account JSON rather than a fully server-authoritative ledger.

No live saves, local coach databases, pack balances, migrations, audience settings, Git commits/pushes or deployments were changed. Next action: Leon reviews this candidate and remaining limitations, then explicitly authorizes publication if desired. Refresh hosting metadata and preserve its audience at that point.
