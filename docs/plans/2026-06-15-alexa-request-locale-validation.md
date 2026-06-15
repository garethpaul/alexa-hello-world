---
title: Alexa Request Locale Validation
type: security
status: completed
date: 2026-06-15
---

# Alexa Request Locale Validation

## Problem

The handler validates the request protocol version, session identity, request
ownership, IDs, timestamps, and intent ownership, but it never validates
`request.locale`. A request with a missing, inherited, blank, or non-string
locale currently reaches lifecycle hooks and normal dispatch.

Amazon's Request and Response JSON Reference states that every request object
includes a string `locale` property:
<https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-and-response-json-reference.html#request-locale>.
The standard request-type reference likewise includes `locale` on
`LaunchRequest`, `IntentRequest`, and `SessionEndedRequest`:
<https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-types-reference.html>.

## Priorities

1. Reject malformed locale fields before lifecycle hooks, authorization, or
   request dispatch.
2. Preserve valid locale strings, unknown additional properties, and all
   existing request, session, response, and logging behavior.
3. Keep locale allowlisting and broader Alexa SDK migration outside this
   focused legacy-sample boundary.

## Requirements

1. Require `request` to own a `locale` property.
2. Require locale to be a non-empty string after trimming for validation.
3. Reject missing, inherited, blank, and non-string locale values with stable,
   non-reflective errors before lifecycle hooks or application authorization.
4. Add canonical fixture locale plus focused malformed-value and ordering
   regressions while preserving unknown additional request properties.
5. Add mutation-sensitive source, test, maintained-guidance, and completed-plan
   contracts.

## Scope Boundaries

- Do not restrict locale values to a fixed allowlist; Amazon can add supported
  locales and the sample does not localize response text dynamically.
- Do not change supported request or intent types, timestamp tolerance, skill
  ID behavior, session attributes, response text, dependencies, Node versions,
  Lambda configuration, or IAM.
- Do not reject unknown additional request properties.
- Do not deploy Lambda or claim a live Alexa invocation.

## Implementation Units

### U1: Validate request locale ownership and shape

**File:** `src/AlexaSkill.js`

Add the locale boundary in `validateEvent` after timestamp validity and before
freshness-dependent dispatch or authorization. Use the existing own-property
and non-empty-string helpers with stable field-specific errors.

### U2: Cover malformed and compatible request envelopes

**File:** `test/handler.test.js`

Add a canonical `en-US` locale to request fixtures. Cover missing, inherited,
blank, and non-string values, prove failures occur before lifecycle and skill
ID authorization, and retain an unknown request-property compatibility case.

### U3: Keep contracts and guidance synchronized

**Files:** `scripts/check-baseline.sh`, `README.md`, `SECURITY.md`, `VISION.md`,
`CHANGES.md`, `AGENTS.md`, and this plan.

Require source ownership, stable failures, validation ordering, fixture and
compatibility coverage, maintained guidance, completed status, and actual
verification evidence.

## Verification

- Run focused locale-validation tests and the complete Node handler suite.
- Run ESLint, Prettier, syntax build, `npm audit --omit=dev`, and repository and
  external-directory `make check`.
- Reject isolated ownership, shape, ordering, fixture, compatibility,
  documentation, and plan-completion mutations.
- Audit exact intended paths, generated artifacts, conflict markers,
  dependency and workflow drift, whitespace, and credential-shaped additions.

## Risks

- Synthetic callers that omit `locale` will fail before dispatch; real Alexa
  request envelopes already provide the property.
- The validation deliberately accepts any non-empty string so new Alexa locale
  codes do not require a framework release.

## Completion Evidence

- Added own-property and non-empty-string validation for `request.locale` after
  timestamp freshness and before lifecycle hooks or application authorization.
- Added canonical `en-US` fixtures plus missing, inherited, blank, non-string,
  future-locale, unknown-property, and validation-order regressions. All 81 tests
  in the handler suite passed.
- The lockfile-installed ESLint 10.4.1 lint gate, Prettier check, syntax build,
  and `npm audit --omit=dev` passed with zero reported vulnerabilities.
- Nine isolated hostile mutations were rejected for weakened ownership, shape,
  ordering, fixture identity, inherited-input, future-locale compatibility,
  maintained guidance, plan status, and verification evidence.
- The SDK-free baseline checker and repository-root and external-directory
  `make check` gates passed.
- Exact-path diff, generated-artifact, conflict-marker, whitespace, dependency
  and workflow drift, and credential-shaped-addition audits passed.
- No live Lambda or Alexa invocation was performed.
