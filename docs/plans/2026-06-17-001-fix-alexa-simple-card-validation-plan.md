---
title: Alexa Simple Card Validation
type: fix
date: 2026-06-17
---

# Alexa Simple Card Validation

## Status: Planned

## Summary

Validate `Simple` card title and content values before returning Alexa responses
so malformed handler output fails locally instead of producing invalid or
silently incomplete cards.

## Problem Frame

`tellWithCard` and `askWithCard` currently add a card only when both values are
truthy. Non-string objects can therefore enter the response, while blank or
partial card inputs silently remove the requested card. Amazon's response
contract defines `Simple` cards as text-bearing `title` and `content` fields.

## Requirements

- R1. Card-producing response helpers must require non-empty string titles and
  content.
- R2. A missing, blank, or non-string card field must fail with a stable generic
  error that does not reflect caller-controlled values.
- R3. Valid `tellWithCard` and `askWithCard` responses must retain their current
  speech, reprompt, session, and `Simple` card behavior.
- R4. Runtime tests and the baseline checker must reject removal or weakening of
  the card validation contract.
- R5. Maintainer guidance and change history must describe the response
  boundary and its verification evidence.

## Key Technical Decisions

- **Validate at response construction:** Both public card helpers already flow
  through `buildSpeechletResponse`, so one shared guard prevents divergent
  behavior.
- **Fail rather than omit:** Calling a card helper expresses intent to return a
  card; malformed fields are programmer errors and must not be silently dropped.
- **Reuse the non-empty string rule:** Card text follows the same string-shape
  boundary already used for Alexa envelope and speech fields.
- **Keep limits out of scope:** Amazon's combined 8,000-character response limit
  spans more than these two fields and needs a separate size-budget design.

## Implementation Units

### U1. Enforce the card field contract

- **Files:** `src/AlexaSkill.js`
- **Goal:** Validate both card fields before adding a `Simple` card and return a
  stable error for malformed values.
- **Patterns:** Follow the existing speech-output normalization and generic
  failure messages.

### U2. Add mutation-sensitive regression coverage

- **Files:** `test/handler.test.js`, `scripts/check-baseline.sh`
- **Goal:** Cover valid tell/ask cards plus missing, blank, non-string, and
  partial inputs through the public response helpers.
- **Verification:** Reject mutations that remove validation, restore truthiness
  omission, or remove the focused tests and static contract.

### U3. Synchronize maintained guidance

- **Files:** `README.md`, `AGENTS.md`, `VISION.md`, `CHANGES.md`,
  `docs/plans/2026-06-17-001-fix-alexa-simple-card-validation-plan.md`
- **Goal:** Record the fail-closed card boundary, plan completion, and actual
  verification after the implementation passes.

## Acceptance Examples

- AE1. Given non-empty string card fields, `tellWithCard` returns a `Simple`
  card and ends the session.
- AE2. Given non-empty string card fields, `askWithCard` returns a `Simple` card,
  a reprompt, and keeps the session open.
- AE3. Given either card field is absent, blank, or not a string, response
  construction rejects the handler result without reflecting the supplied value.

## Scope Boundaries

- Do not change speech validation, request dispatch, authorization, lifecycle
  ordering, dependency versions, or workflow configuration.
- Do not add Standard cards, images, APL responses, or a global response-size
  budget.
- Do not deploy Lambda or invoke a live Alexa skill.

## Risks And Dependencies

- Static contracts must assert behavior without coupling to incidental variable
  names or formatting.
- Live Alexa certification and device rendering remain outside local validation.

## Verification

- Run focused card-response tests before the complete Node gate.
- Run `make check` from the repository root and an external directory.
- Run isolated hostile mutations for validation removal, partial-card omission,
  focused-test removal, checker removal, guidance removal, and plan completion.
- Audit exact diffs, generated artifacts, secrets, conflicts, modes, binaries,
  file sizes, and whitespace before committing implementation.

## Sources

- `src/AlexaSkill.js`: shared response construction and speech validation.
- `test/handler.test.js`: public handler-path response regressions.
- Amazon Alexa Skills Kit, "Include a Card in Your Skill's Response": a
  `Simple` card provides text for both `title` and `content`.
- Amazon Alexa Skills Kit, "Request and Response JSON Reference": response card
  text shares an 8,000-character aggregate limit, deferred from this narrow fix.
