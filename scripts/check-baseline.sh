#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
README="$ROOT_DIR/README.md"
SECURITY="$ROOT_DIR/SECURITY.md"
CHANGES="$ROOT_DIR/CHANGES.md"
MAKEFILE="$ROOT_DIR/Makefile"
PACKAGE_JSON="$ROOT_DIR/package.json"
GITIGNORE="$ROOT_DIR/.gitignore"
DOCS_PLANS="$ROOT_DIR/docs/plans"
ALEXA_SKILL="$ROOT_DIR/src/AlexaSkill.js"
INDEX="$ROOT_DIR/src/index.js"

require_file() {
  path=$1
  if [ ! -f "$ROOT_DIR/$path" ]; then
    printf '%s\n' "Required file is missing: $path" >&2
    exit 1
  fi
}

for path in \
  "AGENTS.md" \
  ".circleci/config.yml" \
  ".gitignore" \
  ".prettierignore" \
  ".prettierrc.json" \
  "CHANGES.md" \
  "INTEGRATION_VERIFICATION.md" \
  "Makefile" \
  "README.md" \
  ".github/workflows/check.yml" \
  "SECURITY.md" \
  "VISION.md" \
  "eslint.config.js" \
  "package.json" \
  "package-lock.json" \
  "speechAssets/IntentSchema.json" \
  "speechAssets/SampleUtterances.txt" \
  "src/AlexaSkill.js" \
  "src/index.js" \
  "test/handler.test.js" \
  "docs/plans/2026-06-08-alexa-check-wrapper.md" \
  "docs/plans/2026-06-09-alexa-dispatch-key-type-validation.md" \
  "docs/plans/2026-06-09-scripted-baseline-check.md" \
  "docs/plans/2026-06-12-alexa-speech-output-validation.md" \
  "docs/plans/2026-06-13-alexa-exception-log-redaction.md" \
  "docs/plans/2026-06-13-alexa-lambda-skill-id-required.md" \
  "docs/plans/2026-06-13-alexa-request-id-validation.md" \
  "docs/plans/2026-06-13-alexa-request-timestamp-freshness.md" \
  "docs/plans/2026-06-13-alexa-ssml-speak-envelope.md" \
  "docs/plans/2026-06-14-make-root-override-protection.md" \
  "docs/plans/2026-06-14-alexa-session-new-validation.md" \
  "docs/plans/2026-06-14-alexa-session-id-validation.md" \
  "docs/plans/2026-06-14-alexa-integration-verification-checklist.md" \
  "docs/plans/2026-06-14-alexa-application-identity-ownership.md" \
  "docs/plans/2026-06-14-alexa-request-envelope-ownership.md" \
  "docs/plans/2026-06-14-alexa-async-handler.md" \
  "docs/plans/2026-06-15-alexa-event-handler-ownership.md" \
  "docs/readme-overview.svg" \
  "scripts/check-baseline.sh"; do
  require_file "$path"
done

for async_index_contract in \
  "exports.handler = async function (event, context)" \
  "return helloWorld.execute(event, context);"; do
  if ! grep -Fq "$async_index_contract" "$INDEX"; then
    printf '%s\n' "Lambda entry point must keep async return contract: $async_index_contract" >&2
    exit 1
  fi
done

for async_skill_contract in \
  "AlexaSkill.prototype.execute = async function (event, context)" \
  "await this.eventHandlers.onSessionStarted" \
  "return await requestHandler.call" \
  "throw e;"; do
  if ! grep -Fq "$async_skill_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill must keep promise completion contract: $async_skill_contract" >&2
    exit 1
  fi
done

if [ "$(grep -Fc "return buildSpeechletResponse" "$ALEXA_SKILL")" -ne 4 ]; then
  printf '%s\n' "All four Alexa response helpers must return their response payload." >&2
  exit 1
fi

if grep -Eq 'context\.(succeed|fail)' "$ROOT_DIR/src/AlexaSkill.js" "$INDEX"; then
  printf '%s\n' "Runtime source must not restore legacy Lambda context completion." >&2
  exit 1
fi

for async_test_contract in \
  "Lambda handler resolves through its returned promise" \
  "Lambda handler rejects through its returned promise" \
  "AlexaSkill awaits asynchronous lifecycle handlers before dispatch" \
  "AlexaSkill preserves Lambda context for custom request handlers"; do
  if ! grep -Fq "$async_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep async Lambda contract: $async_test_contract" >&2
    exit 1
  fi
done

for async_doc_contract in \
  "$README|promise-returning Lambda handler" \
  "$SECURITY|promise-returning Lambda handler" \
  "$ROOT_DIR/VISION.md|promise-returning Lambda handler" \
  "$CHANGES|promise-returning Lambda"; do
  async_doc=${async_doc_contract%%|*}
  async_text=${async_doc_contract#*|}
  if ! grep -Fq "$async_text" "$async_doc"; then
    printf '%s\n' "$async_doc must document async Lambda completion." >&2
    exit 1
  fi
done

for async_plan_contract in \
  "status: completed" \
  "make check" \
  "hostile mutations" \
  "No live Lambda or Alexa invocation was performed"; do
  if ! grep -Fqi "$async_plan_contract" \
    "$DOCS_PLANS/2026-06-14-alexa-async-handler.md"; then
    printf '%s\n' "Async Lambda plan must keep completion evidence: $async_plan_contract" >&2
    exit 1
  fi
done

for event_handler_ownership_contract in \
  "HelloWorld.prototype.eventHandlers = Object.create(" \
  "AlexaSkill.prototype.eventHandlers"; do
  if ! grep -Fq "$event_handler_ownership_contract" "$INDEX"; then
    printf '%s\n' "HelloWorld must own its lifecycle handler table: $event_handler_ownership_contract" >&2
    exit 1
  fi
done

event_handler_table_line=$(grep -nF "HelloWorld.prototype.eventHandlers = Object.create(" "$INDEX" | head -n 1 | cut -d: -f1)
event_handler_registration_line=$(grep -nF "HelloWorld.prototype.eventHandlers.onSessionStarted" "$INDEX" | head -n 1 | cut -d: -f1)
if [ -z "$event_handler_table_line" ] || [ -z "$event_handler_registration_line" ] || \
   [ "$event_handler_table_line" -ge "$event_handler_registration_line" ]; then
  printf '%s\n' "HelloWorld must establish lifecycle handler ownership before registration." >&2
  exit 1
fi

for event_handler_ownership_test_contract in \
  "sample lifecycle handlers do not mutate the AlexaSkill prototype" \
  "assert.equal(AlexaSkill.prototype.eventHandlers, baseEventHandlers)" \
  "baseLifecycleHandlers.onSessionStarted"; do
  if ! grep -Fq "$event_handler_ownership_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must preserve lifecycle table ownership: $event_handler_ownership_test_contract" >&2
    exit 1
  fi
done

for event_handler_ownership_document in \
  "$ROOT_DIR/AGENTS.md" \
  "$README" \
  "$SECURITY" \
  "$ROOT_DIR/VISION.md" \
  "$CHANGES"; do
  if ! grep -Fq "subclass-owned lifecycle handler table" "$event_handler_ownership_document"; then
    printf '%s\n' "$event_handler_ownership_document must document lifecycle handler ownership." >&2
    exit 1
  fi
done

for event_handler_ownership_plan_contract in \
  "status: completed" \
  "make check" \
  "hostile mutations" \
  "No live Lambda or Alexa invocation was performed"; do
  if ! grep -Fqi "$event_handler_ownership_plan_contract" \
    "$DOCS_PLANS/2026-06-15-alexa-event-handler-ownership.md"; then
    printf '%s\n' "Event-handler ownership plan must keep completion evidence: $event_handler_ownership_plan_contract" >&2
    exit 1
  fi
done

for request_envelope_contract in \
  "!hasOwn(event, 'request')" \
  "Invalid Alexa event: missing request.type"; do
  if ! grep -Fq "$request_envelope_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill must keep request envelope ownership: $request_envelope_contract" >&2
    exit 1
  fi
done

request_envelope_line=$(grep -nF "!hasOwn(event, 'request')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
request_type_line=$(grep -nF "hasOwn(event.request, 'type')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
if [ -z "$request_envelope_line" ] || [ -z "$request_type_line" ] || \
   [ "$request_envelope_line" -ge "$request_type_line" ]; then
  printf '%s\n' "AlexaSkill must validate request envelope ownership before nested request fields." >&2
  exit 1
fi

for request_envelope_test_contract in \
  "Alexa events require their own request envelope" \
  "Object.create({ request: inheritedRequest })" \
  "Invalid Alexa event: missing request.type"; do
  if ! grep -Fq "$request_envelope_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep request envelope ownership: $request_envelope_test_contract" >&2
    exit 1
  fi
done

for request_envelope_document in \
  "$README" \
  "$SECURITY" \
  "$ROOT_DIR/VISION.md" \
  "$CHANGES"; do
  if ! grep -Fq "own request envelope" "$request_envelope_document"; then
    printf '%s\n' "$request_envelope_document must document own request envelope validation." >&2
    exit 1
  fi
done

for request_envelope_plan_contract in \
  "status: completed" \
  "make check" \
  "mutations"; do
  if ! grep -Fqi "$request_envelope_plan_contract" \
    "$DOCS_PLANS/2026-06-14-alexa-request-envelope-ownership.md"; then
    printf '%s\n' "Request envelope plan must keep completion evidence: $request_envelope_plan_contract" >&2
    exit 1
  fi
done

for application_identity_contract in \
  "hasOwn(event, 'session')" \
  "hasOwn(event.session, 'application')" \
  "hasOwn(event.session.application, 'applicationId')" \
  "Invalid Alexa event: missing session.application.applicationId"; do
  if ! grep -Fq "$application_identity_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill must keep application identity ownership: $application_identity_contract" >&2
    exit 1
  fi
done

application_identity_line=$(grep -nF "hasOwn(event, 'session')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
request_id_line=$(grep -nF "hasOwn(event.request, 'requestId')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
if [ -z "$application_identity_line" ] || [ -z "$request_id_line" ] || \
   [ "$application_identity_line" -ge "$request_id_line" ]; then
  printf '%s\n' "AlexaSkill must validate application identity ownership before request metadata." >&2
  exit 1
fi

for application_identity_test_contract in \
  "Alexa application identity fields must be own properties" \
  "Object.create({ session: validSession })" \
  "application: { applicationId: inheritedIdentity }" \
  "applicationId: inheritedIdentity" \
  "assert.doesNotMatch(logText, /forged-inherited/)"; do
  if ! grep -Fq "$application_identity_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep application identity ownership: $application_identity_test_contract" >&2
    exit 1
  fi
done

for application_identity_document in \
  "$README" \
  "$SECURITY" \
  "$ROOT_DIR/VISION.md" \
  "$CHANGES"; do
  if ! grep -Fq "own application identity" "$application_identity_document"; then
    printf '%s\n' "$application_identity_document must document own application identity fields." >&2
    exit 1
  fi
done

for application_identity_plan_contract in \
  "Status: Completed" \
  "make check" \
  "mutations"; do
  if ! grep -Fqi "$application_identity_plan_contract" \
    "$DOCS_PLANS/2026-06-14-alexa-application-identity-ownership.md"; then
    printf '%s\n' "Application identity plan must keep completion evidence: $application_identity_plan_contract" >&2
    exit 1
  fi
done

for integration_contract in \
  'commit SHA and pull request' \
  'ALEXA_SKILL_ID' \
  'Trigger restricted' \
  'Launch request' \
  'Session ended request' \
  'stale, future, or malformed timestamps' \
  'Do not convert `not run` into passing evidence.' \
  'request IDs, session IDs, utterances' \
  'known-good version' \
  'every Lambda and Alexa integration row as' \
  'unexecuted'; do
  if ! grep -Fq "$integration_contract" "$ROOT_DIR/INTEGRATION_VERIFICATION.md"; then
    printf '%s\n' "Integration checklist must keep contract: $integration_contract" >&2
    exit 1
  fi
done

if ! grep -Fq 'INTEGRATION_VERIFICATION.md' "$README" || \
   ! grep -Fq 'explicit unexecuted results' "$README" || \
   ! grep -Fqi 'integration matrix' "$ROOT_DIR/VISION.md" || \
   ! grep -Fq 'every cloud row explicitly unexecuted' "$CHANGES"; then
  printf '%s\n' 'Repository guidance must document the unexecuted Alexa integration matrix.' >&2
  exit 1
fi

for integration_plan_contract in \
  'Status: Completed' \
  'make check' \
  'hostile mutations' \
  'No Lambda, IAM, Alexa developer-console, trigger, or live invocation scenario was executed'; do
  if ! grep -Fq "$integration_plan_contract" \
    "$DOCS_PLANS/2026-06-14-alexa-integration-verification-checklist.md"; then
    printf '%s\n' "Integration plan must preserve completion evidence: $integration_plan_contract" >&2
    exit 1
  fi
done

for session_id_contract in \
  "hasOwn(event.session, 'sessionId')" \
  "isNonEmptyString(event.session.sessionId)" \
  "Invalid Alexa event: missing session.sessionId" \
  "Invalid Alexa event: session.sessionId must be a non-empty string"; do
  if ! grep -Fq "$session_id_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill must keep session ID contract: $session_id_contract" >&2
    exit 1
  fi
done

session_id_line=$(grep -nF "hasOwn(event.session, 'sessionId')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
session_new_line=$(grep -nF "hasOwn(event.session, 'new')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
authorization_line=$(grep -nF "event.session.application.applicationId !== this._appId" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
if [ -z "$session_id_line" ] || [ -z "$session_new_line" ] || [ -z "$authorization_line" ] ||
   [ "$session_id_line" -ge "$session_new_line" ] ||
   [ "$session_id_line" -ge "$authorization_line" ]; then
  printf '%s\n' "AlexaSkill must validate session ID shape before lifecycle and application ID authorization." >&2
  exit 1
fi

for session_id_test_contract in \
  "Alexa sessions require their own session ID" \
  "Alexa session IDs must be non-empty strings" \
  "session ID failures do not reflect caller input into logs or failures" \
  "session ID shape is validated before lifecycle and application authorization"; do
  if ! grep -Fq "$session_id_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep session ID contract: $session_id_test_contract" >&2
    exit 1
  fi
done

for session_id_doc_contract in \
  "$README|own non-empty string \`sessionId\`" \
  "$SECURITY|own non-empty string \`session.sessionId\`" \
  "$ROOT_DIR/VISION.md|Require each Alexa session to own a non-empty string session ID" \
  "$CHANGES|own non-empty string \`sessionId\`"; do
  session_id_doc=${session_id_doc_contract%%|*}
  session_id_text=${session_id_doc_contract#*|}
  if ! grep -Fq "$session_id_text" "$session_id_doc"; then
    printf '%s\n' "$session_id_doc must document session ID validation." >&2
    exit 1
  fi
done

if ! grep -Fq "Status: Completed" "$DOCS_PLANS/2026-06-14-alexa-session-id-validation.md"; then
  printf '%s\n' "Alexa session ID validation plan must record completed status." >&2
  exit 1
fi

for deployment_contract in \
  "function requiredSkillId(value, lambdaFunctionName)" \
  "process.env.AWS_LAMBDA_FUNCTION_NAME" \
  "ALEXA_SKILL_ID must be configured in AWS Lambda" \
  "exports.requiredSkillId = requiredSkillId"; do
  if ! grep -Fq "$deployment_contract" "$ROOT_DIR/src/index.js"; then
    printf '%s\n' "Lambda skill-ID enforcement must keep contract: $deployment_contract" >&2
    exit 1
  fi
done

for deployment_test in \
  "local module loading permits a missing Alexa skill id" \
  "Lambda requires a non-empty Alexa skill id" \
  "Lambda module loading fails before exporting an unguarded handler" \
  "Lambda module loading accepts a configured trimmed Alexa skill id"; do
  if ! grep -Fq "$deployment_test" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep deployment configuration case: $deployment_test" >&2
    exit 1
  fi
done

for deployment_document in \
  "$ROOT_DIR/AGENTS.md" \
  "$README" \
  "$SECURITY" \
  "$ROOT_DIR/VISION.md" \
  "$CHANGES"; do
  if ! grep -Fq "AWS Lambda" "$deployment_document" ||
     ! grep -Fq "ALEXA_SKILL_ID" "$deployment_document"; then
    printf '%s\n' "$deployment_document must document deployed Alexa skill-ID enforcement." >&2
    exit 1
  fi
done

for speech_contract in \
  "function normalizeSpeechOutput(optionsParam)" \
  "function hasSsmlSpeakEnvelope(speech)" \
  "trimmedSpeech.match(/^<speak" \
  "trimmedSpeech.endsWith('</speak>')" \
  "return !/<\\/?speak(?:\\s|>)/.test(body)" \
  "Invalid speech output: expected a string or options object" \
  "Invalid speech output: type must be PlainText or SSML" \
  "Invalid speech output: speech must be a non-empty string" \
  "Invalid speech output: SSML must use a speak envelope" \
  "!hasSsmlSpeakEnvelope(speech)"; do
  if ! grep -Fq "$speech_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "Alexa speech output validation must keep contract: $speech_contract" >&2
    exit 1
  fi
done

for response_test in \
  "response helper accepts explicit PlainText and SSML speech" \
  "SSML speech accepts a trimmed speak envelope with opening attributes" \
  "deceptive speak opening prefix" \
  "deceptive speak closing prefix" \
  "invalid SSML reprompt fails through the shared envelope validation" \
  "missing reprompt speech fails before returning an Alexa response" \
  "blank reprompt speech fails before returning an Alexa response"; do
  if ! grep -Fq "$response_test" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep response validation case: $response_test" >&2
    exit 1
  fi
done

WORKFLOW="$ROOT_DIR/.github/workflows/check.yml"

for workflow_contract in \
  "permissions:" \
  "contents: read" \
  "runs-on: ubuntu-24.04" \
  "cancel-in-progress: true" \
  "timeout-minutes: 10" \
  "actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10" \
  "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e" \
  "persist-credentials: false" \
  "node-version: [20, 22, 24]" \
  "node-version: \${{ matrix.node-version }}" \
  "workflow_dispatch:" \
  "cache: npm" \
  "run: npm ci" \
  "run: make check"; do
  if ! grep -Fq "$workflow_contract" "$WORKFLOW"; then
    printf '%s\n' "GitHub Actions workflow must keep contract: $workflow_contract" >&2
    exit 1
  fi
done

if grep -Fq "pull_request_target:" "$WORKFLOW"; then
  printf '%s\n' "GitHub Actions workflow must not use pull_request_target." >&2
  exit 1
fi

for trigger in "pull_request:" "push:"; do
  if ! grep -Fq "$trigger" "$WORKFLOW"; then
    printf '%s\n' "GitHub Actions workflow must keep trigger: $trigger" >&2
    exit 1
  fi
done

if grep -Eq '^[[:space:]]+[[:alnum:]_-]+:[[:space:]]*write([[:space:]]|$)' "$WORKFLOW" ||
  grep -Eq '^[[:space:]]+id-token:' "$WORKFLOW"; then
  printf '%s\n' "GitHub Actions workflow must not grant write or OIDC permissions." >&2
  exit 1
fi

action_uses=$(sed -n \
  -e 's/^[[:space:]]*uses:[[:space:]]*\([^[:space:]#]*\).*/\1/p' \
  -e 's/^[[:space:]]*-[[:space:]]*uses:[[:space:]]*\([^[:space:]#]*\).*/\1/p' \
  "$WORKFLOW")
expected_action_uses=$(printf '%s\n' \
  "actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10" \
  "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e")
if [ "$action_uses" != "$expected_action_uses" ]; then
  printf '%s\n' "GitHub Actions workflow must use only the reviewed pinned actions." >&2
  exit 1
fi

if ! grep -Fq "![Project overview](docs/readme-overview.svg)" "$README"; then
  printf '%s\n' "README must embed the project overview artwork." >&2
  exit 1
fi

for svg_contract in "<svg" "viewBox=" "</svg>"; do
  if ! grep -Fq "$svg_contract" "$ROOT_DIR/docs/readme-overview.svg"; then
    printf '%s\n' "README overview must keep SVG contract: $svg_contract" >&2
    exit 1
  fi
done

if ! grep -Fxq 'override ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))' "$MAKEFILE"; then
  printf '%s\n' "Makefile must protect repository paths from command-line overrides." >&2
  exit 1
fi
if ! grep -Fxq 'NPM ?= npm' "$MAKEFILE"; then
  printf '%s\n' "Makefile must preserve the npm command override." >&2
  exit 1
fi
if [ "$(grep -Fc 'cd $(ROOT) && $(NPM)' "$MAKEFILE")" -ne 4 ]; then
  printf '%s\n' "All four npm commands must execute from the repository root." >&2
  exit 1
fi
make_tab=$(printf '\t')
if ! grep -Fxq "${make_tab}sh \$(ROOT)scripts/check-baseline.sh" "$MAKEFILE"; then
  printf '%s\n' "Makefile must run the rooted baseline script from make check." >&2
  exit 1
fi

for target in "lint:" "test:" "build:" "verify:" "check:"; do
  if ! grep -Fq "$target" "$MAKEFILE"; then
    printf '%s\n' "Makefile must expose the $target gate." >&2
    exit 1
  fi
done

for dispatch_failure in \
  "throw new Error('Unsupported intent');" \
  "throw new Error('Unsupported request type');"; do
  if ! grep -Fq "$dispatch_failure" "$ALEXA_SKILL"; then
    printf '%s\n' "Alexa dispatch must keep generic failure: $dispatch_failure" >&2
    exit 1
  fi
done

if grep -Fq "throw '" "$ALEXA_SKILL"; then
  printf '%s\n' "AlexaSkill failures must use Error objects, not string throws." >&2
  exit 1
fi

if ! grep -Fq "result.error instanceof Error" "$ROOT_DIR/test/handler.test.js"; then
  printf '%s\n' "Handler tests must require stack-bearing Error failures." >&2
  exit 1
fi

if [ "$(grep -Fc "console.log('Alexa request failed');" "$ALEXA_SKILL")" -ne 1 ]; then
  printf '%s\n' "AlexaSkill must keep exactly one generic top-level request failure log." >&2
  exit 1
fi
if [ "$(grep -Fc "throw e;" "$ALEXA_SKILL")" -ne 1 ]; then
  printf '%s\n' "AlexaSkill must rethrow the caught Error exactly once for promise rejection." >&2
  exit 1
fi
for reflected_exception in \
  "'Unexpected exception ' + e" \
  ' + e' \
  'e.message' \
  'e.stack' \
  'String(e)' \
  'JSON.stringify(e)' \
  'console.log(e' \
  'console.error(e' \
  '${e}'; do
  if grep -Fq "$reflected_exception" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill logs must not include exception-derived text: $reflected_exception" >&2
    exit 1
  fi
done
for exception_test_contract in \
  "handler exceptions retain failure details without reflecting them into logs" \
  "assert.equal(result.error, sensitiveError);" \
  "assert.doesNotMatch(logText, /private handler detail/);" \
  "assert.doesNotMatch(logText, /forged-exception-log/);"; do
  if ! grep -Fq "$exception_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep exception log-redaction contract: $exception_test_contract" >&2
    exit 1
  fi
done

for exception_doc_contract in \
  "$README|Top-level handler failures use a generic log message" \
  "$SECURITY|Top-level Alexa execution logs must remain generic" \
  "$CHANGES|exception-derived top-level Alexa logs with a stable generic failure"; do
  exception_doc=${exception_doc_contract%%|*}
  exception_contract=${exception_doc_contract#*|}
  if ! grep -Fq "$exception_contract" "$exception_doc"; then
    printf '%s\n' "$exception_doc must keep exception log-redaction guidance: $exception_contract" >&2
    exit 1
  fi
done

for reflected_failure in \
  "Unsupported intent =" \
  "Unsupported request type ="; do
  if grep -Fq "$reflected_failure" "$ALEXA_SKILL"; then
    printf '%s\n' "Alexa dispatch must not reflect caller input via: $reflected_failure" >&2
    exit 1
  fi
done

for session_new_contract in \
  "hasOwn(event.session, 'new')" \
  "typeof event.session.new !== 'boolean'" \
  "Invalid Alexa event: missing session.new" \
  "Invalid Alexa event: session.new must be a boolean"; do
  if ! grep -Fq "$session_new_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill must keep session.new contract: $session_new_contract" >&2
    exit 1
  fi
done

session_new_line=$(grep -nF "hasOwn(event.session, 'new')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
request_type_line=$(grep -nF "hasOwn(event.request, 'type')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
authorization_line=$(grep -nF "event.session.application.applicationId !== this._appId" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
if [ -z "$session_new_line" ] || [ -z "$request_type_line" ] || [ -z "$authorization_line" ] ||
   [ "$session_new_line" -ge "$request_type_line" ] ||
   [ "$session_new_line" -ge "$authorization_line" ]; then
  printf '%s\n' "AlexaSkill must validate session.new before request dispatch and application ID authorization." >&2
  exit 1
fi

for session_new_test_contract in \
  "Alexa sessions require their own new-session flag" \
  "Alexa session new flags must be booleans" \
  "false session new flags skip session-start lifecycle only" \
  "session new shape is validated before request and application authorization"; do
  if ! grep -Fq "$session_new_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep session.new contract: $session_new_test_contract" >&2
    exit 1
  fi
done

for session_new_doc_contract in \
  "$README|own boolean \`session.new\`" \
  "$SECURITY|own boolean \`session.new\`" \
  "$ROOT_DIR/VISION.md|Require each Alexa session to own a boolean new-session flag" \
  "$CHANGES|own boolean \`session.new\`"; do
  session_new_doc=${session_new_doc_contract%%|*}
  session_new_contract=${session_new_doc_contract#*|}
  if ! grep -Fq "$session_new_contract" "$session_new_doc"; then
    printf '%s\n' "$session_new_doc must document session.new validation." >&2
    exit 1
  fi
done

for request_id_contract in \
  "hasOwn(event.request, 'requestId')" \
  "isNonEmptyString(event.request.requestId)" \
  "Invalid Alexa event: missing request.requestId" \
  "Invalid Alexa event: request.requestId must be a non-empty string"; do
  if ! grep -Fq "$request_id_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill must keep request ID contract: $request_id_contract" >&2
    exit 1
  fi
done

request_id_line=$(grep -nF "hasOwn(event.request, 'requestId')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
timestamp_line=$(grep -nF "hasOwn(event.request, 'timestamp')" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
authorization_line=$(grep -nF "event.session.application.applicationId !== this._appId" "$ALEXA_SKILL" | head -n 1 | cut -d: -f1)
if [ -z "$request_id_line" ] || [ -z "$timestamp_line" ] || [ -z "$authorization_line" ] ||
   [ "$request_id_line" -ge "$timestamp_line" ] ||
   [ "$request_id_line" -ge "$authorization_line" ]; then
  printf '%s\n' "AlexaSkill must validate request ID shape before timestamp freshness and application ID authorization." >&2
  exit 1
fi

for request_id_test_contract in \
  "Alexa requests require their own request ID" \
  "Alexa request IDs must be non-empty strings" \
  "inherited Alexa request IDs are rejected" \
  "request ID failures do not reflect caller input into logs or failures" \
  "request ID shape is validated before timestamp and application id authorization"; do
  if ! grep -Fq "$request_id_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep request ID contract: $request_id_test_contract" >&2
    exit 1
  fi
done

for request_id_doc_contract in \
  "$README|own non-empty string \`requestId\`" \
  "$SECURITY|own non-empty string \`request.requestId\`" \
  "$ROOT_DIR/VISION.md|Require each Alexa request to own a non-empty string request ID" \
  "$CHANGES|own non-empty string \`requestId\`"; do
  request_id_doc=${request_id_doc_contract%%|*}
  request_id_contract=${request_id_doc_contract#*|}
  if ! grep -Fq "$request_id_contract" "$request_id_doc"; then
    printf '%s\n' "$request_id_doc must document request ID validation." >&2
    exit 1
  fi
done

for timestamp_contract in \
  "var REQUEST_TIMESTAMP_TOLERANCE_MS = 150 * 1000;" \
  "var ISO_8601_UTC_PATTERN =" \
  "Math.abs(nowMilliseconds - requestTimestamp)" \
  "validateEvent(event, this._now());"; do
  if ! grep -Fq "$timestamp_contract" "$ALEXA_SKILL"; then
    printf '%s\n' "AlexaSkill must keep request timestamp contract: $timestamp_contract" >&2
    exit 1
  fi
done

if ! awk '
  /Math\.abs\(nowMilliseconds - requestTimestamp\) >$/ {
    getline
    if ($0 ~ /^[[:space:]]+REQUEST_TIMESTAMP_TOLERANCE_MS$/) {
      found = 1
    }
  }
  END { exit(found ? 0 : 1) }
' "$ALEXA_SKILL"; then
  printf '%s\n' "AlexaSkill must keep an inclusive timestamp freshness boundary." >&2
  exit 1
fi

for timestamp_test_contract in \
  "Alexa requests require a timestamp" \
  "Alexa request timestamps must be valid ISO 8601 UTC values" \
  "Alexa request timestamps accept fractional-second precision" \
  "Alexa request timestamps accept both 150-second freshness boundaries" \
  "Alexa request timestamps reject stale and excessive future values" \
  "timestamp failures do not reflect caller input into logs or failures" \
  "timestamp freshness is validated before application id authorization"; do
  if ! grep -Fq "$timestamp_test_contract" "$ROOT_DIR/test/handler.test.js"; then
    printf '%s\n' "Handler tests must keep request timestamp contract: $timestamp_test_contract" >&2
    exit 1
  fi
done

for timestamp_doc_contract in \
  "$README|150-second freshness window" \
  "$SECURITY|150-second freshness window" \
  "$ROOT_DIR/VISION.md|150-second request timestamp freshness window" \
  "$CHANGES|150-second freshness window"; do
  timestamp_doc=${timestamp_doc_contract%%|*}
  timestamp_contract=${timestamp_doc_contract#*|}
  if ! grep -Fq "$timestamp_contract" "$timestamp_doc"; then
    printf '%s\n' "$timestamp_doc must document request timestamp freshness." >&2
    exit 1
  fi
done

for package_contract in \
  '"type": "commonjs"' \
  '"node": ">=20.19"' \
  '"lint": "eslint ."' \
  '"format:check": "prettier --check ."' \
  '"test": "node --test"' \
  '"build": "node --check src/AlexaSkill.js && node --check src/index.js"'; do
  if ! grep -Fq "$package_contract" "$PACKAGE_JSON"; then
    printf '%s\n' "package.json must keep contract: $package_contract" >&2
    exit 1
  fi
done

for documented in \
  "ALEXA_SKILL_ID" \
  "Node.js 20.19" \
  "npm ci" \
  "GitHub Actions" \
  "make check" \
  "npm test" \
  "sh scripts/check-baseline.sh" \
  "scripts/check-baseline.sh"; do
  if ! grep -Fq "$documented" "$README"; then
    printf '%s\n' "README must document $documented." >&2
    exit 1
  fi
done

for ignored in "node_modules/" "coverage/" "npm-debug.log*" ".env" ".env.*" ".vscode/" ".idea/" "*.iml"; do
  if ! grep -Fq "$ignored" "$GITIGNORE"; then
    printf '%s\n' ".gitignore must include $ignored" >&2
    exit 1
  fi
done

tracked_local=$(git -C "$ROOT_DIR" ls-files '.env' '.env.*' '.idea' '.vscode' '*.iml' || true)
if [ -n "$tracked_local" ]; then
  printf '%s\n%s\n' "Local secrets or editor metadata must not be tracked:" "$tracked_local" >&2
  exit 1
fi

found_plan=0
for plan in "$DOCS_PLANS"/*.md; do
  [ -e "$plan" ] || continue
  found_plan=1
  if ! grep -Eiq '^(##[[:space:]]+)?status:[[:space:]]+completed[[:space:]]*$' "$plan"; then
    printf '%s\n' "$plan must record completed status." >&2
    exit 1
  fi
  if ! grep -iq "verification" "$plan"; then
    printf '%s\n' "$plan must document verification." >&2
    exit 1
  fi
done

if [ "$found_plan" -eq 0 ]; then
  printf '%s\n' "docs/plans must contain completed markdown plans." >&2
  exit 1
fi

for plan in \
  "$DOCS_PLANS/2026-06-08-alexa-check-wrapper.md" \
  "$DOCS_PLANS/2026-06-09-alexa-dispatch-key-type-validation.md" \
  "$DOCS_PLANS/2026-06-09-scripted-baseline-check.md" \
  "$DOCS_PLANS/2026-06-13-alexa-exception-log-redaction.md" \
  "$DOCS_PLANS/2026-06-13-alexa-lambda-skill-id-required.md" \
  "$DOCS_PLANS/2026-06-13-alexa-request-id-validation.md" \
  "$DOCS_PLANS/2026-06-13-alexa-request-timestamp-freshness.md" \
  "$DOCS_PLANS/2026-06-13-alexa-ssml-speak-envelope.md" \
  "$DOCS_PLANS/2026-06-14-alexa-session-new-validation.md" \
  "$DOCS_PLANS/2026-06-14-alexa-session-id-validation.md"; do
  if ! grep -Fq "make check" "$plan"; then
    printf '%s\n' "$plan must document make check verification." >&2
    exit 1
  fi
done

if ! grep -Fq "hostile mutations" "$DOCS_PLANS/2026-06-13-alexa-exception-log-redaction.md"; then
  printf '%s\n' "Alexa exception log-redaction plan must record hostile mutations." >&2
  exit 1
fi

if ! grep -Fq "hostile mutations" "$DOCS_PLANS/2026-06-13-alexa-lambda-skill-id-required.md"; then
  printf '%s\n' "Lambda skill-ID plan must document hostile mutations." >&2
  exit 1
fi

if ! grep -Fq "hostile mutations" "$DOCS_PLANS/2026-06-13-alexa-ssml-speak-envelope.md"; then
  printf '%s\n' "Alexa SSML envelope plan must document hostile mutations." >&2
  exit 1
fi

if ! grep -Fq "hostile mutations" "$DOCS_PLANS/2026-06-13-alexa-request-timestamp-freshness.md"; then
  printf '%s\n' "Alexa timestamp freshness plan must document hostile mutations." >&2
  exit 1
fi

if ! grep -Fq "hostile mutations" "$DOCS_PLANS/2026-06-13-alexa-request-id-validation.md"; then
  printf '%s\n' "Alexa request-ID plan must document hostile mutations." >&2
  exit 1
fi

for ssml_doc_contract in \
  "$README|<speak>\` envelope" \
  "$SECURITY|SSML envelope" \
  "$ROOT_DIR/VISION.md|SSML speak envelopes" \
  "$CHANGES|SSML output"; do
  ssml_doc=${ssml_doc_contract%%|*}
  ssml_contract=${ssml_doc_contract#*|}
  if ! grep -Fq "$ssml_contract" "$ssml_doc"; then
    printf '%s\n' "$ssml_doc must document SSML speak-envelope validation." >&2
    exit 1
  fi
done

printf '%s\n' "Alexa Hello World baseline checks passed."
