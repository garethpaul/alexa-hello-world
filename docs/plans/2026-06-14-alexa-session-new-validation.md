# Alexa Session New Validation

Status: Planned

## Problem

`event.session.new` controls whether `onSessionStarted` runs, but the event
validator does not require or type-check it. A malformed truthy value such as
the string `"false"` therefore triggers new-session initialization, while a
missing or inherited field is silently treated as an existing session.

## Requirements

1. Require `session.new` as an own property on every accepted Alexa event.
2. Require the field to be a boolean before application authorization,
   session-attribute normalization, or request dispatch.
3. Preserve valid `true` and `false` lifecycle behavior and every existing
   application ID, request ID, timestamp, dispatch, speech, and log boundary.
4. Add focused tests for missing, inherited, and non-boolean values plus
   validation ordering.
5. Add mutation-sensitive baseline and completed-plan evidence.

## Implementation Units

### 1. Characterize malformed lifecycle flags

Add handler tests proving missing, inherited, string, numeric, object, array,
and null values fail with stable messages and do not dispatch lifecycle or
request handlers.

### 2. Validate before behavior

Use the existing own-property and boolean checks in `validateEvent` before the
request object is inspected. Keep all caller-provided values out of logs and
failure messages.

### 3. Protect and document the contract

Extend the baseline checker with validation source, focused-test, ordering,
documentation, required-plan, and completed-status contracts. Update
maintenance, security, vision, and change guidance.

## Verification

- Run the focused session-new tests first, then the complete package gate.
- Run root and external `make check` gates with explicit timeouts.
- Reject focused mutations for presence, boolean type, ordering, test names,
  documentation, plan status, and plan presence.
- Run lint, formatting, syntax, JSON/YAML parsing, `git diff --check`, and
  explicit secret and generated-artifact audits.

## Scope Boundaries

- Do not change session attribute semantics, supported request/intent types,
  responses, dependencies, workflows, or public error logging.
- Do not merge or close any pull request without explicit owner authorization.
