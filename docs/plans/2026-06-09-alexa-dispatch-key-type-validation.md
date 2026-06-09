# Alexa Dispatch Key Type Validation

Date: 2026-06-09
Status: Completed

## Problem

`request.type` and `intent.name` were checked for truthiness before dispatch.
A malformed Alexa event could provide an object with a `toString()` method that
coerced into a supported handler name during property lookup.

## Scope

- Require Alexa request types to be own, non-empty string values before request
  handler lookup.
- Require intent names to be own, non-empty string values before intent handler
  lookup.
- Preserve existing supported launch, intent, help, cancel, stop, and session
  ended behavior.

## Verification

- Red: `npm test` failed because crafted non-string request and intent keys
  still dispatched.
- Green: `npm test` passes after string validation.
- Full gate: `make check`.
