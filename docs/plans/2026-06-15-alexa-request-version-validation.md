---
title: Alexa Request Version Validation
type: security
status: planned
date: 2026-06-15
---

# Alexa Request Version Validation

## Problem

The Alexa request handler validates session identity, lifecycle fields, request
ownership, IDs, timestamps, and intent ownership, but it never validates the
top-level request protocol version. Events with a missing, inherited,
non-string, or unsupported `version` currently reach normal dispatch.

Amazon's Request and Response JSON Reference states that all Alexa requests
include a top-level string `version` whose defined value is `"1.0"`:
<https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html>.

## Priorities

1. Reject malformed or unsupported request protocol versions before dispatch.
2. Preserve valid `"1.0"` events, unknown additional properties, and all
   existing request, session, intent, response, and logging behavior.
3. Keep broader Alexa SDK migration and non-session request types outside this
   focused legacy sample boundary.

## Requirements

1. Require the event to own a top-level `version` property.
2. Require `version` to be a string with the exact supported value `"1.0"`.
3. Reject missing, inherited, non-string, blank, and unsupported versions with
   stable validation errors before application identity or request dispatch.
4. Add regressions for valid, missing, inherited, type-invalid, and unsupported
   values while preserving unknown additional top-level fields.
5. Add mutation-sensitive source, test, maintained-guidance, and completed-plan
   contracts.

## Scope Boundaries

- Do not change supported request or intent types, skill ID behavior, timestamp
  tolerance, session attributes, response text, dependencies, Node versions,
  Lambda configuration, or IAM.
- Do not reject unknown additional request properties; Amazon documents that
  future protocol revisions may add fields compatibly.
- Do not deploy Lambda or claim a live Alexa invocation.

## Implementation Units

### U1: Validate the request protocol version

**File:** `src/AlexaSkill.js`

Add the version boundary at the start of `validateEvent`, before session or
request field reads. Use the existing own-property helper and stable,
field-specific error messages.

### U2: Cover malformed and compatible envelopes

**File:** `test/handler.test.js`

Add `version: "1.0"` to the canonical fixture. Cover missing and inherited
versions separately from non-string, blank, and unsupported own values. Prove
an unknown extra top-level property remains accepted.

### U3: Keep contracts and guidance synchronized

**Files:** `scripts/check-baseline.sh`, `README.md`, `SECURITY.md`, `VISION.md`,
`CHANGES.md`, `AGENTS.md`, and this plan.

Require validation ordering, stable failures, regression identities, tolerant
unknown-field behavior, maintained guidance, completed status, and verification
evidence.

## Verification

- Run the focused version-validation tests and the complete Node suite.
- Run ESLint, Prettier, syntax build, `npm audit --omit=dev`, and repository and
  external-directory `make check`.
- Reject isolated ownership, value, ordering, fixture, compatibility,
  documentation, and plan-completion mutations.
- Audit exact intended paths, generated artifacts, conflict markers,
  dependency/workflow drift, whitespace, and credential-shaped additions.

## Risks

- Synthetic callers that omitted `version` will now fail before dispatch; real
  Alexa request envelopes already provide `"1.0"`.
- A future protocol value requires an explicit reviewed compatibility update
  rather than silent dispatch under unknown semantics.
