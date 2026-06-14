# Make Root Override Protection

Status: Completed

## Problem

The Makefile-derived repository root anchors lint, format, test, build, and
baseline verification, but an ordinary assignment can be replaced by a
command-line `ROOT` value and redirect those commands away from the reviewed
checkout.

## Requirements

1. Protect the derived root with GNU Make's `override` directive.
2. Preserve the configurable npm command and every existing target.
3. Require exact protected-root, npm-override, rooted package-command, and
   rooted baseline-script contracts.
4. Pass clean-install local, external-directory, and hostile-root full gates.
5. Reject focused root, tool, path, and completed-plan mutations.

## Verification

- Run the dependency-free baseline checker first.
- Install the exact lock with scripts disabled, audit dependencies, then run
  bounded local, external-directory, and hostile `ROOT` `make check` gates.
- Run focused mutations plus JSON/YAML/SVG, artifact, whitespace, and
  changed-line credential audits.

## Scope Boundaries

- Do not change Lambda behavior, package versions, workflows, speech assets,
  response contracts, or deployment configuration.
- Do not merge or close any pull request without explicit owner authorization.

## Work Completed

- Protected the Makefile-derived root while preserving npm configurability and
  every existing target.
- Added exact shell contracts for protected derivation, npm override semantics,
  four rooted package commands, the rooted baseline script, and this completed
  plan.

## Verification Results

- The focused dependency-free baseline checker passed.
- `npm ci --ignore-scripts --no-audit --no-fund` installed the exact lock's 72
  packages, and `npm audit --audit-level=moderate` reported zero
  vulnerabilities.
- Local, external-directory, and hostile command-line `ROOT` `make check`
  gates each passed lint, format, all 57 Node tests, syntax build, and the
  baseline checker.
- All eight focused mutations were rejected: missing `override`, `CURDIR`,
  recursive root assignment, `firstword`, eager npm assignment, one unrooted
  package command, a relative baseline command, and reopened plan status.
- JSON, YAML, SVG XML, shell syntax, whitespace, ignored-artifact, and
  changed-line credential audits passed; only the three intended files were
  changed and no generated artifacts remained.
