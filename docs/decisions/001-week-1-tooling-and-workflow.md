# 001. Week 1 tooling and workflow

- **Status:** Accepted
- **Date:** 2026-11-13 (Week 1, Day 5). Decisions made Days 1 to 4.

## Context

Before tests multiply, the repo needs checks that stop bad code reaching `main`, and one way of working that every change follows. Week 1 set these up. This record says what we chose, why, and what we turned down, so nobody has to guess later.

## Decisions

### 1. Every change goes through a pull request, squash-merged when CI is green

- **Chose:** no direct pushes to `main`. Branch names are `type/short-description`, e.g. `feat/home-navigation-tests`, `ci/checks-and-readme`. Merge with "Squash and merge" only when GitHub Actions is green.
- **Why:** CI checks every change before it lands. Squash gives one commit per PR on `main`, so `git log` reads as a list of finished pieces of work.
- **Rejected:** pushing to `main` (nothing checks the change first); merge commits (every "fix typo" commit lands on `main`).

### 2. Three checking tools, each with one job

- **Chose:** TypeScript `strict` (types), ESLint with type-aware typescript-eslint rules and eslint-plugin-playwright (risky code that still compiles), Prettier (layout only). `eslint-config-prettier` switches off ESLint's layout rules.
- **Why:** each catches a different kind of problem, so they don't overlap or argue. Type-aware rules know `page.goto()` returns a Promise, so `@typescript-eslint/no-floating-promises` catches a missing `await`: the main cause of flaky tests.
- **Rejected:** plain (not type-aware) ESLint rules: faster, but they can't see a missing `await`. ESLint for layout too: it and Prettier would fight over the same lines.

### 3. Checks run fastest first, in the same order locally and in CI

- **Chose:** `format:check` → `lint` → `typecheck` → `test`. In CI the first three run before the browser install.
- **Why:** a formatting slip fails in seconds, not after a 2-minute test run. One order everywhere means one thing to remember.
- **Rejected:** only `npm test` in CI (lint and type errors reach `main` unnoticed).

### 4. TypeScript pinned to `~6.0`

- **Chose:** `"typescript": "~6.0"` (6.0.x patches only).
- **Why:** typescript-eslint 8 supports TypeScript `>=4.8.4 <6.1.0`. TypeScript 7 (the Go rewrite) has no stable API for it yet.
- **Rejected:** `^6.0.3` (allows 6.1+, which typescript-eslint doesn't support).
- **Revisit:** when typescript-eslint supports TypeScript 6.1 or 7.

### 5. LF line endings for every text file

- **Chose:** `.gitattributes` with `* text=auto eol=lf`.
- **Why:** Windows (CRLF) and CI on Linux (LF) see identical files, and diffs show only real changes.
- **Rejected:** Git's `core.autocrlf` setting: it lives on each machine, not in the repo, so a new machine can get it wrong.

### 6. Chromium only, for now

- **Chose:** one project (Chromium) in `playwright.config.ts`; CI installs only Chromium.
- **Why:** faster runs while the framework is built. WebKit also fails to start on Windows locally (missing `libwebp.dll`).
- **Rejected:** all three browsers on every run (3x the time, before any test needs it).
- **Revisit:** Week 9 (cross-browser).

### 7. Node 24 pinned in CI, and `@types/node` matches it

- **Chose:** `node-version: 24` in the workflow (our machines run Node 24). `@types/node` on `^24`.
- **Why:** `lts/*` moves to a new Node version on its own, so CI could pass or fail on a version nobody runs locally. `@types/node` must describe the Node we run, or TypeScript would allow APIs Node 24 doesn't have.
- **Rejected:** `lts/*` (moves without us).
- **Revisit:** when Node 24 leaves LTS, or when we upgrade locally.

### 8. Known `npm audit` warnings in `serve` accepted

- **Chose:** keep `serve` 14 and accept the 2 high advisories in its `compression` dependency.
- **Why:** `serve` only runs on our machine and in CI to serve the static app; nothing outside can reach it. `npm audit fix --force` would downgrade `serve` to 10.
- **Revisit:** when `serve` releases a fix.

## Consequences

- Every PR waits for CI (about 1 to 2 minutes). That's the price of a green `main`.
- Upgrades of TypeScript, Node and the GitHub Actions are deliberate steps, not automatic.
- Details of each tool and command: [setup-guide.md](../setup-guide.md). The checks themselves: [README Guardrails](../../README.md#guardrails).
