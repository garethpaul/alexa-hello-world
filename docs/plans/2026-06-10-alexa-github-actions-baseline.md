# Alexa GitHub Actions Baseline

Status: Completed

## Goal

Enforce the repository's complete deterministic quality gate on pull requests
and pushes to `master`, using reproducible dependency installation and
least-privilege workflow settings.

## Requirements

- Hosted CI installs exactly the dependency graph in `package-lock.json`.
- Hosted CI runs the same `make check` command documented for contributors.
- Actions are pinned to immutable commits, repository permissions are read-only,
  checkout credentials are not persisted, and the job has a bounded timeout.
- The repository baseline script verifies the workflow contract so CI cannot
  silently lose required checks.

## Implementation

- Add `.github/workflows/check.yml` for Node.js 20, 22, and 24 with manual
  dispatch.
- Use `npm ci` followed by `make check`.
- Extend `scripts/check-baseline.sh` with workflow and README assertions.
- Document reproducible setup and CI parity in `README.md`.
- Apply the available patch-level Prettier update and refresh the lockfile.

## Verification

- `npm ci`
- `make check`
- `npm audit --omit=dev`
- `git diff --check`
