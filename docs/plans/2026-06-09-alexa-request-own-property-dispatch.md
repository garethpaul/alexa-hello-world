# Alexa Request Own-Property Dispatch

## Status: Completed

## Context

Intent dispatch already restricts handler lookup to explicitly declared
properties, but request-type dispatch still indexed `requestHandlers` directly.
Inherited object property names such as `constructor` could be treated as
handlers instead of failing as unsupported Alexa request types.

## Objectives

- Preserve launch, intent, and session-ended request behavior.
- Restrict request-type dispatch to own properties of `requestHandlers`.
- Keep inherited request-type names on the unsupported-request failure path.
- Add local regression coverage.

## Work Completed

- Wrapped request handler lookup in `Object.prototype.hasOwnProperty.call`.
- Added a Node test for inherited request type names.
- Updated README, VISION, and CHANGES.

## Verification

- `npm test`
- `make check`
- `git diff --check`

## Follow-Up Candidates

- Replace string throws with `Error` objects while preserving public failure
  messages.
- Keep unsupported-request logs free of raw request/session identifiers.
