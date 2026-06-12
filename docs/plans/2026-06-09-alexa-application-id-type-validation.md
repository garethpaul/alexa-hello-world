# Alexa Application Id Type Validation

## Status: Completed

## Context

The Alexa event validator required `session.application.applicationId` to be
present, and configured deployments compared it against `ALEXA_SKILL_ID`.
When no skill ID was configured, a crafted non-string application ID object
could pass event validation and reach normal request dispatch.

## Objectives

- Preserve optional `ALEXA_SKILL_ID` validation for configured deployments.
- Require incoming Alexa application IDs to be non-empty strings.
- Reject object-shaped application IDs before request dispatch.
- Keep failure messages explicit and covered by local tests.

## Work Completed

- Added application-id type validation to the Alexa event validator.
- Added handler coverage for a non-string application ID object.
- Updated README, VISION, and CHANGES.

## Verification

- `npm test -- --test-name-pattern "non-string application ids"`
- `make check`
- `git diff --check`
