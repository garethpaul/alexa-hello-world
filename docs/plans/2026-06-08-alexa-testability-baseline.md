---
title: Alexa Hello World Testability Baseline
type: test
status: completed
date: 2026-06-08
---

# Alexa Hello World Testability Baseline

## Summary

Add a minimal Node test harness for the Alexa Lambda sample and make skill-id configuration environment-driven. The change keeps the sample's launch, help, and hello responses intact while giving future edits a repeatable local quality gate.

---

## Problem Frame

The repository contains a Lambda handler and Alexa speech assets, but no package manifest, local test command, or automated checks. The handler response contract can be verified without AWS by calling `exports.handler` with representative Alexa request events.

---

## Requirements

- R1. The repository must expose an `npm test` command that runs without third-party dependencies.
- R2. Tests must cover the launch response, `HelloWorldIntent`, help intent, unsupported-intent failure path, and configured app-id rejection.
- R3. The optional Alexa application id must be configurable without editing source before deployment.
- R4. Documentation must explain local verification and Lambda packaging expectations.
- R5. Existing speech output, card output, and session-ending behavior must remain unchanged.

---

## Key Technical Decisions

- **Use Node's built-in test runner:** `node --test` provides enough coverage for this small CommonJS Lambda without adding Jest, Mocha, or lockfile churn.
- **Test through the Lambda handler:** Calling `exports.handler` exercises the sample's request routing and response builder without exposing internals just for tests.
- **Read app id from the environment:** `process.env.ALEXA_SKILL_ID` preserves the optional validation behavior while avoiding source edits for deployment-specific ids.
- **Keep package metadata private:** This is deployable source, not a published npm package.

---

## Scope Boundaries

- This pass does not migrate the sample to the current Alexa Skills Kit SDK.
- This pass does not change the speech assets or invocation model.
- This pass does not add runtime npm dependencies.
- This pass does not change Lambda handler names or deployment layout.

---

## Implementation Units

### U1. Package and Test Harness

- **Goal:** Provide a repeatable local test command.
- **Files:** `package.json`, `test/handler.test.js`
- **Patterns:** CommonJS modules and `node:test`; fake Lambda `context` objects capture `succeed` and `fail`.
- **Test Scenarios:**
  - Launch requests return the welcome prompt and keep the session open.
  - `HelloWorldIntent` returns the existing speech, card title, card content, and ends the session.
  - `AMAZON.HelpIntent` returns the existing help prompt and keeps the session open.
  - Unsupported intents call `context.fail`.
  - Configured `ALEXA_SKILL_ID` rejects requests from another application id.
- **Verification:** `npm test`

### U2. Environment-Driven Skill Id

- **Goal:** Allow deployment-specific app id validation without editing source.
- **Files:** `src/index.js`
- **Patterns:** Use `process.env.ALEXA_SKILL_ID || undefined` for the existing optional `APP_ID` value.
- **Test Scenarios:**
  - With no env var, sample requests still execute as before.
  - Existing app-id mismatch behavior remains owned by `AlexaSkill`.
- **Verification:** `npm test`

### U3. Documentation Refresh

- **Goal:** Record local verification and packaging steps for future maintainers.
- **Files:** `README.md`
- **Patterns:** Keep the original AWS/Alexa setup flow, add local test and configuration sections.
- **Test Scenarios:**
  - README lists `npm test`.
  - README describes `ALEXA_SKILL_ID`.
  - README keeps the zip packaging instruction for uploading `src` contents.
- **Verification:** Manual README review

---

## Risks & Dependencies

- The sample uses an old hand-rolled Alexa helper rather than the maintained ASK SDK; migrating SDKs should be a separate behavior-aware pass.
- `node --test` expects a modern local Node runtime; Lambda deployment runtime selection should be handled separately.
- The speech asset format is legacy and should be revisited if the skill is migrated to the current Alexa developer console model.

---

## Sources / Research

- `src/index.js` contains the Lambda handler, launch copy, help copy, and `HelloWorldIntent` response.
- `src/AlexaSkill.js` contains the request dispatcher and response builder.
- `speechAssets/IntentSchema.json` and `speechAssets/SampleUtterances.txt` define the sample interaction model.
- Local `node --version` is `v20.19.5`, which supports `node --test`.
