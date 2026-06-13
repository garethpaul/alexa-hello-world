# Require Alexa Skill ID In Lambda

Status: Planned

## Priority

This is the next security priority after exception-log redaction because the
handler currently treats `ALEXA_SKILL_ID` as optional in every environment. A
deployed Lambda with a missing or blank value silently disables application-ID
authorization and accepts events carrying any syntactically valid Alexa skill
ID. Local development compatibility is useful, but it should not override the
deployed authorization boundary.

## Requirements

- **R1:** Fail module initialization when AWS Lambda is detected and
  `ALEXA_SKILL_ID` is missing, blank, or non-string.
- **R2:** Preserve the existing trimmed skill-ID comparison and generic
  application-ID rejection behavior when configuration is present.
- **R3:** Preserve optional skill-ID configuration outside Lambda so local
  examples and dependency-free tests can run without deployment variables.
- **R4:** Keep configuration failures free of incoming Alexa event values,
  request identifiers, or configured secret-like data.
- **R5:** Add no-network helper and module-load regressions plus fail-closed
  portable contracts and operational guidance.
- **R6:** Record truthful focused, full, external-directory, mutation, hosted,
  and live-deployment verification evidence.

## Implementation Units

### U1: Resolve Deployment Configuration

**File:** `src/index.js`

Add a small configuration helper that reuses the existing trimming behavior,
detects Lambda from the runtime-provided `AWS_LAMBDA_FUNCTION_NAME`, and throws
one stable generic `Error` before constructing the skill when a deployed
function lacks `ALEXA_SKILL_ID`.

### U2: Cover Local And Lambda Modes

**File:** `test/handler.test.js`

Exercise local missing/blank compatibility, Lambda missing/blank rejection,
configured Lambda acceptance, stable generic failure text, and module-load
failure before a handler can accept events.

### U3: Preserve The Durable Contract

**Files:** `scripts/check-baseline.sh`, `README.md`, `SECURITY.md`, `CHANGES.md`,
`docs/plans/2026-06-13-alexa-lambda-skill-id-required.md`

Require the helper, Lambda runtime signal, regression names, completed plan,
and deployment guidance. Record actual verification after execution.

## Test Scenarios

- Local execution without Lambda markers and without `ALEXA_SKILL_ID` remains
  available.
- Lambda module loading rejects missing, blank, and non-string skill IDs with
  the exact generic configuration error.
- Lambda module loading succeeds with a trimmed configured skill ID and keeps
  mismatched incoming application IDs on the existing rejection path.
- Hostile mutations removing Lambda detection, restoring optional deployment
  configuration, reflecting values, removing tests/guidance, or reverting plan
  completion fail verification.

## Scope Boundaries

- Do not change Alexa request dispatch, response payloads, speech output,
  session attributes, logs, dependencies, IAM policies, or Lambda triggers.
- Do not treat `ALEXA_SKILL_ID` as a secret; it is an authorization identifier,
  but configuration failures must still avoid echoing values.
- Do not claim live Lambda, Alexa developer-console, IAM, trigger, or CloudWatch
  validation without deployment access.

## Verification

Pending implementation and execution.

## Sources

- Alexa Skills Kit, Handle Requests Sent by Alexa:
  https://developer.amazon.com/en-US/docs/alexa/custom-skills/handle-requests-sent-by-alexa.html
- AWS Lambda, Working with Lambda environment variables:
  https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
