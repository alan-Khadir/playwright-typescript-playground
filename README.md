# playwright-typescript-playground

Playwright + TypeScript test automation framework for a static web app: page objects, fixtures, CI on GitHub Actions.

## Commands

Run from the repo root. Full setup, from a new machine: [docs/setup-guide.md](docs/setup-guide.md).

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm test`             | Runs all tests (Playwright starts the app automatically).        |
| `npm run test:ui`      | Opens Playwright UI mode to run and debug tests step by step.    |
| `npm run lint`         | ESLint: bad practice and likely bugs. Warnings fail too.         |
| `npm run typecheck`    | TypeScript type check (`tsc --noEmit`).                          |
| `npm run format`       | Prettier: fixes formatting in every file.                        |
| `npm run format:check` | Prettier: reports formatting problems without changing anything. |

Before every commit: `npm run format`, `npm run lint`, `npm run typecheck`, `npm test`.
