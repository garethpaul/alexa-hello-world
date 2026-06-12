# Alexa Speech Output Validation

Status: Completed

## Context

`Response` accepts strings or speech-option objects from subclass handlers and
passes them to `createSpeechObject`. Missing values currently cause an
incidental property-access failure, while unsupported object types or
non-string speech content can produce payloads that do not satisfy Alexa's
`outputSpeech` contract. The sample should fail locally with a clear,
stack-bearing `Error` before invoking `context.succeed` with an invalid
response.

## Prioritized Scope

1. Validate every primary and reprompt speech value before response assembly.
2. Preserve the existing string shorthand for `PlainText` and the explicit
   `{ type: "PlainText" | "SSML", speech: string }` form.
3. Reject missing, blank, non-string, and unsupported speech values with
   generic errors that do not reflect caller-controlled content.
4. Add focused tests that exercise the reusable `AlexaSkill` response path,
   while keeping the Hello World launch, intent, card, and lifecycle behavior
   unchanged.
5. Extend the scripted baseline and project documentation with the response
   validation contract.

## Implementation Units

### Speech Object Validation

Files: `src/AlexaSkill.js`

- Normalize string shorthand into a `PlainText` speech object.
- Require option objects to use only `PlainText` or `SSML`.
- Require non-empty string speech content before returning a response object.
- Use explicit `Error` messages and avoid reflecting invalid values.

### Regression Coverage

Files: `test/handler.test.js`

- Add a small custom `AlexaSkill` harness for response construction tests.
- Cover valid plain text and SSML output.
- Cover missing, blank, non-string, and unsupported primary output.
- Cover invalid reprompt output and verify `context.succeed` is not called.
- Retain all existing handler and security assertions.

### Repository Contracts And Documentation

Files: `scripts/check-baseline.sh`, `README.md`, `SECURITY.md`, `VISION.md`,
`CHANGES.md`

- Require the validation helper, supported speech types, regression tests, and
  completed plan in the baseline.
- Document the fail-closed response contract and maintenance intent.

## Risks

- Existing subclasses that relied on empty or malformed speech values will now
  fail explicitly. This is intentional because those values already produce
  invalid Alexa responses.
- Validation must not reject the string and object forms used by the sample or
  alter session attributes, cards, or `shouldEndSession` behavior.

## Verification

- `npm run lint`
- `npm run format:check`
- `npm test`
- `npm run build`
- `make check`
- `git diff --check`
