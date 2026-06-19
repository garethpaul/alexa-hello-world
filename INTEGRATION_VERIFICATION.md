# Alexa And Lambda Integration Verification

Run this matrix only in an authorized non-production AWS account and Alexa
skill. Repository checks do not prove Lambda, IAM, trigger, developer-console,
or live invocation behavior.

## Evidence Header

Record these values without account IDs, ARNs, skill IDs, request IDs, session
IDs, utterance recordings, raw events, credentials, or CloudWatch payloads:

- commit SHA and pull request
- tester and UTC timestamp
- Node.js runtime and package-lock digest
- Lambda function version or alias and sanitized region
- Alexa skill stage and endpoint linkage
- `npm ci`, `npm test`, and `make check` results

Mark every row `pass`, `fail`, `blocked`, or `not run`. Explain blocked and
unexecuted rows. Do not convert `not run` into passing evidence.

## Lambda Configuration

| Scenario                | Expected result                                               | Result  | Evidence |
| ----------------------- | ------------------------------------------------------------- | ------- | -------- |
| Exact artifact deployed | Lambda version maps to the reviewed commit.                   | not run |          |
| Runtime configured      | Supported Node.js runtime loads the handler.                  | not run |          |
| Skill ID configured     | Non-empty `ALEXA_SKILL_ID` is present.                        | not run |          |
| Trigger restricted      | Alexa trigger is limited to the intended skill ID.            | not run |          |
| IAM least privilege     | Execution role contains only required logging/runtime access. | not run |          |
| Versioned rollback      | Previous known-good Lambda version remains selectable.        | not run |          |

## Invocation Matrix

Use the Alexa developer console or an authorized test device:

| Scenario                      | Expected result                                   | Result  | Evidence |
| ----------------------------- | ------------------------------------------------- | ------- | -------- |
| Launch request                | Returns the documented greeting.                  | not run |          |
| HelloWorld intent             | Returns the documented greeting.                  | not run |          |
| Help intent                   | Returns help speech and reprompt.                 | not run |          |
| Stop and cancel intents       | End the session without an error.                 | not run |          |
| Session ended request         | Completes without speech or a crash.              | not run |          |
| Unsupported request or intent | Fails without reflecting caller-controlled names. | not run |          |

## Rejection Matrix

Using only approved test fixtures, verify rejection of:

- missing or unexpected application IDs;
- missing, inherited, blank, or malformed session and request IDs;
- missing or non-boolean `session.new`;
- stale, future, or malformed timestamps; and
- malformed primary, reprompt, or SSML speech output.

CloudWatch logs must retain generic failure categories and must not contain raw
events, skill IDs, request IDs, session IDs, utterances, exception messages, or
newline-forged caller content.

## Rollback And Completion

On failure, move the test alias or function configuration back to the recorded
known-good version, repeat launch and help invocations, and preserve sanitized
evidence outside git. Record unresolved failures and protected evidence links.
This repository currently records every Lambda and Alexa integration row as
unexecuted.
