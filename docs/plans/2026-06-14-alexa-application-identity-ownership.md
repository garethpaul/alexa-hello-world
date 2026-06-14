# Alexa Application Identity Ownership

Status: Completed

## Context

Alexa request IDs, session IDs, lifecycle flags, request types, and intent names
already require own properties before dispatch. The application identity chain
still uses truthiness checks, so inherited `session`, `application`, or
`applicationId` properties can reach skill-ID authorization as if they were
supplied by the request itself.

## Scope

- Require `event.session`, `session.application`, and
  `application.applicationId` to be own properties.
- Preserve the existing missing-field and non-empty-string errors.
- Keep request ID and timestamp validation ahead of configured skill-ID
  comparison.
- Add focused tests for every inherited identity-container boundary and prove
  caller values are not reflected into logs or failures.
- Add mutation-sensitive baseline and maintenance documentation contracts.

## Implementation Units

### 1. Enforce identity ownership

Files:

- `src/AlexaSkill.js`

Use the existing `hasOwn` helper across the complete application identity
chain before reading or authorizing the value. Retain the current generic
missing-field error and type validation.

### 2. Characterize prototype-chain inputs

Files:

- `test/handler.test.js`

Cover inherited `session`, inherited `application`, and inherited
`applicationId` inputs. Require the stable missing-field error, generic top-level
log, and no reflection of attacker-controlled identity strings.

### 3. Protect and document the contract

Files:

- `scripts/check-baseline.sh`
- `README.md`
- `SECURITY.md`
- `VISION.md`
- `CHANGES.md`
- `docs/plans/2026-06-14-alexa-application-identity-ownership.md`

Require source ownership checks, focused regressions, validation ordering,
documentation, and completed verification evidence.

## Verification

Completed on 2026-06-14:

- The focused application-identity test pattern passed six matching tests,
  including all three inherited identity-container boundaries.
- `npm ci --ignore-scripts` installed the exact lockfile with zero reported
  vulnerabilities; ESLint 10.4.1, Prettier, all 66 Node tests, and both syntax
  builds passed.
- Full `make check` passed from the repository root and from `/tmp` through the
  absolute Makefile path with a hostile `ROOT=/tmp` override.
- Eight isolated mutations were rejected when they removed any ownership
  guard, moved ownership validation behind request metadata, removed focused
  inherited-input coverage, removed documentation, or reopened this plan.

## Risks

- Crafted non-JSON objects that relied on prototype inheritance will now fail
  before authorization; normal Alexa JSON payloads are unaffected.
- This does not add Alexa signature or certificate validation, which remains a
  platform/integration boundary outside this dependency-free sample.
- Live Alexa and Lambda execution remain outside local credential-free tests.
