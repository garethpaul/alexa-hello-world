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
- Permit optional `ALEXA_SKILL_ID` validation for local examples
- Require a non-empty `ALEXA_SKILL_ID` when AWS Lambda runtime markers are
  present so deployed authorization fails closed
- Keep malformed Alexa event failures explicit and locally testable
- Require each event to own application identity fields before authorization
- Require each Alexa session to own a boolean new-session flag before lifecycle
  behavior or request dispatch
- Require each Alexa session to own a non-empty string session ID before
  lifecycle validation, authorization, or dispatch
- Require each Alexa request to own a non-empty string request ID before
  timestamp validation, authorization, or dispatch
- Enforce an inclusive 150-second request timestamp freshness window before
  authorization or dispatch
- Reset malformed Alexa session attributes before building responses
- Dispatch only explicitly declared request handlers
- Dispatch only explicitly declared intent handlers
- Require dispatch keys to be non-empty strings before handler lookup
- Keep common Alexa lifecycle request paths covered by local tests
- Keep routine logs useful without exposing raw Alexa request, session, or
  application identifiers
- Do not reflect unsupported caller-controlled request or intent names into
  Lambda failures or logs
- Return stack-bearing `Error` objects for validation and dispatch failures
- Validate primary and reprompt speech before constructing Alexa responses
- Keep direct-response SSML speak envelopes validated in the shared primary
  and reprompt normalization path
- Keep AWS setup steps explicit for first-time users
- Keep exact-commit Lambda and Alexa integration evidence separate from local
  tests, with unexecuted cloud scenarios recorded explicitly

Next priorities:

- Expand request and response tests for common Alexa launch, lifecycle, and
  intent flows
- Keep Node.js runtime expectations current
- Improve packaging guidance without adding unnecessary tooling
- Make validation failures clear and easy to diagnose
- Execute the non-production integration matrix with sanitized evidence and a
  tested Lambda version rollback

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

The Lambda rejects initialization when `ALEXA_SKILL_ID` is missing or blank,
then rejects requests carrying an unexpected Alexa skill application ID.
Local examples outside Lambda may omit the variable.

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
