# Changes

## 2026-06-09

1. Reset malformed Alexa `session.attributes` values to an empty object before
   building responses so invalid input cannot leak into `sessionAttributes`.
1. Removed raw Alexa request IDs, session IDs, and application IDs from routine
   handler logs while keeping lifecycle and validation diagnostics covered by
   local tests.
1. Normalized optional `ALEXA_SKILL_ID` configuration so real values are
   trimmed and blank values are treated as unset instead of rejecting every
   request.

## 2026-06-08

1. Added explicit lint, format-check, test, and build scripts so local
   verification has the full quality gate required before changes are pushed.
2. Added pinned, supported development dependencies for ESLint and Prettier
   while keeping the Lambda runtime dependency-free.
3. Added CircleCI to run install, lint, format check, tests, and syntax build on
   every pushed commit.
4. Preserved the existing Alexa request behavior and handler tests.
5. Added an explicit unsupported request-type contract so dispatcher failures
   are clear.
6. Added built-in cancel and stop intent handling so users can exit the sample
   cleanly.
7. Added `make check` as the root wrapper for lint, format, tests, and syntax
   checks.
8. Added stable validation messages for malformed Alexa event envelopes and
   intent requests.
9. Added local coverage for the `SessionEndedRequest` lifecycle path.
