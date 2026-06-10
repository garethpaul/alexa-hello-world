# alexa-hello-world

<!-- README-OVERVIEW-IMAGE -->

![Project overview](docs/readme-overview.svg)

## Overview

`garethpaul/alexa-hello-world` is a Node.js or JavaScript project. A very basic hello-world sample alexa app.

This README is based on the checked-in source, manifests, scripts, and repository metadata on the `master` branch. The project language mix found during review was: JavaScript (4).

## Repository Contents

- `README.md` - project overview and local usage notes
- `package.json` - JavaScript dependency and script metadata
- `scripts/check-baseline.sh` - repository baseline and local metadata hygiene guard
- `.circleci` - source or example code
- `docs` - source or example code
- `package-lock.json` - JavaScript dependency and script metadata
- `SECURITY.md` - security reporting and disclosure guidance
- `speechAssets` - source or example code
- `src` - source or example code
- `test` - source or example code
- `VISION.md` - project direction and maintenance guardrails

Additional scan context:

- Source directories: .circleci, docs, speechAssets, src, test
- Dependency and build manifests: package-lock.json, package.json
- Entry points or build surfaces: package.json, scripts/check-baseline.sh
- Test-looking files: docs/plans/2026-06-08-alexa-testability-baseline.md, test/handler.test.js

## Getting Started

### Prerequisites

- Git
- Node.js 20.19 or newer and npm

### Setup

```bash
git clone https://github.com/garethpaul/alexa-hello-world.git
cd alexa-hello-world
npm ci
```

The setup commands above are derived from repository files. Legacy mobile, Python, or JavaScript samples may require older SDKs or package versions than a modern workstation uses by default.

## Running or Using the Project

- Inspect `package.json` for available npm scripts before running the project.

Detected npm scripts:

- `npm run build` - `node --check src/AlexaSkill.js && node --check src/index.js`
- `npm run format:check` - `prettier --check .`
- `npm run lint` - `eslint .`
- `npm run test` - `node --test`

## Testing and Verification

- `make check`
- `sh scripts/check-baseline.sh`
- `npm test`
- `make check` runs linting, formatting checks, tests, syntax checks, and the
  scripted repository baseline.
- `sh scripts/check-baseline.sh` verifies required files, npm scripts, Make
  targets, completed plan metadata, README verification notes, and local
  secret/editor ignore hygiene.
- GitHub Actions installs the locked dependency graph with `npm ci` and runs
  the same `make check` gate for pull requests and pushes to `master`.
- CircleCI keeps the equivalent verification job for existing integrations.
- Handler tests cover launch, hello, help, cancel, stop, unsupported-intent,
  inherited intent-name rejection, session-ended, unsupported-request, inherited
  request-type rejection, malformed dispatch-key coercion, malformed-event,
  malformed-intent, and configured application-id rejection flows.
- Malformed Alexa `session.attributes` values are reset to an empty object
  before response session attributes are built.

When the required SDK or runtime is unavailable, use static checks and source review first, then verify on a machine that has the matching platform toolchain.

## Configuration and Secrets

- No required secret or credential file was identified in the repository scan. If you add integrations later, keep secrets out of git.
- Set `ALEXA_SKILL_ID` in deployed environments that should reject requests
  from unexpected Alexa skill application IDs. Values are trimmed; blank values
  are treated as unset.
- Routine handler logs avoid raw Alexa request IDs, session IDs, and configured
  or incoming application IDs.
- Alexa `request.type` and `intent.name` values must be non-empty strings before
  dispatch, so crafted objects cannot coerce into valid handler names.

## Security and Privacy Notes

- Review changes touching authentication or token handling; examples from the scan include docs/plans/2026-06-08-alexa-testability-baseline.md, src/AlexaSkill.js, src/index.js, test/handler.test.js.
- Review changes touching network requests, sockets, or service endpoints; examples from the scan include src/index.js.
- Review changes touching file, media, JSON, XML, CSV, OCR, or data parsing; examples from the scan include .circleci/config.yml, docs/plans/2026-06-08-alexa-testability-baseline.md.
- Review changes touching database, model, or persistence code; examples from the scan include docs/plans/2026-06-08-alexa-testability-baseline.md, src/index.js.
- Review changes touching infrastructure, proxy, cloud, or deployment configuration; examples from the scan include .circleci/config.yml, docs/plans/2026-06-08-alexa-testability-baseline.md.

## Maintenance Notes

- See `SECURITY.md` for vulnerability reporting and safe research guidance.
- See `VISION.md` for project direction and contribution guardrails.
- See `docs/plans/2026-06-08-alexa-check-wrapper.md` for the root
  verification wrapper baseline.
- See `docs/plans/2026-06-09-alexa-event-shape-validation.md` for the
  malformed Alexa event validation contract.
- See `docs/plans/2026-06-09-alexa-session-ended-contract.md` for the
  session-ended lifecycle contract.
- See `docs/plans/2026-06-09-alexa-log-identifier-redaction.md` for the
  log-identifier redaction contract.
- See `docs/plans/2026-06-09-alexa-skill-id-normalization.md` for the optional
  skill-id configuration contract.
- See `docs/plans/2026-06-09-alexa-session-attributes-normalization.md` for
  the session attributes normalization contract.
- See `docs/plans/2026-06-09-alexa-intent-own-property-dispatch.md` for
  intent dispatch own-property guarding.
- See `docs/plans/2026-06-09-alexa-request-own-property-dispatch.md` for
  request-type dispatch own-property guarding.
- See `docs/plans/2026-06-09-alexa-dispatch-key-type-validation.md` for
  dispatch-key string validation.
- See `docs/plans/2026-06-09-scripted-baseline-check.md` for the scripted
  repository baseline guard.

## Contributing

Keep changes small and tied to the project that is already present in this repository. For code changes, document the toolchain used, avoid committing generated dependency directories or local configuration, and update this README when setup or verification steps change.
