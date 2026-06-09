---
title: Alexa Event Shape Validation
type: reliability
status: completed
date: 2026-06-09
---

# Alexa Event Shape Validation

## Problem Frame

The request dispatcher now handles unsupported request types and exit intents
explicitly, but malformed Alexa envelopes still fail through incidental
property-access errors. Missing `session.application.applicationId`, missing
`request.type`, or malformed intent requests should produce stable diagnostic
messages in local tests.

## Scope Boundaries

- Preserve the minimal CommonJS Lambda sample.
- Do not add runtime dependencies or migrate to the Alexa Skills Kit SDK.
- Keep existing valid request responses unchanged.
- Keep legacy string failure messages so the existing handler/test style stays
  consistent.

## Implementation Units

### U1: Validate The Alexa Envelope

Files:

- Modify `src/AlexaSkill.js`

Approach:

- Add a small validation helper for the top-level event shape.
- Reject missing `session.application.applicationId`.
- Reject missing `request.type`.
- Run validation before logging or dispatching the request.

### U2: Validate Intent Requests

Files:

- Modify `src/AlexaSkill.js`
- Modify `test/handler.test.js`

Approach:

- Check `intent.name` before intent-handler lookup.
- Add local tests for malformed intent requests and malformed top-level
  envelopes.

### U3: Document The Contract

Files:

- Modify `README.md`
- Modify `CHANGES.md`
- Modify `VISION.md`

Approach:

- Record the event-shape validation coverage and link this plan from the
  maintenance notes.

## Verification

- `npm run lint`
- `npm run format:check`
- `npm test`
- `npm run build`
- `make check`
- `git diff --check`
