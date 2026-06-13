# Alexa Request Timestamp Freshness

Status: Planned

## Context

`AlexaSkill.execute` validates the application ID and dispatch key shape but
does not validate `request.timestamp`. A previously valid event can therefore
reach a handler long after Alexa created it if it is replayed through another
invocation path. Amazon documents the timestamp as an ISO 8601 string and
requires manually verified requests to remain within 150 seconds of the
current time.

## Requirements

- Require `request.timestamp` to be a non-empty ISO 8601 UTC string before
  application-ID authorization or request dispatch.
- Reject malformed timestamps and timestamps more than 150 seconds older or
  newer than the current time.
- Accept timestamps exactly at either 150-second boundary.
- Use an injectable clock for deterministic tests while preserving existing
  `new AlexaSkill(appId)` callers and the dependency-free runtime.
- Keep failures generic so caller-controlled timestamp values never appear in
  logs or Lambda failure messages.
- Preserve application-ID validation, dispatch behavior, response shapes, and
  session lifecycle semantics for fresh requests.
- Add mutation-sensitive tests, static contracts, documentation, and truthful
  verification evidence.

## Implementation Units

### U1: Enforce Timestamp Freshness

**File:** `src/AlexaSkill.js`

Add a strict UTC ISO 8601 parser and a 150-second absolute freshness check in
the shared event-validation path. Supply the current time from an optional
constructor clock that defaults to `Date.now`.

### U2: Add Behavioral And Static Coverage

**Files:** `test/handler.test.js`, `scripts/check-baseline.sh`

Give normal fixtures a deterministic fresh timestamp. Cover missing, blank,
non-string, malformed, stale, and excessive future values; both exact
boundaries; generic failure text; validation ordering; and implementation,
test, documentation, and completed-plan markers.

### U3: Document And Verify

**Files:** `AGENTS.md`, `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`, this plan

Document the defense-in-depth request boundary and its 150-second tolerance.
Run focused tests and hostile mutations, the full locked dependency gate,
external-directory verification, audit/diff/artifact/secret scans, and
exact-head hosted checks.

## Scope Boundaries

- Do not add request-signature verification, replay caches, HTTP adapters, ASK
  SDK dependencies, or deployment infrastructure in this unit.
- Do not claim that timestamp validation replaces Alexa signature verification
  for custom web services or Lambda trigger authorization.
- Do not change intents, speech construction, application-ID configuration,
  cards, logs, or session attributes.
- Do not claim live Alexa, Lambda, IAM, trigger, or CloudWatch validation.

## Verification Plan

- Run focused `node --test` cases for timestamp shape, freshness, boundaries,
  validation ordering, and generic failures.
- Prove hostile mutations covering missing validation, tolerance direction,
  absolute comparison, boundary inclusivity, clock injection, tests, guidance,
  and completed-plan status fail.
- Run `make check` locally and in an isolated external directory with the
  locked dependency tree.
- Run `npm audit --omit=dev`, `git diff --check`, generated-artifact inspection,
  and credential-shaped added-line scans.
- Record hosted evidence only after querying the exact pushed head.

## Sources

- Amazon Alexa Skills Kit, Host a Custom Skill as a Web Service, Check the
  Request Timestamp:
  https://developer.amazon.com/en-US/docs/alexa/custom-skills/host-a-custom-skill-as-a-web-service.html#check-the-request-timestamp
- Amazon Alexa Skills Kit, Request Types Reference:
  https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-types-reference.html

## Verification

- Pending implementation.
