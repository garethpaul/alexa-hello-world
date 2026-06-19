# Callable Alexa Event Handlers

## Status: Completed

## Priority

P1 lifecycle correctness. Request dispatch currently assumes the resolved
`onSessionStarted` and request-specific event handlers are callable. A malformed
subclass table can therefore run partial lifecycle behavior or expose a raw
function-call error instead of the stable unsupported-request failure.

## Approach

- Map each supported request type to its required event-handler name.
- Resolve the required lifecycle handlers before any new-session hook runs.
- Require `onSessionStarted` for new sessions and the request-specific handler
  to be functions before invocation.
- Reject malformed lifecycle tables with the stable unsupported-request error.
- Preserve valid synchronous and asynchronous handlers.
- Add executable and static mutation-sensitive coverage plus synchronized
  maintenance guidance.

## Verification

- Reproduce the pre-fix raw function-call failures for malformed lifecycle
  handlers.
- Run focused tests and the complete locked Node gate from repository and
  external directories.
- Reject implementation, ordering, test, checker, guidance, and completed-plan
  mutations.
- Audit exact paths, generated artifacts, secrets, conflicts, modes, binaries,
  sizes, and whitespace.

## Scope Boundaries

- Do not change request-envelope validation, application authorization,
  supported request or intent types, response payloads, dependencies, runtime
  versions, workflow shape, or handler ownership.
- Do not deploy Lambda or invoke a live Alexa skill.
- Keep PR #21 and predecessors open and preserve base-first ordering.

## Success Criteria

- Non-callable request-specific event handlers fail before session lifecycle
  hooks with `Unsupported request type`.
- Non-callable `onSessionStarted` handlers fail before lifecycle dispatch with
  `Unsupported request type`.
- Existing callable event handlers retain their ordering and async behavior.

## Verification Completed

- The pre-fix review confirmed that malformed request-specific and
  session-start lifecycle handlers reached raw function calls.
- Non-callable request-specific event handlers fail before session lifecycle hooks.
- Non-callable session-start handlers fail before request dispatch. Both retain
  the stable `Unsupported request type` error.
- The complete locked Node gate passed 85 tests, lint, formatting, syntax build,
  and `npm audit --omit=dev` with zero reported vulnerabilities.
- The repository and external-directory `make check` passed the complete
  maintained gate.
- Seven isolated hostile mutations were rejected across event-handler
  resolution, callability checks, lifecycle ordering, regressions, guidance,
  and completed-plan evidence.
- Exact diff, artifact, secret, conflict, mode, binary, size, and whitespace
  audits passed. No live Lambda or Alexa invocation was performed.
