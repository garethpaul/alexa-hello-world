---
title: Reject Unsupported Alexa Requests Before Lifecycle Hooks
type: security
status: completed
date: 2026-06-15
---

# Reject Unsupported Alexa Requests Before Lifecycle Hooks

## Problem

`AlexaSkill.execute` runs `onSessionStarted` for a new session before resolving
the request handler. An unsupported but otherwise valid request therefore
causes subclass lifecycle side effects before failing with `Unsupported request
type`.

## Requirements

1. Resolve and validate the request handler before `onSessionStarted`.
2. Preserve the generic unsupported-request error and non-reflective logging.
3. Preserve lifecycle and dispatch behavior for every supported request type.
4. Add a regression proving unsupported new-session requests do not run the
   session-start lifecycle hook.
5. Add mutation-sensitive source, test, guidance, and completed-plan contracts.

## Scope Boundaries

- Do not change supported request or intent types, application authorization,
  session attribute normalization, response shapes, dependencies, or Node
  versions.
- Do not deploy Lambda or claim a live Alexa invocation.

## Implementation Units

### U1: Resolve routing before lifecycle work

**File:** `src/AlexaSkill.js`

Move the own-property request-handler lookup and unsupported-type rejection
ahead of `onSessionStarted`, while leaving supported dispatch unchanged.

### U2: Prove lifecycle ordering

**File:** `test/handler.test.js`

Extend unsupported-request coverage to capture logs and assert that the
session-start hook did not run.

### U3: Keep evidence fail closed

**Files:** `scripts/check-baseline.sh`, `README.md`, `SECURITY.md`, `VISION.md`,
`CHANGES.md`, `AGENTS.md`, and this plan.

Require source ordering, focused regression, maintained guidance, completed
status, and actual verification evidence.

## Verification

- Run the focused handler test and the complete Node test suite.
- Run ESLint, Prettier, syntax build, audit, and repository and external
  `make check` gates.
- Reject isolated ordering, regression, guidance, and plan mutations.
- Audit exact paths, generated artifacts, dependency/workflow drift,
  whitespace, conflict markers, and credential-shaped additions.

## Risks

- A subclass that dynamically installs request handlers from
  `onSessionStarted` will now fail earlier; handler tables are expected to be
  configured before execution.
- No live Lambda or Alexa invocation is performed.

## Completion Evidence

- Moved own-property request-handler resolution and unsupported-type rejection
  before `onSessionStarted` while preserving supported dispatch behavior.
- Extended `unsupported request types fail with a clear message` to prove the
  generic failure occurs without a session-start lifecycle log.
- All 81 tests passed.
- Lockfile-installed ESLint 10.4.1, Prettier, syntax build, and
  `npm audit --omit=dev` passed with zero reported vulnerabilities.
- Repository-root `make check` passed all 81 tests, lint, formatting, syntax
  build, and the SDK-free baseline checker.
- Five isolated hostile mutations covering source ordering, the scoped
  regression, guidance, plan status, and verification evidence were rejected.
- External-directory `make check` passed through the absolute Makefile path.
- Exact nine-path, generated-artifact, file-mode, whitespace, conflict-marker,
  dependency/workflow drift, and credential-shaped additions audits passed.
