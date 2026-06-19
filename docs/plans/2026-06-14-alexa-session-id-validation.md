# Alexa Session ID Validation

Status: Completed

## Context

Alexa request validation checks the session application ID and lifecycle flag,
then validates request type, ID, and timestamp. It does not validate the
mandatory `session.sessionId`, allowing malformed session envelopes into
lifecycle and request dispatch.

## Scope

- Require `session.sessionId` to be present and a non-empty string before
  request validation and authorization.
- Preserve timestamp freshness, application authorization, session attributes,
  request dispatch, response generation, and generic logging behavior.
- Add focused runtime and mutation-sensitive baseline contracts for missing,
  blank, non-string, ordering, documentation, and completed plan evidence.
- Document the session identifier boundary without logging identifier values.

## Implementation Units

### 1. Validate session IDs

Files:

- `src/AlexaSkill.js`
- `test/handler.test.js`

Reject absent and invalid session IDs with stable messages before request fields
or configured application authorization are evaluated.

### 2. Protect and document the contract

Files:

- `scripts/check-baseline.sh`
- `README.md`
- `SECURITY.md`
- `VISION.md`
- `docs/plans/2026-06-14-alexa-session-id-validation.md`

Require the source checks, regression names, ordering, documentation, and
completed verification in the baseline checker.

## Verification

Completed on 2026-06-14:

- Focused session-ID tests passed for missing, inherited, malformed, log-safety,
  and validation-order cases.
- The exact lockfile dependencies installed with `npm ci`; ESLint, Prettier, all
  65 Node tests, syntax build, and the moderate dependency audit passed with
  zero known vulnerabilities.
- The first `make check` run passed lint, format, all 65 tests, and syntax build,
  then stopped at the plan-evidence contract until this verification was
  recorded; the complete gate is rerun below.
- Full `make check` passed from the repository root and from `/tmp` through the
  absolute Makefile path with a hostile `ROOT=/tmp` override.
- Six isolated mutations were rejected when they weakened presence or type
  validation, moved validation after lifecycle checks, renamed the regression,
  removed security wording, or changed this plan back to `Status: Planned`.

## Risks

- Older hand-built fixtures without `sessionId` will now fail explicitly and
  must be corrected to match the Alexa envelope contract.
- Session identifiers remain opaque strings; this change does not impose a
  provider-specific prefix or expose their values in logs.
