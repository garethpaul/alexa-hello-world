#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
README="$ROOT_DIR/README.md"
MAKEFILE="$ROOT_DIR/Makefile"
PACKAGE_JSON="$ROOT_DIR/package.json"
GITIGNORE="$ROOT_DIR/.gitignore"
DOCS_PLANS="$ROOT_DIR/docs/plans"

require_file() {
  path=$1
  if [ ! -f "$ROOT_DIR/$path" ]; then
    printf '%s\n' "Required file is missing: $path" >&2
    exit 1
  fi
}

for path in \
  ".circleci/config.yml" \
  ".gitignore" \
  ".prettierignore" \
  ".prettierrc.json" \
  "CHANGES.md" \
  "Makefile" \
  "README.md" \
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
  "scripts/check-baseline.sh"; do
  require_file "$path"
done

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
  if ! grep -iq "status" "$plan" || ! grep -iq "completed" "$plan"; then
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
  "$DOCS_PLANS/2026-06-09-scripted-baseline-check.md"; do
  if ! grep -Fq "make check" "$plan"; then
    printf '%s\n' "$plan must document make check verification." >&2
    exit 1
  fi
done

printf '%s\n' "Alexa Hello World baseline checks passed."
