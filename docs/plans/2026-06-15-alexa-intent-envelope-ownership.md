---
title: Alexa Intent Envelope Ownership
type: security
status: planned
date: 2026-06-15
---

# Alexa Intent Envelope Ownership

## Problem

Intent dispatch requires `intent.name` to be an own non-empty string, but it
reads `intentRequest.intent` without first requiring the `IntentRequest` object
to own that envelope. A crafted request can inherit a complete intent object
from its prototype and reach a registered intent handler.

## Priorities

1. P0: Reject inherited intent envelopes before reading or dispatching them.
2. P1: Preserve valid owned intent objects and all existing intent behavior.
3. P2: Keep broader Alexa schema modernization outside this focused ownership
   boundary.

## Requirements

1. Require an `IntentRequest` to own its `intent` property before reading
   `intent.name`.
2. Reject missing, inherited, null, and malformed intent envelopes through the
   existing stable `Invalid intent request: missing intent.name` failure.
3. Preserve declared Hello, Help, Cancel, Stop, unsupported-intent, request
   validation, session ownership, lifecycle, speech, and response behavior.
4. Add a regression whose request prototype supplies a complete valid intent
   and prove no intent handler is invoked.
5. Add mutation-sensitive source, test, maintained-guidance, and completed-plan
   contracts.

## Implementation Units

### U1: Intent Envelope Guard

**File:** `src/AlexaSkill.js`

Extend the existing missing-intent condition with an own-property check before
any read of `intentRequest.intent.name`.

### U2: Inherited Envelope Regression

**File:** `test/handler.test.js`

Build an `IntentRequest` whose prototype owns a valid `HelloWorldIntent` and
whose own fields retain the required request ID, timestamp, and type. Assert the
stable missing-intent failure and no successful response.

### U3: Contracts And Guidance

**Files:** `scripts/check-baseline.sh`, `README.md`, `SECURITY.md`, `VISION.md`,
`CHANGES.md`, and this plan.

Require the guard, inherited fixture, stable failure, maintained ownership
guidance, completed status, and verification evidence.

## Verification

- Run the inherited-envelope regression and complete Node test suite.
- Run ESLint, Prettier, syntax build, `npm audit --omit=dev`, and repository and
  external-directory `make check`.
- Reject isolated ownership, condition, fixture, failure, documentation, and
  plan-completion mutations.
- Audit the exact intended paths, generated artifacts, conflict markers,
  dependency/workflow drift, whitespace, and credential-shaped additions.

## Scope Boundaries

- Do not change supported intents, request schemas, session behavior, response
  text, dependencies, Node versions, Lambda configuration, or IAM.
- Do not deploy Lambda or claim a live Alexa invocation.
- Keep this pull request stacked on PR #15 and preserve base-first ordering.
