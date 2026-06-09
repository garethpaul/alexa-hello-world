# Alexa Intent Own-Property Dispatch

## Status: Completed

## Context

Intent dispatch used `this.intentHandlers[intentName]`, which can resolve
inherited object properties such as `constructor`. Unsupported Alexa intent
names should fail through the explicit unsupported-intent path unless the skill
defines a handler as its own property.

## Objectives

- Preserve dispatch for declared intent handlers.
- Treat inherited object property names as unsupported intents.
- Keep unsupported-intent failure messages stable.
- Cover the behavior in local handler tests.

## Work Completed

- Changed intent lookup to use `Object.prototype.hasOwnProperty.call`.
- Added a handler test for the inherited `constructor` intent name.
- Updated README, VISION, and CHANGES.

## Verification

- `npm test`
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `make check`
- `git diff --check`

## Follow-Up Candidates

- Add response-shape tests for SSML helpers if the sample introduces SSML.
- Keep intent schema and local intent handler coverage aligned when adding new
  intents.
