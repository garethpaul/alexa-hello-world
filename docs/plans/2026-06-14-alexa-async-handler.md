---
title: Alexa Async Lambda Handler
type: modernization
status: planned
date: 2026-06-14
---

# Alexa Async Lambda Handler

## Problem Frame

The sample targets Node.js 20 and newer but still completes requests through
the legacy `context.succeed` and `context.fail` APIs. AWS recommends async
handlers, and callback-based Node.js handlers are not supported after Node.js
22. The current completion contract therefore blocks a clean Node.js 24 Lambda
runtime path even though hosted verification already includes Node.js 24.

## Requirements

- Export an async Lambda handler that resolves with the existing Alexa response
  payload and rejects with the original stack-bearing `Error`.
- Make `AlexaSkill.execute` await lifecycle and request handlers so future
  asynchronous handlers complete before Lambda returns.
- Make response helpers return response payloads instead of completing a
  Lambda context object.
- Preserve launch, intent, help, cancel, stop, session-ended, validation,
  logging, card, SSML, reprompt, and session-attribute behavior.
- Add regression and static contracts that reject restoration of
  `context.succeed`, `context.fail`, or a non-async exported handler.

## Scope Boundaries

- Do not add the Alexa Skills Kit SDK or any runtime dependency.
- Do not change request validation, supported intents, speech text, response
  schemas, skill-ID configuration, or integration evidence.
- Do not claim a live Lambda or Alexa invocation; cloud rows remain explicitly
  unexecuted.
- Do not merge or close stacked pull requests without explicit authorization.

## Verification

- Focused promise resolution, rejection, session-ended, and awaited lifecycle
  tests plus the complete Node test suite.
- Lint, formatting, syntax build, repository `make check`, and external-directory
  `make check`.
- Hostile mutations for the async export, awaited dispatch, returned response,
  rejected error, removed context completion, static contracts, and plan
  completion evidence.
- Exact diff, generated-artifact, changed-line secret, and whitespace audits.
- One bounded exact-head hosted snapshot after push; no polling or wait loop.

## Risks

- Offline fixtures prove the Lambda return contract but do not replace a
  non-production deployment and Alexa developer-console invocation.
- Awaiting user-defined lifecycle hooks can expose handlers that previously
  started asynchronous work without returning it; this is intentional because
  Lambda must not finish before declared handler work settles.
