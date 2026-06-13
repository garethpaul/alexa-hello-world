# Alexa Request ID Validation

Status: Completed

## Summary

Require every Alexa request to carry its own non-empty string `requestId`
before dispatch, without reflecting caller-controlled identifiers into errors
or logs.

## Problem Frame

`validateEvent` currently requires request type and timestamp but does not
validate `request.requestId`. An otherwise valid malformed event can therefore
reach launch, intent, or session-ended dispatch without the protocol identifier
used to correlate Alexa requests.

## Requirements

- Reject requests that omit their own `requestId` property.
- Reject blank, non-string, inherited, object, and array request IDs.
- Validate request ID shape before timestamp freshness and application ID
  authorization.
- Keep failures generic and free of caller-controlled request ID values.
- Preserve request type, timestamp, skill ID, session, intent, response, and
  callback behavior for valid events.
- Add mutation-sensitive tests, static contracts, docs, and completed evidence.

## Scope Boundaries

- Do not claim replay prevention or persist request IDs.
- Do not change Alexa response payloads, intents, timestamps, or Lambda setup.
- Do not migrate the legacy callback-style implementation.

## Work Completed

- Required `request.requestId` to be an own property before timestamp
  validation or configured skill-ID authorization.
- Rejected missing, blank, non-string, inherited, object, and array request
  IDs with stable errors that do not contain caller input.
- Added focused regressions, ordering and non-reflection coverage, portable
  static contracts, and README, security, vision, and changelog guidance.

## Verification

- `npm test` passed all 57 tests.
- `npm run lint`, `npm run format:check`, and `npm run build` passed with the
  lockfile-installed dependency graph.
- `make check` passed from the repository and through `make -C` from an
  external working directory.
- Seven hostile mutations were killed: missing own-property validation,
  inherited acceptance, blank acceptance, ordering drift, reflected input,
  README contract removal, and plan-status rollback.

## Verification Commands

- `make lint`
- `make test`
- `make build`
- `make check`
- External-working-directory `make check`
- Hostile mutations for missing own-property validation, blank acceptance,
  inherited acceptance, ordering drift, reflected input, docs, and plan status
- Exact diff, generated-artifact, secret-pattern, conflict, and whitespace audit
