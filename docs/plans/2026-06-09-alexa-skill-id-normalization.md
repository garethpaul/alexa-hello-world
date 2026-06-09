---
title: Alexa Skill ID Normalization
type: reliability
status: completed
date: 2026-06-09
---

# Alexa Skill ID Normalization

## Problem Frame

`ALEXA_SKILL_ID` is optional, but the handler previously read it directly from
the environment. A whitespace-only value was treated as a configured skill id,
causing every request to fail application-id validation even though no real
identifier had been supplied.

## Scope Boundaries

- Preserve optional application-id validation for real configured values.
- Do not change the Lambda handler shape or add runtime dependencies.
- Keep behavior covered by local Node tests.

## Implementation Units

### U1: Normalize The Environment Value

Files:

- Modify `src/index.js`

Approach:

- Add a small `configuredSkillId()` helper.
- Return `undefined` for missing, non-string, or blank values.
- Trim real configured skill ids before the AlexaSkill instance uses them.

### U2: Cover Configuration Edges

Files:

- Modify `test/handler.test.js`

Approach:

- Assert that configured ids are trimmed.
- Assert that blank configured ids leave application-id validation disabled.
- Preserve the existing rejection test for mismatched real ids.

### U3: Document The Deployment Contract

Files:

- Modify `README.md`
- Modify `VISION.md`
- Modify `CHANGES.md`

Approach:

- Document that `ALEXA_SKILL_ID` values are trimmed and blank values are treated
  as unset.

## Verification

- `npm test`
- `npm run build`
- `make check`
- `git diff --check`
