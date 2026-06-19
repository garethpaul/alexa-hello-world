# Callable Alexa Intent Handlers

## Status: Completed

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

- The pre-fix review confirmed that truthy object handlers reached `.call` and
  exposed a raw function-call failure.
- Non-callable intent handlers fail with `Unsupported intent`, and the focused
  regression proves the malformed handler is never called.
- Maintenance review added `malformed intent handler tables fail with the
stable unsupported error`, covering null handler maps without exposing raw
  own-property helper failures.
- The repository and external-directory `make check` passed the complete locked
  gate with 83 tests on Node 20.
- Six hostile mutations were rejected across the handler guard, regression,
  no-call assertion, guidance, type check, and completed plan.
- Exact diff, artifact, secret, conflict, mode, binary, size, and whitespace
  audits passed. No live Lambda or Alexa invocation was performed.
