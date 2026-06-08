---
title: Alexa Request Type Contracts
status: completed
date: 2026-06-08
origin: user-requested continuous engineering quality loop
execution: code
---

# Alexa Request Type Contracts

## Problem Frame

The existing tests cover launch, intent, help, unsupported intent, and optional
application-id validation. Unsupported Alexa request types still fail through an
incidental `TypeError` because the request dispatcher calls an undefined
handler.

## Scope Boundaries

- Preserve the minimal sample structure and response shape.
- Do not add dependencies or move to a framework.
- Keep failure messages local-test friendly.

## Implementation Units

### U1: Unsupported Request Test

Files:

- Modify `test/handler.test.js`

Approach:

- Assert that an unsupported request type fails the Lambda invocation with a
  clear message.

### U2: Dispatcher Guard

Files:

- Modify `src/AlexaSkill.js`

Approach:

- Check for a request handler before dispatch and throw a clear legacy string
  error when the request type is unknown.

## Verification

- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
