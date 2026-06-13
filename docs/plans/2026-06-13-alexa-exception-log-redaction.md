# Alexa Exception Log Redaction

Status: Completed

## Context

`AlexaSkill.execute` preserves caught `Error` objects through `context.fail`, but
also concatenates each exception into a routine log line. Handler-provided error
messages can contain request data or operational details that should not be
duplicated into CloudWatch logs.

## Requirements

- Log a stable generic message for top-level Alexa execution failures.
- Preserve the original `Error` object, message, and stack in `context.fail`.
- Prove a handler-provided sensitive message is absent from logs but retained in
  the Lambda failure value.
- Extend the portable baseline and repository guidance.
- Record completed local, mutation, and hosted verification truthfully.

## Implementation

- Replace exception string concatenation in `src/AlexaSkill.js` with a fixed log.
- Add a custom launch-handler regression test in `test/handler.test.js`.
- Strengthen `scripts/check-baseline.sh` against exception-derived log text.
- Update README, SECURITY, CHANGES, and this plan.

## Verification

- The focused regression test failed before implementation because the
  handler-provided message and newline-forged suffix appeared in captured logs.
- The focused regression test passed after the log became generic while the
  original `Error` object and stack remained unchanged in `context.fail`.
- Eight hostile mutations were rejected: restoring exception concatenation,
  adding direct exception logging, logging `e.message`, wrapping the failure
  object, removing the redaction assertion, removing README guidance, removing
  security guidance, and removing this canonical plan.
- `make check` passed ESLint, Prettier, all tests, Node syntax checks, and the
  portable baseline locally and from an external working directory.
- Workflow YAML parsing, dependency audit, secret-pattern scanning, and
  `git diff --check` passed.
- Live Alexa invocation, Lambda deployment, IAM, and CloudWatch behavior remain
  operational validation boundaries.
