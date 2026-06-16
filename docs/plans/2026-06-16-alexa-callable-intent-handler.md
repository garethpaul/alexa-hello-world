# Callable Alexa Intent Handlers

## Status: Planned

## Priority

P1 dispatch correctness. A truthy non-function value in `intentHandlers` passes
the current support check and is invoked with `.call`, producing a raw
`TypeError` instead of the stable unsupported-intent failure.

## Approach

- Resolve only owned intent-handler properties as today.
- Require the resolved value to be a function before logging or invocation.
- Preserve the stable `Unsupported intent` error and existing supported intent
  behavior.
- Add executable and static mutation-sensitive coverage plus maintenance docs.

## Verification

- Reproduce the pre-fix raw `TypeError` with a truthy object handler.
- Run focused tests and the complete locked Node gate from repository and
  external directories.
- Reject implementation, test, checker, guidance, and completed-plan
  mutations.
- Audit exact paths, artifacts, secrets, conflicts, modes, binaries, sizes, and
  whitespace.

## Scope Boundaries

- Do not change request validation, lifecycle ordering, supported intents,
  response payloads, logging content, dependencies, or workflow shape.
- Do not deploy Lambda or invoke a live Alexa skill.
- Keep PR #20 and predecessors open and preserve base-first ordering.

## Success Criteria

- Non-callable intent handlers fail with `Unsupported intent`.
- No raw function-call exception is exposed.
- Existing callable handlers retain behavior.

## Verification Completed

Pending implementation and bounded verification.
