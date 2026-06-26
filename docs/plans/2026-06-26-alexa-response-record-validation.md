# Alexa Response Record Validation

## Status: Completed

## Problem

The response-envelope validator accepted any non-array object at both the
envelope and nested `response` levels. A handler could therefore return a
`Date` or `RegExp` that passed validation but serialized as a string or empty
object instead of a usable Alexa response.

## Scope

- Require both values to be JSON-record objects with `Object.prototype` or a
  null prototype.
- Preserve owned version/response fields, future nested fields, async handlers,
  SessionEnded no-payload behavior, and the stable generic failure message.
- Do not prescribe current Alexa response members beyond the existing boundary.

## Work Completed

- Added six red-first synchronous/asynchronous exotic-object regressions.
- Added a shared JSON-record predicate and used it for both response levels.
- Proved null-prototype future nested fields remain accepted unchanged.

## Verification Completed

- The focused tests failed before implementation and passed afterward.
- Full `make check` passed with all Node tests, lint, formatting, syntax, and
  baseline contracts.
- Isolated source, test, and documentation hostile mutations were rejected.

## Boundary

This change does not remove future fields, deeply validate directives, alter
speech/card construction, add dependencies, or make external Alexa requests.
