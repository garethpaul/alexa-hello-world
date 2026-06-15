---
title: Alexa Event Handler Ownership
type: reliability
status: planned
date: 2026-06-15
---

# Alexa Event Handler Ownership

## Problem Frame

`src/index.js` assigns the sample lifecycle handlers through
`HelloWorld.prototype.eventHandlers.on...`. Because `eventHandlers` is inherited
from `AlexaSkill.prototype`, those assignments mutate the shared base handler
table. Loading the sample can therefore replace lifecycle behavior for other
`AlexaSkill` subclasses in the same Node.js process.

## Requirements

- Give `HelloWorld.prototype` its own event-handler table before registering the
  sample lifecycle handlers.
- Preserve fallback behavior for lifecycle methods that the sample does not
  override.
- Preserve async handler completion, request dispatch, response payloads,
  Lambda context propagation, skill-ID validation, and existing public exports.
- Add a regression test that proves loading `src/index.js` does not mutate the
  base `AlexaSkill.prototype.eventHandlers` table.
- Extend the portable baseline contract so a direct shared-prototype mutation
  cannot silently return.
- Keep contributor, security, vision, and change documentation synchronized
  with the ownership boundary.

## Implementation Units

### 1. Isolate the sample lifecycle handler table

**Files:** `src/index.js`

Create an event-handler table owned by `HelloWorld.prototype` that delegates to
the base table for unmodified lifecycle behavior. Register the sample handlers
only after that ownership boundary exists.

### 2. Prove ownership and preserve behavior

**Files:** `test/handler.test.js`, `scripts/check-baseline.sh`

Add a focused load-time regression that snapshots the base lifecycle handlers,
loads the sample module, and proves the base references remain unchanged while
the sample handlers remain usable. Add a source contract that requires the
owned table to be established before handler registration and rejects direct
registration against the inherited table.

### 3. Document the reliability boundary

**Files:** `AGENTS.md`, `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`

Document that sample lifecycle registration is subclass-owned and cannot alter
the reusable base skill behavior.

## Verification

- Run the focused Node.js handler test suite.
- Run the baseline checker from the repository root and an external directory.
- Run `make check` from the repository root and an external directory.
- Confirm hostile mutations that remove or reorder the ownership boundary fail
  the regression or baseline contract.
- Audit the exact diff, generated artifacts, whitespace, and changed lines for
  credential material before committing.

## Risks And Mitigations

- **Prototype lookup changes:** use delegation to preserve unmodified base
  lifecycle methods instead of copying a potentially stale snapshot.
- **Module-cache test interference:** isolate the ownership assertion around a
  deliberate module reload and restore cache state when required.
- **Stacked delivery:** base the pull request on the existing async-handler
  branch and retain base-first merge ordering.

## Out Of Scope

- Replacing prototype inheritance with classes or a new Alexa SDK.
- Changing request or intent handler ownership.
- Deploying a Lambda function or exercising a live Alexa skill invocation.
