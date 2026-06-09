# Changes

## 2026-06-08

1. Added explicit lint, format-check, test, and build scripts so local
   verification has the full quality gate required before changes are pushed.
2. Added pinned, supported development dependencies for ESLint and Prettier
   while keeping the Lambda runtime dependency-free.
3. Added CircleCI to run install, lint, format check, tests, and syntax build on
   every pushed commit.
4. Preserved the existing Alexa request behavior and handler tests.
5. Added an explicit unsupported request-type contract so dispatcher failures
   are clear.
6. Added built-in cancel and stop intent handling so users can exit the sample
   cleanly.
7. Added `make check` as the root wrapper for lint, format, tests, and syntax
   checks.
