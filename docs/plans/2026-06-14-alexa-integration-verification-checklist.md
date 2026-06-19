# Alexa Integration Verification Checklist

Status: Completed

## Problem

Unit and static contracts cover Alexa event validation and response behavior,
but no checklist defines the non-production Lambda and Alexa developer-console
evidence required before claiming a deployed skill works.

## Requirements

1. Add an exact-commit matrix for Lambda configuration, trigger restriction,
   launch/session/intent flows, invalid requests, logging, and rollback.
2. Require sanitized evidence without recording utterances, request IDs,
   session IDs, account identifiers, or credentials in git.
3. Keep repository checks separate from unexecuted cloud integration scenarios.
4. Add mutation-sensitive contracts for the checklist and completion evidence.

## Scope Boundaries

- Do not deploy Lambda, edit IAM, configure an Alexa skill, or invoke production.
- Do not add account IDs, ARNs, skill IDs, request payloads, logs, or credentials.
- Do not change handler behavior, dependencies, speech assets, or response text.
- Do not merge or close stacked pull requests without explicit authorization.

## Verification

- `sh -n scripts/check-baseline.sh`, the focused baseline checker, and the
  locked Node package gate passed.
- Repository-root and external-working-directory `make check` passed lint,
  formatting, tests, syntax, and portable repository contracts.
- Twelve hostile mutations were rejected for removing checklist, configuration,
  trigger, invocation, rejection, logging, rollback, unexecuted-result,
  documentation, or completed-plan evidence.
- No Lambda, IAM, Alexa developer-console, trigger, or live invocation scenario was executed; every cloud matrix row remains `not run`.
