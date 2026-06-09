# Scripted Baseline Check

status: completed

## Context

The repository had npm scripts and a root `make check` wrapper, but it did not
have a scriptable baseline guard for required files, npm script contracts,
completed plan metadata, README verification text, or local secret/editor
metadata hygiene.

## Objectives

- Keep `make check` as the root verification command.
- Add a shell baseline check that does not require extra runtime dependencies.
- Verify completed maintenance plans and README verification notes.
- Keep local secrets and editor metadata out of the repository.

## Work Completed

- Added `scripts/check-baseline.sh`.
- Wired the script into `make check` after lint, test, and build.
- Added `.env`, local editor metadata, and IntelliJ module files to
  `.gitignore`.
- Updated README, VISION, and CHANGES notes.

## Verification

- `sh scripts/check-baseline.sh`
- `npm test`
- `make check`
- `git diff --check`

## Follow-Up Candidates

- Add package or deployment archive checks if this sample gains a Lambda
  packaging workflow.
