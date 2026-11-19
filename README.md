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
Copy-Item .env.example .env                                                       # optional: your own settings, e.g. BASE_URL (gitignored)
npx playwright install chromium                                                   # download the browser the tests use
npm test                                                                          # start the app and run every test
npx playwright show-report                                                        # open the HTML report of the last run
```

## Commands

Run from the repo root.

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm test`             | Runs all tests (Playwright starts the app automatically).        |
| `npm run test:smoke`   | Runs only the `@smoke` tests (plus the sign-in setup).           |
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

Checks that stop bad code reaching `main`. Each catches a different kind of problem, so they don't overlap. Why each one was chosen: [decision record 001](docs/decisions/001-week-1-tooling-and-workflow.md). Wrong/right examples for each rule: [docs/architecture.md](docs/architecture.md).

| Guardrail                         | What it catches                                        | How it runs                      | Settings                                                      |
| --------------------------------- | ------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------- |
| TypeScript, strict (`tsc`)        | Wrong types                                            | `npm run typecheck`              | `tsconfig.json`                                               |
| ESLint (typescript-eslint)        | Risky code that is still valid, e.g. a missing `await` | `npm run lint`                   | `eslint.config.mjs`                                           |
| ESLint (eslint-plugin-playwright) | Playwright misuse in tests, e.g. `waitForTimeout`      | `npm run lint`                   | `eslint.config.mjs`                                           |
| Prettier                          | Layout only: spaces, quotes, line breaks               | `npm run format:check`           | `.prettierrc.json`, `.prettierignore`                         |
| `.gitattributes`                  | Windows (CRLF) vs Linux (LF) line endings              | Automatic on `git add`           | `.gitattributes`                                              |
| Pinned versions + lock file       | "Works on my machine" from different tool versions     | `npm ci` installs exact versions | `package.json`, `package-lock.json`                           |
| Pull request + green Actions      | Untested code merged into `main`                       | GitHub                           | [Git workflow](docs/setup-guide.md#git-workflow-every-change) |

## Documentation

| Document                                                       | What's in it                                                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [docs/setup-guide.md](docs/setup-guide.md)                     | Every tool, install command and config file; [Git workflow](docs/setup-guide.md#git-workflow-every-change); Troubleshooting |
| [docs/architecture.md](docs/architecture.md)                   | Folder structure, adding a test, the rules every test follows, naming                                                       |
| [docs/decisions/](docs/decisions/)                             | Decision records: what we chose, why, and what we rejected                                                                  |
| [docs/learning/concepts.md](docs/learning/concepts.md)         | How each TypeScript and Playwright concept works, with C#/Selenium comparisons                                              |
| [docs/learning/walkthroughs.md](docs/learning/walkthroughs.md) | Our page objects, specs and fixtures explained line by line                                                                 |

App bugs are raised as [GitHub Issues](https://github.com/alan-Khadir/playwright-typescript-playground/issues) with the `bug` label.
