# Callable Alexa Event Handlers

## Status: Planned

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
- Reject malformed lifecycle tables with the existing `Unsupported request
  type` error while preserving valid synchronous and asynchronous handlers.
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
