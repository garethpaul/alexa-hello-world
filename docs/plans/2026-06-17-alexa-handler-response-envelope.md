# Alexa Handler Response Envelope Validation

Status: Completed

## Problem

The async dispatcher validates incoming Alexa envelopes and verifies that
request and event handlers are callable, but it returns a Launch or Intent
handler's resolved value without checking the top-level Alexa response shape.
A handler that resolves `undefined`, `null`, a primitive, an array, or an
unversioned object therefore produces a successful Lambda invocation with an
invalid Alexa payload. `SessionEndedRequest` intentionally completes without
a response and must remain exempt.

## Priorities

1. P0: Reject invalid Launch and Intent handler results before returning them
   from the Lambda boundary.
2. P1: Preserve asynchronous handlers, response helpers, SessionEndedRequest,
   generic failure logging, and original error stacks.
3. P1: Add focused runtime and mutation-sensitive baseline evidence.

## Requirements

1. A LaunchRequest or IntentRequest result must be a non-null, non-array object
   with its own `version` property equal to `1.0` and its own non-null,
   non-array `response` object.
2. Validation must run after awaiting the selected request handler so both
   synchronous and asynchronous invalid results fail identically.
3. Invalid values must raise one stable generic error that does not reflect
   caller-controlled payload content into logs or failures.
4. `SessionEndedRequest` must continue to resolve successfully with no speech
   response.
5. Existing helper-built tell, ask, card, SSML, session-attribute, application
   identity, lifecycle, request, intent, locale, timestamp, and handler
   ownership behavior must remain unchanged.
6. The validator must not require nested `outputSpeech`, card, reprompt, or
   directive fields; those remain governed by existing helper contracts or
   future response-type-specific work.
7. Tests, baseline checker, maintained guidance, changelog, and this plan must
   preserve completed implementation and truthful verification evidence.

## Implementation Units

### U1: Validate Dispatch Results

**File:** `src/AlexaSkill.js`

Add a narrow top-level response-envelope predicate and validation function.
Await the selected request handler once, exempt `SessionEndedRequest`, validate
all other supported results, and return the original object unchanged.

### U2: Add Runtime Regressions

**File:** `test/handler.test.js`

Cover synchronous and asynchronous invalid values, inherited envelope fields,
valid future nested response fields, and the unchanged SessionEndedRequest
no-response lifecycle.

### U3: Preserve Durable Contracts

**Files:** `scripts/check-baseline.sh`, `README.md`, `SECURITY.md`, `VISION.md`,
`CHANGES.md`, and this plan.

Require the validator, await-before-validation ordering, stable error, focused
tests, maintained guidance, completed plan status, and actual verification
evidence. Reject isolated mutations that bypass validation, accept inherited
or malformed envelope fields, validate before awaiting, weaken the tests or
guidance, or falsify completion.

## Test Scenarios

- A valid helper-built Launch response remains unchanged.
- A valid helper-built Intent response remains unchanged.
- Synchronous and asynchronous `undefined`, `null`, primitive, array,
  unversioned, wrong-version, missing-response, and non-object-response values
  fail with the stable generic error.
- Inherited `version` or `response` properties are rejected.
- A versioned envelope with an owned response object and future nested fields
  is accepted unchanged.
- SessionEndedRequest still completes with `undefined`.
- Repository and external-directory gates remain green.

## Scope Boundaries

- Do not validate or remove unknown nested Alexa response fields.
- Do not add outputSpeech or directive requirements at this boundary.
- Do not change request validation, dispatch ownership, skill identity,
  response helpers, logging content, or Lambda configuration.
- Do not modernize the framework architecture or dependencies in this change.
- Live Alexa requests, skill configuration, and Lambda deployment remain
  outside local validation.

## Verification

- Add focused runtime tests before implementation and observe the intended
  failures.
- Run focused tests, the complete Node test suite, lint, formatting, build,
  baseline contracts, repository and external-directory `make check` with
  explicit timeouts.
- Reject isolated hostile mutations covering validator use, awaited ordering,
  owned version/response fields, shape checks, stable errors, tests, guidance,
  and plan completion.
- Audit generated artifacts, exact paths, dependency/workflow drift, secrets,
  conflict markers, file modes, large files, and whitespace before commit.

## Completed Verification

- The pre-fix focused run reproduced 22 malformed synchronous Launch and
  asynchronous Intent results that incorrectly completed successfully.
- Focused response-envelope coverage passed for invalid shapes, inherited
  fields, future nested fields, and the unchanged SessionEnded lifecycle.
- All 123 Node tests, ESLint, Prettier, source syntax checks, and shell syntax
  checks passed.
- Repository-root and external-directory `make check` passed the complete
  maintained gate.
- Eleven isolated hostile mutations were rejected across validator invocation,
  awaited ordering, the SessionEnded exemption, owned fields, version and shape
  checks, stable errors, tests, guidance, and completed-plan evidence.
- No live Lambda or Alexa invocation was performed.

## Follow-Up

`docs/plans/2026-06-25-alexa-session-ended-response-contract.md` tightens the
SessionEnded exemption so only `undefined` completion is accepted; arbitrary
payloads no longer bypass Lambda result validation.
