# Alexa Session ID Validation

Status: Planned

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

Planned:

- Run focused session-ID tests and the full package gate.
- Run `make check` from the repository root and an unrelated working directory.
- Reject focused mutations that remove presence/type checks, ordering, tests,
  security wording, or completed plan status.
- Audit the exact diff, generated artifacts, whitespace, and credential-shaped
  additions before committing.

## Risks

- Older hand-built fixtures without `sessionId` will now fail explicitly and
  must be corrected to match the Alexa envelope contract.
- Session identifiers remain opaque strings; this change does not impose a
  provider-specific prefix or expose their values in logs.
