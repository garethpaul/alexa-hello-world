---
title: Alexa Session Attributes Ownership
type: security
status: completed
date: 2026-06-15
---

# Alexa Session Attributes Ownership

## Problem Frame

The dispatcher accepts `event.session.attributes` whenever its resolved value
is a non-array object. That lookup also accepts an object inherited through the
session prototype, allowing caller-controlled prototype state to flow into the
generated Alexa `sessionAttributes` response. A bounded local invocation
reproduced the leak with an inherited `{ inherited: "leaks-to-response" }`
object.

## Priorities

1. **P0: Require owned session attributes.** Preserve only an own, non-array
   object-valued `session.attributes` field and normalize inherited or malformed
   values to an empty object.
2. **P1 follow-up: Review response option ownership.** Assess inherited speech
   and card option fields separately with concrete compatibility fixtures.
3. **P2 follow-up: Modernize the Alexa runtime.** Replace the legacy helper
   only with a coordinated SDK, deployment, and integration migration.

This plan implements only P0.

## Requirements

- Require `session.attributes` to be an own property before preserving it.
- Continue preserving valid own object-valued attributes.
- Continue normalizing missing, null, array, primitive, and inherited values to
  an empty object before lifecycle handlers and response construction.
- Preserve request validation order, application authorization, async handler
  completion, dispatch ownership, Lambda context, and response payloads.
- Add a regression that proves inherited attributes do not reach the response.
- Add mutation-sensitive portable contracts for ownership, regression evidence,
  maintained documentation, and completed-plan status.

## Implementation Units

### 1. Enforce the ownership boundary

**Files:** `src/AlexaSkill.js`

Require an own `attributes` property alongside the existing object-shape check
before retaining session state.

### 2. Prove the inherited-input behavior

**Files:** `test/handler.test.js`, `scripts/check-baseline.sh`

Add a test whose session inherits object-valued attributes and assert the
response contains a fresh empty object. Extend the SDK-free baseline checker so
removing the own-property guard or regression cannot silently pass.

### 3. Synchronize maintained guidance

**Files:** `README.md`, `SECURITY.md`, `VISION.md`, `AGENTS.md`, `CHANGES.md`

Document that only owned object-valued session attributes survive response
normalization.

## Verification

- Run the focused Node handler tests and package lint, formatting, and build
  gates.
- Run the baseline checker and `make check` from both the repository root and
  an external directory.
- Run isolated hostile mutations for the ownership guard, regression,
  documentation, and plan completion evidence.
- Run `npm audit --omit=dev` without claiming live Alexa or Lambda behavior.
- Audit exact intended paths, generated artifacts, conflict markers,
  whitespace, dependency drift, and credential-shaped additions.

## Completion Evidence

- Added `hasOwn(event.session, 'attributes')` before the existing object-shape
  check and defined a fresh own data property so inherited data or accessors
  cannot intercept normalization or reach the response.
- Added an inherited-object regression while preserving the malformed-value and
  valid request behavior; all 73 Node handler tests passed.
- The lockfile-installed ESLint 10.4.1 lint gate, Prettier check, syntax build,
  and `npm audit --omit=dev` passed with zero reported vulnerabilities.
- Nine isolated hostile mutations were rejected for missing or inverted source
  ownership, setter-interceptable assignment, missing or weakened regression
  evidence, missing guidance, incomplete plan status, and runtime assignment
  fallback.
- The SDK-free baseline checker and repository-root and external-directory
  `make check` gates passed.
- Exact-path diff, generated-artifact, conflict-marker, whitespace, dependency
  drift, and credential-shaped-addition audits passed.
- No Lambda, IAM, Alexa developer-console, trigger, or live invocation scenario
  was executed.

## Risks And Mitigations

- **Valid attributes regression:** preserve existing own object-valued
  attributes and add a positive assertion alongside the inherited-value case.
- **Prototype mutation in the fixture:** construct the malicious session in the
  test only; do not mutate global prototypes.
- **Stacked delivery:** base the pull request on PR #14 and retain base-first
  ordering.

## Out Of Scope

- Changing response option ownership, Alexa request schemas, intent behavior,
  dependencies, runtime versions, deployment configuration, or IAM.
- Deploying Lambda or exercising a live Alexa skill invocation.
