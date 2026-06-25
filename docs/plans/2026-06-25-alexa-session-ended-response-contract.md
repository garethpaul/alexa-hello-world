# Alexa SessionEnded Response Contract

Status: Completed

## Problem

Launch and Intent results were validated at the Lambda boundary, but
`SessionEndedRequest` bypassed result validation entirely. A custom lifecycle
handler could therefore resolve a string, primitive, object, or Alexa response
envelope and complete the Lambda invocation successfully with a payload even
though SessionEnded is a no-response lifecycle event.

## Decision

Keep the SessionEnded exemption from speech-envelope validation, but make it
narrow: the resolved value must be exactly `undefined`. Any other synchronous
or asynchronous result fails with one stable generic `Error` that does not
reflect payload contents into logs or failure messages.

## Work Completed

- Tightened `validateHandlerResponse` to accept only `undefined` for
  `SessionEndedRequest`.
- Added synchronous primitive, object, response-envelope, and asynchronous
  payload regressions while preserving the normal no-response completion.
- Extended the portable baseline checker, repository guidance, changelog, and
  historical response-envelope plan cross-reference.

## Verification

- The pre-fix focused tests reproduced successful SessionEnded completion with
  six synchronous payload shapes and one asynchronous private payload.
- All 126 Node tests, ESLint, Prettier, source syntax checks, and shell syntax
  checks passed.
- Repository-root and external-directory `make check` passed the complete
  maintained gate.
- Three hostile SessionEnded response mutations were rejected: restoring the
  unconditional exemption, accepting `null`, and removing the stable error.
- Isolated hostile SessionEnded response mutations were rejected without
  changing request validation, normal no-response completion, or log privacy.
- No live Lambda or Alexa invocation was performed.

## Scope Boundaries

- Launch and Intent response-envelope behavior remains unchanged.
- SessionEnded handlers may perform asynchronous cleanup but must resolve
  without a payload.
- No Alexa model, Lambda deployment, skill configuration, or dependency change
  is included.
