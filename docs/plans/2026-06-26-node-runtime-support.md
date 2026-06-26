# Node Runtime Support

Status: Completed

## Context

The repository declared every Node version from 20.19 onward even though its
pinned ESLint toolchain accepts only specific modern release lines. CI used
floating major selectors, so it did not exercise the minimum versions promised
by package metadata. Node 20 reached end-of-life on April 30, 2026 and no longer
receives upstream security fixes.

The official Node.js release schedule lists Node 22 as Maintenance LTS and Node
24 as Active LTS on June 26, 2026. Node's production guidance recommends Active
or Maintenance LTS releases.

## Decision

- Declare `^22.13.0 || ^24.0.0` in `package.json` and the lockfile root package.
- Test `22.13.0` and `24.0.0` as the exact declared floors.
- Test `22.x` and `24.x` to continuously exercise the latest security patches
  available on each supported LTS line.
- Move the retained CircleCI verification job to the exact Node `22.13.0`
  floor instead of leaving it on end-of-life Node 20.
- Do not claim support for end-of-life Node 20 or non-LTS release lines.
- Keep runtime code dependency-free; this changes development and verification
  support only.

## Sources

- Node.js release schedule: <https://github.com/nodejs/Release>
- Node.js previous releases and production guidance:
  <https://nodejs.org/en/about/previous-releases>

## Verification

- `make check` passed with all 126 tests on Node 22.13.0, Node 22.23.1,
  Node 24.0.0, and Node 24.18.0.
- External-directory `make -f /src/Makefile check` passed on Node 22.13.0.
- The `cimg/node:22.13.0` image completed `npm ci` and `make check` from a
  non-root writable checkout.
- Eleven isolated hostile mutations were rejected across package metadata,
  lockfile metadata, GitHub Actions, CircleCI, README guidance, roadmap state,
  and this completion record.
- `git diff --check` passed.

## Residual Risk

Exact floor jobs intentionally run older patch releases to verify semver claims.
Production and developer environments should use the latest security patch on a
supported line. Future LTS lines require an explicit metadata, CI, and tooling
review before support is claimed.
