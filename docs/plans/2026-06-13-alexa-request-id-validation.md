# Alexa Request ID Validation

Status: Planned

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

## Planned Verification

- `make lint`
- `make test`
- `make build`
- `make check`
- External-working-directory `make check`
- Hostile mutations for missing own-property validation, blank acceptance,
  inherited acceptance, ordering drift, reflected input, docs, and plan status
- Exact diff, generated-artifact, secret-pattern, conflict, and whitespace audit
