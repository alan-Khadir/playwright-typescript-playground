# Setup guide


This is the single record of how this framework is set up. It is written so that anyone can rebuild it from nothing on a new Windows machine, one step at a time.

## How to read this guide

- **Every command block says where to run it.** There are only two places:
  - **PowerShell window:** Start menu, type `PowerShell`, open **Windows PowerShell**. It does not need to be run as administrator.
  - **VS Code terminal:** in VS Code, with the repo folder open, press **Ctrl+`** (the backtick key, below Esc). On Windows this is also PowerShell, and it starts in the repo folder.
- **Repo root** means `C:\git-personal\playwright-typescript-playground`, the folder that contains `.git`, `README.md` and `webapp`. The prompt must end in `playwright-typescript-playground>`. If it doesn't, run `cd C:\git-personal\playwright-typescript-playground` first.
- Run commands **one at a time**: paste one line, press Enter, wait for the prompt (`PS C:\...>`) to come back, then run the next.
- Each step ends with **Check**: what you should see. If you don't see it, stop and fix it (see Troubleshooting) before the next step.
- A new PowerShell window opens in `C:\Windows\System32`. Never run project commands there.

## Toolkit

Copied from the plan. npm packages are added in the week they are first used, not earlier.

| Purpose | Tool | What it is for | Status |
|---|---|---|---|
| Core | Node.js LTS (22+) | Runs JavaScript and TypeScript outside the browser. Playwright is a Node library, so the tests run on Node. | installed (Step 1) |
| Core | npm | Node's package manager: installs libraries listed in package.json and runs npm scripts. Comes with Node. | installed (Step 1) |
| Core | Git | Version control: history of every change, branches, and clone/push to GitHub. | installed (Step 1) |
| Core | @playwright/test | Playwright's test runner and browser automation library: `test`, `expect`, locators, fixtures, reports. Dev dependency. | installed Week 1 Day 1 (Step 7) |
| Core | TypeScript | JavaScript with types, so mistakes are caught in the editor before a test runs. Playwright runs .ts files directly without it; the `typescript` package is only needed for `tsc --noEmit`. | Playwright handles .ts from Day 1; `typescript` package added in Week 1 Day 2 |
| Core | @types/node | Type definitions for Node's built-in modules (e.g. `process.env`), so TypeScript understands them. Dev dependency. | installed Week 1 Day 1 (Step 7) |
| Serving the app | serve | Small static web server that serves `webapp/` at http://localhost:3000. Dev dependency so CI runs the same version. | npx on Day 1; dev dependency Week 1 Day 2 |
| Editor | VS Code | Code editor; `code` is its command-line launcher. | installed (Step 1) |
| Editor | Playwright Test for VS Code | Run and debug tests from the editor; Pick locator. | installed (Step 2) |
| Editor | ESLint extension | Shows lint problems as you type. | installed (Step 2) |
| Editor | Prettier extension | Formats code automatically on save. | installed (Step 2) |
| Editor | Cucumber (official) extension | Syntax highlighting and step navigation for .feature files. | installed (Step 2); used Week 6 |
| Finding locators | Pick locator (VS Code, UI mode, Inspector); codegen; Chrome DevTools accessibility tree | Find the user-facing locator for an element. Codegen is for exploring only, never pasted into the repo. | Week 1 |
| Debugging | UI mode, trace viewer, Inspector, page.pause(), VS Code breakpoints | Step through tests and see exactly what happened when one fails. | Weeks 1-2 |
| Code quality | eslint, @eslint/js, typescript-eslint, eslint-plugin-playwright | Lint rules for JavaScript, TypeScript and Playwright mistakes (e.g. a missing `await`). | added in Week 1 Day 2 |
| Code quality | prettier, eslint-config-prettier | One code format for everyone; stops ESLint and Prettier fighting over formatting. | added in Week 1 Day 2 |
| Code quality | tsc --noEmit | Type-checks the whole project without producing output files. | Week 1 Day 2 |
| Reporting | Built-in HTML report with traces | Shows which tests passed or failed, with a trace to replay each failure. Uploaded as a CI artefact. | Week 1 |
| CI | GitHub Actions | Runs the tests on GitHub's machines on every push and PR. | Week 1 (workflow); Week 9 (branch protection, status badge) |
| Config | dotenv; .env (not committed) and .env.example | Loads settings such as URLs and credentials from a file instead of hard-coding them. | added in Week 2 |
| Test data | @faker-js/faker | Generates realistic random test data (names, emails). | added in Week 3 |
| BDD | playwright-bdd | Runs Gherkin .feature files on top of the same Playwright page objects and fixtures. | added in Week 6 |
| API under test | express, tsx, @types/express | The Topics API server added in Week 7, and the tool to run it in TypeScript. | added in Week 7 |
| Accessibility | @axe-core/playwright | Automated accessibility scans inside Playwright tests. | added in Week 10 |
| Optional | Husky and lint-staged | Run lint on staged files before each commit. | Week 9 (optional) |
| Optional | Allure | Alternative report; only if a target job asks for it. | - |
| Not used | cucumber-js, ts-node, Jest, Mocha, Chai, axios, Docker, wait/retry libraries, locator extensions | Playwright already covers these jobs; adding them duplicates tooling. | - |

---

## Step 1. Check the machine tools

**Where:** PowerShell window, any folder (these commands don't touch project files).

Run each command on its own:

```powershell
node --version
npm --version
git --version
code --version
git config --global user.name
git config --global user.email
```

What each one checks and why it is needed:

- **Node.js** runs JavaScript and TypeScript outside the browser. Playwright is a Node library, so the tests run on Node. Version 22 or higher, the current LTS (long-term support) line.
- **npm** is Node's package manager. It installs libraries such as `@playwright/test` and runs scripts. It comes bundled with Node.
- **Git** does version control. Without it you can't clone or push.
- **`code`** is VS Code's command-line launcher. If it works, extensions can be installed from the terminal (Step 2).
- **The two `git config` lines** show the name and email stamped on every commit. An empty result means they are not set yet.

**Check:**

| Command | You need | Verified on 2026-11-09 |
|---|---|---|
| `node --version` | v22 or higher | v24.16.0 |
| `npm --version` | any number (comes with Node) | 11.13.0 |
| `git --version` | any recent version | 2.54.0.windows.1 |
| `code --version` | any recent version | 1.138.0 |
| `git config --global user.name` | your GitHub username | set |
| `git config --global user.email` | an email (GitHub noreply recommended) | set |

### 1a. If something is missing

Install only what is missing or too old. `winget` (Windows Package Manager) is built into Windows 10/11. **After any install, close PowerShell and open a new window**, so it picks up the new commands, then re-run the check.

| Missing | Install with winget (PowerShell window) | Or download manually |
|---|---|---|
| Node.js (or older than 22) | `winget install OpenJS.NodeJS.LTS` | https://nodejs.org: the **LTS** Windows installer (.msi), default options. npm comes with it. |
| Git | `winget install Git.Git` | https://git-scm.com/downloads/win, default options. |
| VS Code | `winget install Microsoft.VisualStudioCode` | https://code.visualstudio.com. In the installer keep **"Add to PATH"** ticked, so the `code` command works. |

**Git name and email not set:** run these (PowerShell window), using your own details:

```powershell
git config --global user.name "YOUR-GITHUB-USERNAME"
git config --global user.email "YOUR-ID+YOUR-GITHUB-USERNAME@users.noreply.github.com"
```

Your noreply address is on GitHub under Settings > Emails. It keeps your real email out of a public repo's history.

**`npm --version` says "running scripts is disabled on this system":** see Troubleshooting.

## Step 2. Install the VS Code extensions

**Where:** PowerShell window, any folder.

```powershell
code --install-extension ms-playwright.playwright --force
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension CucumberOpen.cucumber-official
code --list-extensions
```

| Extension ID | What it is |
|---|---|
| `ms-playwright.playwright` | Playwright Test for VS Code (Microsoft): run, debug and pick locators from the editor. `--force` updates it if an older version is already installed. |
| `dbaeumer.vscode-eslint` | ESLint (Microsoft): lint errors shown as you type. |
| `esbenp.prettier-vscode` | Prettier: automatic code formatting. |
| `CucumberOpen.cucumber-official` | Cucumber (official): optional, used from Week 6. |

Installing by ID (publisher.name) guarantees the official extension, not a lookalike.

**Check:** `code --list-extensions` lists all four IDs (in lower case).

Recommended while learning: disable AI coding assistants for this workspace (Extensions view, gear icon, **Disable (Workspace)**).

## Step 3. Create the GitHub repo

**Where:** browser, https://github.com/new (signed in to GitHub).

| Field | Value |
|---|---|
| Repository name | `playwright-typescript-playground` |
| Visibility | Public |
| Add a README | On (creates the first commit and the `main` branch, so the repo can be cloned straight away) |
| .gitignore | Node |
| Licence | MIT |

Click **Create repository**. Then on the repo page click the gear icon next to **About** and set:
- Description: `Playwright + TypeScript test automation framework for a static web app: page objects, fixtures, CI on GitHub Actions.`
- Topics: `playwright`, `typescript`, `test-automation`

**Check:** the repo page shows README.md, LICENSE and .gitignore.

## Step 4. Clone the repo

**Where:** PowerShell window, any folder. The commands below move you to `C:\git-personal`, then into the repo root.

```powershell
New-Item -ItemType Directory -Force C:\git-personal
cd C:\git-personal
git clone https://github.com/alan-Khadir/playwright-typescript-playground.git
cd playwright-typescript-playground
git status
git log --oneline
Get-ChildItem -Force
```

- `New-Item ... -Force` creates the folder, with no error if it already exists.
- `git clone` downloads the repo and its history, and sets up the link back to GitHub (the remote `origin`).

**Check:**
- `git status`: `On branch main`, `Your branch is up to date with 'origin/main'`, `nothing to commit, working tree clean`.
- `git log --oneline`: one line, `Initial commit`.
- `Get-ChildItem -Force`: `.git`, `.gitignore`, `LICENSE`, `README.md`.

From here on, every project command runs from `C:\git-personal\playwright-typescript-playground` (the **repo root**).

## Step 5. Copy the app (webapp/) into the repo

**Where:** PowerShell window, in the repo root (prompt: `PS C:\git-personal\playwright-typescript-playground>`, where Step 4 left you).

The app under test is `webapp/` from the `jira-to-playwright-agent` repo, assumed to be cloned at `C:\git-personal\jira-to-playwright-agent`. Change the path if yours is elsewhere. (Once this step is committed, anyone cloning this repo already has `webapp/` and can skip this step.)

First look at the source, without copying anything:

```powershell
Get-ChildItem C:\git-personal\jira-to-playwright-agent\webapp -Force
```

If it contains `node_modules` or `.git`, stop: those must not be copied. Otherwise:

```powershell
Copy-Item -Recurse C:\git-personal\jira-to-playwright-agent\webapp .\webapp
Get-ChildItem .\webapp -Recurse -Name
Get-Content .\webapp\serve.json
```

**Check:** the listing includes `index.html`, `serve.json`, `css\styles.css`, `data\topics.json`, `html\index.html`, `html\signin.html`, `html\create-account.html`, `html\dashboard.html`, `html\taskboard.html`, `html\embed.html`, `js\app.js`, `js\toast.js`.

About the app: static HTML/JS, no backend, state kept in the browser's localStorage, topic data loaded from `data/topics.json`. One fixed user: `user@test.com` / `Password123`.

`webapp/serve.json` configures the `serve` web server:
- `"cleanUrls": false` keeps `.html` in URLs (sign-in is `/html/signin.html`). URL assertions depend on this.
- `redirects` send `/` and `/html` to `/html/index.html` (302, temporary).

**Rule:** `webapp/` is never edited to make a test pass. App bugs are raised as GitHub Issues with the `bug` label.

## Step 6. Open the repo in VS Code and run the app

**Where:** PowerShell window, in the repo root (`code .` opens the current folder), then the VS Code terminal for everything after.

```powershell
code .
```

(`.` means "this folder", so run it from the repo root.)

1. If VS Code asks "Do you trust the authors of the files in this folder?", click **Yes, I trust the authors**. In Restricted Mode, extensions stay disabled.
2. Open the VS Code terminal with **Ctrl+`**. Check that the prompt shows `C:\git-personal\playwright-typescript-playground`.
3. You can close the separate PowerShell window. **From now on, use the VS Code terminal.**

**Where:** VS Code terminal, in the repo root (prompt: `PS C:\git-personal\playwright-typescript-playground>`).

```powershell
npx serve webapp
```

- `npx` runs a package's command without adding it to the project. The first time it asks `Need to install the following packages: serve@14.2.7 Ok to proceed? (y)`: type `y` and press Enter.
- `webapp` is an argument: the folder to serve. Stay in the repo root; do not `cd webapp`.
- The terminal stays busy while the server runs. **Ctrl+C** stops it (answer `Y` if asked "Terminate batch job?").

**Check:**
- The terminal shows a **Serving!** box with `Local: http://localhost:3000`.
- In the browser, http://localhost:3000 opens the home page at `/html/index.html`.
- Sign in with `user@test.com` / `Password123`: you land on `/html/dashboard.html` ("Choose a Topic", 4 topic cards per page, 3 pages).
- Open a topic from the nav (10 topics): it shows breadcrumb, heading, badges, a "Did you know?" box and an interactive widget.
- F12 > Console: no red errors.

Nothing else starts until the app works.

## Step 7. Install Playwright (npm init playwright@latest)

**Where:** VS Code terminal, in the repo root. The prompt must read `PS C:\git-personal\playwright-typescript-playground>`. Stop the app first (Ctrl+C).

Running it anywhere else creates package.json, tests and config in the wrong folder.

```powershell
npm init playwright@latest
```

What it does: downloads and runs Playwright's setup wizard (`create-playwright`). It creates `package.json`, installs `@playwright/test` and `@types/node` into `node_modules/`, writes `playwright.config.ts`, an example test in `tests/` and the CI workflow in `.github/workflows/`, and downloads the browsers.

Answer the prompts (arrow keys and Enter):

| Prompt | Answer |
|---|---|
| Need to install create-playwright... Ok to proceed? | `y` |
| Do you want to use TypeScript or JavaScript? | TypeScript |
| Where to put your end-to-end tests? | `tests` (default) |
| Add a GitHub Actions workflow? | Yes |
| Install Playwright browsers? | Yes |

What the output shows, in order (verified 2026-11-09):

1. `Initializing NPM project (npm init -y)` creates `package.json`. It picks up the description and GitHub URLs from the repo automatically.
2. `npm install --save-dev @playwright/test`, then `npm install --save-dev @types/node`. `--save-dev` records them under `devDependencies` in `package.json`: needed to develop and test, not to run the app.
3. `Writing playwright.config.ts`, `.github\workflows\playwright.yml`, `tests\example.spec.ts`, `package.json`.
4. `Downloading browsers (npx playwright install)`: Chrome for Testing, Chrome Headless Shell, Firefox, WebKit and FFmpeg (used for video recording), into `C:\Users\YOUR-USER\AppData\Local\ms-playwright\`. Browsers are stored per machine, not in the repo. Browsers left over from older Playwright versions are removed automatically ("Removing unused browser").
5. `✔ Success! Created a Playwright Test project`.

**Check:**
- The output ends with `✔ Success!`.
- `npx playwright --version` prints the installed Playwright version (verified: `Version 1.65.0`).
- `git status` shows `modified: .gitignore` and untracked `.github/`, `package-lock.json`, `package.json`, `playwright.config.ts`, `tests/`, `webapp/`. `node_modules/` must **not** appear (the Node .gitignore excludes it).

| New or changed file | What it is |
|---|---|
| `package.json` | The project's manifest: name, scripts and the list of dependencies. |
| `package-lock.json` | Records the exact version of every installed package, so every machine and CI installs the same set (`npm ci`). Always committed. |
| `playwright.config.ts` | Playwright settings: test folder, browsers (projects), reporter, retries. Rewritten line by line on Week 1 Day 2. |
| `tests/example.spec.ts` | Example test from the wizard. Deleted on Week 1 Day 2. |
| `.github/workflows/playwright.yml` | GitHub Actions workflow: runs the tests on every push and PR to main. |
| `.gitignore` (modified) | The wizard appended Playwright's output folders (test results, report, cache) so they are never committed. |
| `node_modules/` (not committed) | The installed packages themselves. Rebuilt from package-lock.json with `npm ci`. |

Known follow-ups (Week 1 Day 2, when package.json is reviewed line by line): `"license"` says `ISC` but the repo licence is MIT; `"main": "index.js"` and the placeholder `"test"` script are npm defaults that don't apply to a test project.

## Step 8. Run the example tests and open the report

**Where:** VS Code terminal, in the repo root.

```powershell
npx playwright test
```

Runs `tests/example.spec.ts` (2 tests against playwright.dev) on the 3 browser projects in `playwright.config.ts` (chromium, firefox, webkit): 6 tests, in parallel workers. If any test fails, the HTML report opens automatically at http://localhost:9323 (Ctrl+C to stop it).

```powershell
npx playwright show-report
```

Opens the last HTML report: click a test to see its steps, errors and attachments. Ctrl+C stops the report server.

**Check:** `6 passed`.

Result on 2026-11-09 (Windows): `4 passed, 2 failed`. Both failures were `[webkit]` with `browserType.launch: Host system is missing dependencies! libwebp.dll` (see Troubleshooting). Chromium and Firefox passed. Verified locally with:

```powershell
npx playwright test --project=chromium --project=firefox
```

From Week 1 Day 2 the config runs Chromium only; all three browsers return in the nightly CI run (Week 9), which runs on Linux.

## Step 9. Commit, push and check GitHub Actions

**Where:** VS Code terminal, in the repo root.

Work goes on a branch and reaches `main` through a pull request (PR), merged only when GitHub Actions is green.

**9a. Create a branch**

```powershell
git switch -c chore/playwright-setup
```

- `git switch` moves you to another branch; `-c` (create) makes the branch first. The new branch starts from the commit you are on (main), and your uncommitted files come with you.
- Why a branch: `main` only receives work through a pull request, after CI is green. A broken change never lands on main.
- Naming: `type/short-description`. `chore/` is for setup and tooling, `feat/` for new tests or features, `fix/` for fixes.
- **Check:** the prompt or `git status` shows `On branch chore/playwright-setup`.

**9b. Create docs/setup-guide.md (this guide)**

```powershell
New-Item -ItemType Directory -Force docs
New-Item docs\setup-guide.md
code docs\setup-guide.md
```

- `New-Item -ItemType Directory -Force docs` creates the `docs` folder in the repo root (`-Force`: no error if it already exists). All repo documents live here.
- `New-Item docs\setup-guide.md` creates an empty file (`New-Item` without `-ItemType` creates a file).
- `code docs\setup-guide.md` opens that file in the current VS Code window.
- Paste the guide's content as **Markdown source** (lines starting `#`, tables made of `|`), not rendered text, and save with **Ctrl+S**.
- Alternative if you have the guide as a downloaded `.md` file: `Copy-Item $HOME\Downloads\setup-guide-draft.md docs\setup-guide.md` copies it in directly (`$HOME` is your user folder, e.g. `C:\Users\you`). Adjust the file name to match the download.
- **Check:** the Explorer panel shows `docs/setup-guide.md` with content.

**9c. Stage, check, commit and push**

```powershell
git add .
git status
git commit -m "chore: set up Playwright with TypeScript, example tests and CI"
git push -u origin chore/playwright-setup
```

- `git add .` stages every new and changed file in the repo root (respecting .gitignore).
- `git status` before committing: check that `node_modules/`, `test-results/` and `playwright-report/` are **not** listed.
- `git commit -m "..."` saves the staged files as one commit with that message. Message format: `type: what changed`, in the imperative.
- `git push -u origin NAME` uploads the branch to GitHub; `-u` links the local branch to it, so later pushes are just `git push`. The first push may open a browser window to sign in to GitHub (Git Credential Manager).

Then in the browser:

1. The push output prints a link (`Create a pull request for 'chore/playwright-setup' on GitHub by visiting: ...`). Open it, or use the yellow **Compare & pull request** banner on the repo page.
2. Base: `main`, compare: `chore/playwright-setup`. Add the title and description, click **Create pull request**.
3. Open the **Actions** tab (or the checks at the bottom of the PR). The workflow `Playwright Tests` (`.github/workflows/playwright.yml`) runs on Ubuntu: installs dependencies with `npm ci`, installs browsers with `npx playwright install --with-deps`, runs `npx playwright test`, and uploads the HTML report as an artefact.
4. **Check:** the run is green (all 6 tests pass, including WebKit). Only then click **Merge pull request**.
5. Locally, return to an up-to-date main:

```powershell
git switch main
git pull
```

---

## Run, debug and report commands

**Where:** VS Code terminal, in the repo root. From Week 1 Day 2 the common ones also get npm scripts (listed in the README).

| Command | What it does | When to use it |
|---|---|---|
| `npx playwright test` | Runs every test, on every browser project in `playwright.config.ts`, headless (no visible window). | Normal full run, and what CI does. |
| `npx playwright test --ui` | Opens UI mode: pick tests, watch them run step by step, time-travel through each action, Pick locator. | Writing and debugging tests day to day. |
| `npx playwright test --project=chromium` | Runs only the `chromium` project (Desktop Chrome). | Faster local runs; isolating a browser-specific failure. |
| `npx playwright test example` | Runs only test files whose path contains `example` (a filter, not an exact name). | Running one spec file. |
| `npx playwright test --debug` | Opens a visible browser plus the Playwright Inspector, paused before the first action, to step through. | Investigating one failing test. |
| `npx playwright show-report` | Opens the last HTML report in the browser. | After a run, to see results and traces. |
| `npx playwright codegen` | Opens a browser and records your clicks as test code. | **Exploring only**: to see which locator Playwright suggests. Generated code is never pasted into the repo. |
| `npx playwright --version` | Prints the installed Playwright version. | Checking the install; bug reports. |

`npx` runs the `playwright` command from this project's `node_modules`, so everyone uses the version in `package.json`.

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `npm` or `npx` fails with "running scripts is disabled on this system" | PowerShell execution policy blocks `npm.ps1` | PowerShell window: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, answer `Y`, then open a new window. |
| `node`, `git` or `code` "is not recognized" right after installing | The open PowerShell window has the old PATH | Close PowerShell and open a new window. For `code`, reinstall VS Code with "Add to PATH" ticked. |
| `DeprecationWarning: url.parse()` when running `code --install-extension` | Comes from VS Code's own command-line tool | Harmless. Ignore. |
| Commands fail or create files in odd places | PowerShell opened in `C:\Windows\System32` | `cd C:\git-personal\playwright-typescript-playground` first, or use the VS Code terminal. |
| `ERROR Cannot copy server address to clipboard` when running `npx serve webapp` | `serve` tries to copy the URL to the clipboard and fails in the VS Code terminal | Harmless: the server is running. To silence it: `npx serve webapp --no-clipboard`. |
| `Playwright Host validation warning: Host system is missing dependencies! ... libwebp.dll` at the end of `npm init playwright@latest` | Windows is missing a library one of the downloaded browsers expects. The install still finishes with `Success!`. | Only WebKit is affected: its tests fail with `browserType.launch: Host system is missing dependencies! libwebp.dll`. Chromium and Firefox pass. No official Windows fix found (2026-11-09). Workaround: run locally with `--project=chromium --project=firefox`; CI runs on Ubuntu, where `npx playwright install --with-deps` installs WebKit's libraries. From Week 1 Day 2 the config is Chromium only. |
| Windows Firewall popup on first `npx serve` | Node is opening a network port | Allow **Private networks** only. |
