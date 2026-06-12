# Alexa Dispatch Log Safety

Status: Completed

## Goal

Prevent caller-controlled request types and intent names from being reflected
into Lambda failures or CloudWatch logs when dispatch rejects them.

## Requirements

- Unsupported request types fail with a stable generic message.
- Unsupported intent names fail with a stable generic message.
- Newline-bearing dispatch names cannot forge log entries.
- Tests cover both rejected dispatch paths and their captured logs.
- The baseline checker enforces generic failures and rejects reflected values.
- Repository checks work from outside the checkout directory.
- Hosted verification uses a fixed runner and cancels superseded runs.

## Implementation

- Replace dispatch errors that concatenate caller input with constant strings.
- Add request-type and intent-name regression tests using embedded newlines.
- Extend `scripts/check-baseline.sh` with source, rooted `Makefile`, and CI
  contracts.
- Resolve commands from the `Makefile` location and pin GitHub Actions to
  Ubuntu 24.04 with workflow concurrency.

## Verification

- `npm test`
- `make check`
- `make -f /absolute/path/to/Makefile check` from outside the repository
- dispatch-error and automation mutation checks
- `npm audit --audit-level=high`
- `git diff --check`
