# Require Callable Alexa Request Handlers

Status: Planned

## Problem

`AlexaSkill.execute` treats any truthy own entry in `requestHandlers` as a
supported handler. A subclass can therefore register a non-function value for
a supported request type. For a new session, `onSessionStarted` then runs
before dispatch fails with an implementation-derived `TypeError`, violating the
existing fail-before-lifecycle guarantee for unsupported request handling.

## Priority

This is a narrow dispatcher correctness and lifecycle-side-effect defect on the
current stack tip. It is preferable to broad SDK modernization because it is
locally reproducible, preserves the sample's public request types, and extends
an existing fail-closed boundary with a small reviewable change.

## Scope

- Require the resolved own request-handler entry to be a function before any
  new-session lifecycle hook runs.
- Reject missing and non-callable entries through the same stable
  `Unsupported request type` failure.
- Prove a non-callable own handler cannot trigger `onSessionStarted`.
- Add mutation-sensitive baseline contracts and synchronized guidance.

## Out Of Scope

- Supported Alexa request or intent types, intent-handler registration,
  application authorization, request-envelope validation, response shapes,
  dependencies, runtime versions, Lambda deployment, or Alexa configuration.

## Implementation

1. Add a focused regression that registers a non-callable own LaunchRequest
   handler and observes the current lifecycle side effect.
2. Validate handler callability immediately after own-property resolution and
   before `onSessionStarted`.
3. Preserve valid synchronous and asynchronous custom handler behavior.
4. Extend the baseline checker, README, security guidance, vision, changelog,
   and canonical plan inventory.

## Verification

- Run the focused regression and complete Node test suite.
- Run lockfile-installed lint, format, syntax build, and production dependency
  audit.
- Run repository-root and external-directory `make check` with explicit
  timeouts.
- Reject isolated hostile mutations that remove callability validation, move it
  after lifecycle hooks, weaken the regression or guidance, or falsify plan
  completion.
- Audit the exact diff, generated artifacts, credential-shaped additions,
  dependencies/workflows, conflict markers, modes, and whitespace.

## Residual Risk

- No live Lambda deployment, IAM policy, Alexa developer-console trigger, or
  real skill invocation is exercised locally.
