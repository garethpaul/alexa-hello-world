---
title: Alexa Check Wrapper
status: completed
date: 2026-06-08
origin: user-requested continuous engineering quality loop
execution: code
---

# Alexa Check Wrapper

## Problem Frame

The repository had npm scripts for linting, formatting, tests, and syntax
checks, but it did not expose the shared root `make check` command used across
the maintenance loop.

## Scope Boundaries

- Preserve the existing Node package scripts and dependency pins.
- Do not change Alexa handler behavior.
- Do not add runtime dependencies.

## Implementation Units

### U1: Root Verification Wrapper

Files:

- `Makefile`

Approach:

- Run ESLint and Prettier from `make lint`.
- Run the Node test suite from `make test`.
- Run syntax checks from `make build`.
- Make `make check` depend on the combined `verify` target.

### U2: Documentation

Files:

- `README.md`
- `CHANGES.md`

Approach:

- Document `make check` as the root verification entry point.

## Verification

- `make check`
- `git diff --check`
