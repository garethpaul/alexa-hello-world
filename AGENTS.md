# AGENTS.md

## Repository purpose

`garethpaul/alexa-hello-world` is a Node.js or JavaScript project. A very basic hello-world sample alexa app.

## Project structure

- `Makefile` - repository verification targets
- `scripts` - baseline checks and helper scripts
- `docs` - plans, notes, and generated README assets
- `src` - primary source code
- `test` - tests and fixtures
- `package.json` - Node package metadata and scripts

## Development commands

- Install dependencies: `npm ci`
- Full baseline: `make check`
- Combined verification: `make verify`
- Lint/static checks: `make lint`
- Tests: `make test`
- Build: `make build`
- package script `build`: `npm run build`
- package script `lint`: `npm run lint`
- package script `format:check`: `npm run format:check`
- package script `test`: `npm test`
- If a command above skips because a platform toolchain is missing, verify on a machine with that SDK before claiming platform behavior is tested.

## Coding conventions

- Language mix noted in the README: JavaScript (4).
- Use Node >=20.19 for package scripts.
- Package module type is `commonjs`.
- ESLint is configured; keep lint fixes in source instead of generated output.
- Prettier is configured; use the checked-in format rules.

## Testing guidance

- Test-related files detected: `docs/plans/2026-06-08-alexa-testability-baseline.md`, `test/`, `test/handler.test.js`
- Start with the narrowest relevant test or Make target, then run `make check` before handing off if the change is not documentation-only.
- Keep README verification notes in sync when commands, fixtures, or supported toolchains change.

## PR / change guidance

- Keep diffs focused on the requested repository and avoid unrelated modernization or formatting churn.
- Preserve public APIs, sample behavior, file formats, and documented environment variables unless the task explicitly changes them.
- Update tests, README notes, or docs/plans when behavior, security posture, or validation commands change.
- Call out skipped platform validation, legacy toolchain assumptions, and any risky files touched in the final summary.

## Safety and gotchas

- No required secret or credential file was identified in the repository scan. If you add integrations later, keep secrets out of git.
- Local examples may omit `ALEXA_SKILL_ID`. AWS Lambda deployments must set a
  non-empty value; runtime initialization fails closed when the function name
  marker is present and the skill ID is missing or blank.
- Routine handler logs avoid raw Alexa request IDs, session IDs, and configured or incoming application IDs.
- Alexa `session.application.applicationId` must be a non-empty string before
  skill-id validation or request dispatch.
- Alexa `request.type` and `intent.name` values must be non-empty strings before dispatch, so crafted objects cannot coerce into valid handler names.
- Alexa `request.timestamp` must be an ISO 8601 UTC string inside the inclusive
  150-second freshness window before authorization or dispatch.
- Unsupported request types and intent names fail with generic, stack-bearing
  `Error` objects and must not be reflected into logs or Lambda failure values.
- Primary and reprompt speech must be non-empty strings or `PlainText`/`SSML`
  option objects before response construction.
- Register sample lifecycle behavior on a subclass-owned lifecycle handler table
  so loading `src/index.js` cannot mutate reusable `AlexaSkill` defaults.
- Alexa events must own an exact `version: "1.0"` protocol field before nested request validation.
- Every Alexa request must own a non-empty string `request.locale` before lifecycle behavior, authorization, or dispatch.
- Unsupported request types are rejected before session-start lifecycle hooks.
- Resolved Alexa request handlers must be callable before session-start lifecycle hooks.
- Only owned Alexa session attributes are preserved. Missing, inherited, or
  malformed values are reset to an empty object before responses are built.
- See `SECURITY.md` for vulnerability reporting and safe research guidance.
- See `VISION.md` for project direction and contribution guardrails.

## Agent workflow

1. Inspect the README, Makefile, manifests, and the files directly related to the request.
2. Make the smallest source or docs change that satisfies the task; avoid generated, vendored, or local-environment files unless required.
3. Run the narrowest useful validation first, then `make check` or the documented package/platform gate when available.
4. If a required SDK, service credential, or external runtime is unavailable, record the skipped command and why.
5. Summarize changed files, commands run, and remaining risks or follow-up validation.
