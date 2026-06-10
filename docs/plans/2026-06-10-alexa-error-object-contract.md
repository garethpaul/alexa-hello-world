# Alexa Error Object Contract

Status: Completed

## Context

The Lambda handler threw primitive strings for malformed events, authorization
failures, and unsupported dispatch keys. Although `context.fail` accepted those
values in local tests, primitive failures carry no stack or originating error
type, making operational diagnosis harder.

## Changes

- Throw `Error` objects for every validation, authorization, and dispatch
  failure in `AlexaSkill`.
- Preserve the existing generic messages so caller-controlled request and
  intent names are not reflected into logs or failures.
- Require tests to verify the failure type, message, and stack.
- Extend the scripted baseline to reject string throws.

## Verification

- `npm test`
- `make check`
- Mutation check for a reintroduced string throw
- `git diff --check`
