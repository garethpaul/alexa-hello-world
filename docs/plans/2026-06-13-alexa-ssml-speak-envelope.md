# Alexa SSML Speak Envelope

Status: Completed

## Context

The response helper validates that `SSML` speech is a non-empty string but
does not require the outer `<speak>` element expected by Alexa's direct JSON
response format. Malformed SSML such as `<emphasis>Hello</emphasis>` can pass
local validation and fail only after the Lambda returns it to Alexa.

## Requirements

- Require trimmed `SSML` speech to start with a `<speak>` opening tag and end
  with `</speak>` before response construction.
- Accept attributes or whitespace in the opening `<speak ...>` tag.
- Reject plain text mislabeled as SSML, alternate root elements, missing close
  tags, and deceptive `<speaker>` prefixes.
- Apply the same rule to primary output and reprompt speech through the shared
  normalization path.
- Preserve string and explicit `PlainText` output, supported SSML payloads,
  generic failure messages, session behavior, and response shape.
- Add mutation-sensitive tests, static contracts, documentation, and truthful
  verification evidence.

## Implementation Units

### U1: Validate The SSML Envelope

**File:** `src/AlexaSkill.js`

Add a small envelope predicate over trimmed speech and reject invalid SSML in
`normalizeSpeechOutput` after type/content validation but before building the
Alexa response. Do not introduce an XML parser or rewrite caller content.

### U2: Add Behavioral And Static Coverage

**Files:** `test/handler.test.js`, `scripts/check-baseline.sh`

Cover valid basic/attributed envelopes, invalid roots, missing closing tags,
plain-text mislabeling, deceptive prefixes, reprompt validation, and the stable
generic error contract. Require the completed plan and implementation markers.

### U3: Document And Verify

**Files:** `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`, this plan

Document the direct-response SSML boundary. Run focused tests and hostile
mutations, the full locked dependency gate, external-directory verification,
audit/diff/artifact/secret scans, and exact-head hosted checks.

## Scope Boundaries

- Do not implement full XML parsing, supported-tag validation, response-size
  limits, escaping, or ASK SDK migration in this unit.
- Do not alter intent dispatch, application-ID authorization, Lambda
  configuration, logging, cards, or session attributes.
- Do not claim live Alexa, Lambda, IAM, or CloudWatch validation.

## Verification Plan

- Run focused `node --test` cases for primary and reprompt SSML envelopes.
- Prove hostile mutations covering the opening tag, closing tag, single-root
  delimiter, shared normalizer, tests, docs, and completed-plan status fail.
- Run `make check` locally and in an isolated external directory with the
  locked dependency tree.
- Run `npm audit --omit=dev`, `git diff --check`, generated-artifact inspection,
  and credential-shaped added-line scans.
- Record hosted evidence only after querying the exact pushed head.

## Sources

- Amazon Alexa Skills Kit, Speech Synthesis Markup Language Reference:
  https://developer.amazon.com/en-US/docs/custom-skills/speech-synthesis-markup-language-ssml-reference.html
- Amazon Alexa Skills Kit, Request and Response JSON Reference:
  https://www.developer.amazon.com/docs/custom-skills/request-and-response-json-reference.html

## Verification

- The focused runtime suite passed after a hostile multi-root case exposed and
  drove a fix for a permissive first-to-last-tag regex.
- All 44 handler tests pass, including valid basic/attributed envelopes,
  deceptive opening and closing prefixes, alternate roots, missing closing
  tags, multiple roots, and invalid reprompts.
- Nine focused hostile mutations were rejected across opening, closing,
  single-root, shared-normalizer, stable-error, reprompt-test, guidance, and
  completed-plan contracts.
- Local and isolated external-directory `npm ci` plus `make check` passed
  ESLint, Prettier, all 44 tests, Node syntax builds, and the portable baseline.
- `npm audit --omit=dev` reported zero vulnerabilities. The external baseline
  emitted only its expected non-git tracked-file probe warning.
- `git diff --check`, generated-artifact inspection, and credential-shaped
  added-line scans passed. Hosted exact-head evidence remains pending push.
