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
  "docs/plans/2026-06-13-alexa-ssml-speak-envelope.md" \
  "docs/readme-overview.svg" \
  "scripts/check-baseline.sh"; do
  require_file "$path"
done

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

if ! grep -Fq 'ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))' "$MAKEFILE"; then
  printf '%s\n' "Makefile must resolve repository paths from its own location." >&2
  exit 1
fi
if ! grep -Fq "scripts/check-baseline.sh" "$MAKEFILE"; then
  printf '%s\n' "Makefile must run scripts/check-baseline.sh from make check." >&2
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
if [ "$(grep -Fc "context.fail(e);" "$ALEXA_SKILL")" -ne 1 ]; then
  printf '%s\n' "AlexaSkill must pass the caught Error exactly once to Lambda failure handling." >&2
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
  "$DOCS_PLANS/2026-06-13-alexa-ssml-speak-envelope.md"; do
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
