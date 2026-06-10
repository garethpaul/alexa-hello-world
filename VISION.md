## Alexa Hello World Vision

This document explains the current state and direction of the project.
Project overview and developer docs: [`README.md`](README.md)

Alexa Hello World is a minimal AWS Lambda sample for an Alexa skill. It shows
how to receive an Alexa request and return a simple "Hello World" response.

The repository should stay small, readable, and useful for learning the shape of
an Alexa Lambda handler. Setup, packaging, and local verification live in
[`README.md`](README.md).

The goal is a dependable starter sample that can be tested locally before being
packaged for AWS Lambda and connected to an Alexa skill.

The current focus is:

Priority:

- Keep the Lambda handler simple enough to understand at a glance
- Preserve local tests with `npm test`
- Keep `make check` and `scripts/check-baseline.sh` green before changes are
  pushed
- Support optional `ALEXA_SKILL_ID` validation for safer deployments
- Treat blank `ALEXA_SKILL_ID` values as unset so misconfigured environments
  remain diagnosable
- Keep malformed Alexa event failures explicit and locally testable
- Require Alexa application IDs to be non-empty strings before dispatch
- Reset malformed Alexa session attributes before building responses
- Dispatch only explicitly declared request handlers
- Dispatch only explicitly declared intent handlers
- Require dispatch keys to be non-empty strings before handler lookup
- Keep common Alexa lifecycle request paths covered by local tests
- Keep routine logs useful without exposing raw Alexa request, session, or
  application identifiers
- Do not reflect unsupported caller-controlled request or intent names into
  Lambda failures or logs
- Keep AWS setup steps explicit for first-time users

Next priorities:

- Expand request and response tests for common Alexa launch, lifecycle, and
  intent flows
- Keep Node.js runtime expectations current
- Improve packaging guidance without adding unnecessary tooling
- Make validation failures clear and easy to diagnose

Contribution rules:

- One PR = one focused sample improvement.
- Run `npm test` and `make check` before pushing code changes.
- Update `scripts/check-baseline.sh` when required files or verification docs
  intentionally change.
- Keep the sample dependency-light; new packages need a clear teaching or
  runtime purpose.
- Update the README whenever setup, packaging, or environment variables change.

## Security

Canonical security policy and reporting:

- [`SECURITY.md`](SECURITY.md)

The Lambda can optionally reject requests from unexpected Alexa skill
application IDs. Deployments should set `ALEXA_SKILL_ID` when they are intended
to serve only one skill.

AWS credentials, Lambda deployment secrets, and skill identifiers that are not
meant to be public should remain in the AWS console, environment variables, or
local deployment tooling rather than this repository.

## What We Will Not Merge (For Now)

- Framework-heavy rewrites that obscure the basic Lambda handler flow
- Production deployment automation that requires committing credentials
- New intents without local tests and README examples
- Runtime changes that make the sample harder to run locally

This list is a roadmap guardrail, not a permanent rule.
Strong user demand and strong technical rationale can change it.
