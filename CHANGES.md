# Changes

## 2026-06-13

- Replaced exception-derived top-level Alexa logs with a stable generic failure
  message while preserving the original `Error` for Lambda failure handling.
- Added regression and portable baseline coverage for handler-provided error
  messages and newline-forged log content.
- Required a non-empty `ALEXA_SKILL_ID` when AWS Lambda runtime markers are
  present while preserving optional configuration for local examples.
- Added module-load, helper, guidance, and portable fail-closed contracts for
  deployed skill-ID authorization.
- Required direct SSML output and reprompts to use a trimmed `<speak>` root
  before Alexa response construction.
- Added focused malformed-SSML regressions and mutation-sensitive contracts.

## 2026-06-12

- Validated primary and reprompt speech before constructing Alexa responses.
- Preserved string, `PlainText`, and `SSML` output forms while rejecting
  missing, blank, non-string, and unsupported values with explicit `Error`
  objects.
- Added response-helper regression coverage and baseline contracts.

## 2026-06-10

1. Stopped reflecting unsupported Alexa request types and intent names into
   Lambda failure values and logs.
2. Added adversarial coverage for newline-bearing dispatch names.
3. Made repository checks location-independent and pinned hosted checks to
   Ubuntu 24.04 with superseded-run cancellation.
4. Added a pinned, least-privilege GitHub Actions workflow that installs the
   locked dependency graph and runs the complete shared `make check` gate on
   Node 20, 22, and 24.
5. Extended the baseline script to enforce CI action pins, permissions,
   timeout, Node version, npm cache, install command, and verification command.
6. Documented Node.js 20.19+, reproducible `npm ci` setup, and hosted CI parity.
7. Updated Prettier from 3.8.3 to 3.8.4 and refreshed the lockfile.
8. Replaced primitive string throws with stack-bearing `Error` objects while
   preserving stable, non-reflective Lambda failure messages.

## 2026-06-09

1. Required Alexa `session.application.applicationId` values to be non-empty
   strings before optional skill-id validation or request dispatch.
1. Added handler coverage for malformed non-string application IDs.
1. Added `scripts/check-baseline.sh` and wired it into `make check` so required
   files, npm script contracts, completed plans, and local metadata hygiene are
   checked before pushing.
1. Required Alexa `request.type` and `intent.name` dispatch keys to be
   non-empty strings before handler lookup, blocking object-to-string coercion
   into valid handler names.
1. Restricted request-type dispatch to explicitly declared handler properties
   so inherited object property names fail as unsupported request types.
1. Restricted intent dispatch to explicitly declared handler properties so
   inherited object property names fail as unsupported intents.
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
