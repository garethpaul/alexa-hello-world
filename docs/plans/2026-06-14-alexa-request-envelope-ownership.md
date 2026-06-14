---
title: Alexa Request Envelope Ownership
type: security
status: planned
date: 2026-06-14
---

# Alexa Request Envelope Ownership

## Problem Frame

The Alexa validator requires the event to own its `session` property and each
request field to be an own property, but it reads `event.request` without first
requiring the top-level event to own that envelope. A crafted object can inherit
a complete request from its prototype and reach normal dispatch.

## Requirements

- Require `request` to be an own property of the top-level Alexa event before
  reading request type, ID, or timestamp.
- Reject missing and inherited request envelopes with the existing stable
  missing-request-type failure.
- Preserve valid launch, intent, session-ended, timestamp, application ID,
  session lifecycle, speech, and response behavior.
- Add a regression that proves an inherited complete request is rejected before
  dispatch.
- Update maintained security and change guidance with completed evidence.

## Scope Boundaries

- Do not add dependencies or migrate to the Alexa Skills Kit SDK.
- Do not change supported intents, speech output, cards, logging, or Lambda
  configuration.
- Do not merge or close stacked pull requests without explicit authorization.

## Verification

- Focused inherited-envelope regression and complete Node test suite.
- Lint, formatting, build syntax, repository `make check`, and external-directory
  `make check`.
- Hostile mutations for ownership, inherited-request construction, stable
  failure, documentation, and completed-plan evidence.
- Exact diff, generated-artifact, changed-line secret, and whitespace audits.
- One bounded exact-head hosted snapshot after push; no polling or wait loop.

## Risks

- Lambda/Alexa integration remains represented by offline fixtures; no live
  skill invocation or AWS credentials are used.
- The fix intentionally preserves the legacy error text rather than introducing
  a broader validation error taxonomy.
