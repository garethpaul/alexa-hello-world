---
title: Alexa Log Identifier Redaction
type: security
status: completed
date: 2026-06-09
---

# Alexa Log Identifier Redaction

## Problem Frame

The sample logs raw Alexa request IDs, session IDs, and application IDs during
normal lifecycle handling and application-id rejection. Those identifiers are
not required to understand the sample flow, and keeping them out of routine logs
reduces avoidable exposure in local or Lambda log streams.

## Scope Boundaries

- Preserve the dependency-free Lambda runtime and existing request behavior.
- Keep lifecycle diagnostics visible enough for the sample to be understandable.
- Do not add a logging package, structured logging framework, or production
  observability layer in this pass.

## Implementation Units

### U1: Redact Routine Lifecycle Logs

Files:

- Modify `src/index.js`
- Modify `src/AlexaSkill.js`

Approach:

- Keep lifecycle log messages for session start, launch, and session end.
- Replace raw `requestId`, `sessionId`, and `applicationId` values with generic
  validation or lifecycle messages.
- Keep failure behavior unchanged for invalid application IDs.

### U2: Cover Log Hygiene Locally

Files:

- Modify `test/handler.test.js`

Approach:

- Capture `console.log` output during selected handler invocations.
- Assert that launch handling does not log request, session, or application IDs.
- Assert that configured application-id rejection does not log either compared
  identifier.

### U3: Document The Privacy Contract

Files:

- Modify `README.md`
- Modify `VISION.md`
- Modify `CHANGES.md`

Approach:

- Record the logging rule beside the existing `ALEXA_SKILL_ID` deployment note.
- Keep future deployment logging or observability work separate from the sample
  handler contract.

## Verification

- `make check`
- `npm test`
- `npm run build`
- `git diff --check`
