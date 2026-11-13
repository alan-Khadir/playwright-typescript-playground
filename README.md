# playwright-typescript-playground

Playwright + TypeScript test automation framework for a static web app: page objects, fixtures, CI on GitHub Actions.

## What it tests

`webapp/` is a static HTML/JS "Testing Playground" (no backend; data in `localStorage` and `topics.json`). Playwright starts it with `serve` on http://localhost:3000 before the tests run. One test user: `user@test.com` / `Password123`.

Tests live in `tests/specs/`, one folder per screen (e.g. `sign-in/`, `home/`), and run on Chromium.

## Quick start

Needs Node 24 and Git. Full setup from a new machine, with every step explained: [docs/setup-guide.md](docs/setup-guide.md).

```powershell
git clone https://github.com/alan-Khadir/playwright-typescript-playground.git   # copy the repo to your PC
cd playwright-typescript-playground                                               # go into the repo folder
npm ci                                                                            # install the exact package versions from package-lock.json
npx playwright install chromium                                                   # download the browser the tests use
npm test                                                                          # start the app and run every test
npx playwright show-report                                                        # open the HTML report of the last run
```

## Commands

Run from the repo root.

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm test`             | Runs all tests (Playwright starts the app automatically).        |
| `npm run test:ui`      | Opens Playwright UI mode to run and debug tests step by step.    |
| `npm run lint`         | ESLint: bad practice and likely bugs. Warnings fail too.         |
| `npm run typecheck`    | TypeScript type check (`tsc --noEmit`).                          |
| `npm run format`       | Prettier: fixes formatting in every file.                        |
| `npm run format:check` | Prettier: reports formatting problems without changing anything. |

Before every commit, fastest first, so a typo fails in seconds and not as a confusing test failure:

```powershell
npm run format:check   # 1. Prettier: layout (if it fails, run: npm run format)
npm run lint           # 2. ESLint: bad habits, e.g. a missing await
npm run typecheck      # 3. tsc: wrong types
npm test               # 4. the tests: slowest, so last
```

GitHub Actions runs the same four checks, in the same order, on every pull request into `main` and on every merge to `main` ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)). The HTML report is uploaded to each run as the `playwright-report` artifact.

## Guardrails

Checks that stop bad code reaching `main`. Each one catches a different kind of problem, so they don't overlap.

| Guardrail                         | What it catches                                         | How it runs                      |
| --------------------------------- | ------------------------------------------------------- | -------------------------------- |
| TypeScript, strict (`tsc`)        | Wrong types                                             | `npm run typecheck`              |
| ESLint (typescript-eslint)        | Risky code that is still valid: bad habits, likely bugs | `npm run lint`                   |
| ESLint (eslint-plugin-playwright) | Playwright misuse in tests                              | `npm run lint`                   |
| Prettier                          | Layout only: spaces, quotes, line breaks                | `npm run format:check`           |
| `.gitattributes`                  | Windows (CRLF) vs Linux (LF) line endings               | Automatic on `git add`           |
| Pinned versions + lock file       | "Works on my machine" from different tool versions      | `npm ci` installs exact versions |
| Pull request + green Actions      | Untested code merged into `main`                        | GitHub                           |

### TypeScript, strict

Checks every value has the right type before a test runs. Settings: `tsconfig.json`.

```ts
// ✘ Wrong: text where a number is expected.
// npm run typecheck reports: Type 'string' is not assignable to type 'number'.
const timeout: number = '5000';
// ✔ Right
const timeout: number = 5000;
```

### ESLint (typescript-eslint)

Finds code that compiles but is probably a bug. Type-aware rules know that `page.goto()` returns a Promise, so they spot a missing `await`. Settings: `eslint.config.mjs`.

```ts
// ✘ Wrong: not awaited, so the next line can run before the page loads (a flaky test).
// ESLint: @typescript-eslint/no-floating-promises
page.goto('/html/signin.html');
// ✔ Right
await page.goto('/html/signin.html');
```

### ESLint (eslint-plugin-playwright)

Playwright-specific rules, for files in `tests/` only.

```ts
// ✘ Wrong: a fixed sleep. Too slow when the app is fast, too short when it's slow.
// ESLint: playwright/no-wait-for-timeout
await page.waitForTimeout(3000);
// ✔ Right: a web-first assertion keeps retrying until it passes (up to 5 seconds).
await expect(
  page.getByRole('heading', { name: 'Choose a Topic' }),
).toBeVisible();
```

### Prettier

Formats layout so every file looks the same and reviews show only real changes. Settings: `.prettierrc.json` (single quotes) and `.prettierignore` (files to skip). ESLint's own layout rules are switched off (`eslint-config-prettier`), so the two never argue.

<!-- prettier-ignore -->
```ts
// ✘ Wrong: double quotes, missing spaces. `npm run format:check` reports it.
const email="user@test.com"
// ✔ Right: what `npm run format` turns it into.
const email = 'user@test.com';
```

### Line endings (`.gitattributes`)

Every text file is stored with LF line endings, whatever machine it was saved on.

- ✘ Without it: a commit from Windows can show every line of a file as changed, and Git warns "LF will be replaced by CRLF".
- ✔ With it: diffs show only the lines you really changed, and Windows and CI (Linux) see identical files.

### Pinned versions and the lock file

`package.json` says which versions are allowed. `package-lock.json` records the exact versions installed. CI runs `npm ci`, which installs exactly what the lock file says.

```jsonc
// ✘ Wrong: "^" allows any 6.x, e.g. 6.1, but typescript-eslint 8 only supports TypeScript below 6.1,
// so a fresh install could pick a version our linter can't use.
"typescript": "^6.0.3"
// ✔ Right: "~" allows 6.0.x patch fixes only. Why: docs/decisions/001-week-1-tooling-and-workflow.md
"typescript": "~6.0"
```

### Pull request + green Actions

We never push to `main` directly. Every change goes on a branch, such as `feat/sign-in-tests`, then through a pull request. It is squash-merged only when GitHub Actions is green.

## Documentation

| Document                                     | What's in it                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| [docs/setup-guide.md](docs/setup-guide.md)   | Every tool, install command and config file; Git workflow; Troubleshooting |
| [docs/architecture.md](docs/architecture.md) | Folder structure, the rules every test follows, naming                     |
| [docs/decisions/](docs/decisions/)           | Decision records: what we chose, why, and what we rejected                 |

App bugs are raised as [GitHub Issues](https://github.com/alan-Khadir/playwright-typescript-playground/issues) with the `bug` label.
