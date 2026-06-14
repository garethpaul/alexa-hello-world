# Make Root Override Protection

Status: Planned

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
