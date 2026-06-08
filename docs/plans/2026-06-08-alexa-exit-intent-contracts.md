---
title: Alexa Exit Intent Contracts
status: completed
date: 2026-06-08
origin: user-requested continuous engineering quality loop
execution: code
---

# Alexa Exit Intent Contracts

## Problem Frame

The sample handles launch, hello, help, unsupported intents, unsupported request
types, and application-id validation. Built-in `AMAZON.CancelIntent` and
`AMAZON.StopIntent` still route through the unsupported-intent failure path even
though users naturally expect those commands to end the interaction.

## Scope Boundaries

- Preserve the minimal CommonJS Lambda sample structure.
- Do not migrate to the Alexa Skills Kit SDK.
- Do not add runtime dependencies or new deployment tooling.
- Keep the response plain text and local-test friendly.

## Implementation Units

### U1: Exit Intent Handlers

Files:

- `src/index.js`

Approach:

- Add `AMAZON.CancelIntent` and `AMAZON.StopIntent` handlers.
- End the session with a short goodbye response.

### U2: Handler Tests and Assets

Files:

- `test/handler.test.js`
- `speechAssets/IntentSchema.json`

Approach:

- Exercise both built-in intents through the exported Lambda handler.
- Keep the legacy interaction schema aligned with the implemented built-ins.

### U3: Documentation

Files:

- `README.md`
- `CHANGES.md`

Approach:

- Record the expanded handler test coverage and the new exit-intent behavior.

## Verification

- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`
