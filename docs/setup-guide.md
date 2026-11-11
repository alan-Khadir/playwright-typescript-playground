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

| Purpose          | Tool                                                                                             | What it is for                                                                                                                                                                                                   | Status                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Core             | Node.js LTS (22+)                                                                                | Runs JavaScript and TypeScript outside the browser. Playwright is a Node library, so the tests run on Node.                                                                                                      | installed (Step 1)                                                                                                           |
| Core             | npm                                                                                              | Node's package manager: installs libraries listed in package.json and runs npm scripts. Comes with Node.                                                                                                         | installed (Step 1)                                                                                                           |
| Core             | Git                                                                                              | Version control: history of every change, branches, and clone/push to GitHub.                                                                                                                                    | installed (Step 1)                                                                                                           |
| Core             | @playwright/test                                                                                 | Playwright's test runner and browser automation library: `test`, `expect`, locators, fixtures, reports. Dev dependency.                                                                                          | installed Week 1 Day 1 (Step 7)                                                                                              |
| Core             | TypeScript                                                                                       | JavaScript with types, so mistakes are caught in the editor before a test runs. Playwright runs .ts files directly without it; the `typescript` package is only needed for `tsc --noEmit` and typescript-eslint. | Playwright handles .ts from Day 1; `typescript@~6.0` installed Week 1 Day 2 (Step 10g); pinned below 7 for typescript-eslint |
| Core             | @types/node                                                                                      | Type definitions for Node's built-in modules (e.g. `process.env`), so TypeScript understands them. Dev dependency.                                                                                               | installed Week 1 Day 1 (Step 7)                                                                                              |
| Serving the app  | serve                                                                                            | Small static web server that serves `webapp/` at http://localhost:3000. Dev dependency so CI runs the same version.                                                                                              | npx on Day 1; installed as dev dependency Week 1 Day 2 (Step 10d)                                                            |
| Editor           | VS Code                                                                                          | Code editor; `code` is its command-line launcher.                                                                                                                                                                | installed (Step 1)                                                                                                           |
| Editor           | Playwright Test for VS Code                                                                      | Run and debug tests from the editor; Pick locator.                                                                                                                                                               | installed (Step 2)                                                                                                           |
| Editor           | ESLint extension                                                                                 | Shows lint problems as you type.                                                                                                                                                                                 | installed (Step 2)                                                                                                           |
| Editor           | Prettier extension                                                                               | Formats code automatically on save.                                                                                                                                                                              | installed (Step 2)                                                                                                           |
| Editor           | Cucumber (official) extension                                                                    | Syntax highlighting and step navigation for .feature files.                                                                                                                                                      | installed (Step 2); used Week 6                                                                                              |
| Finding locators | Pick locator (VS Code, UI mode, Inspector); codegen; Chrome DevTools accessibility tree          | Find the user-facing locator for an element. Codegen is for exploring only, never pasted into the repo.                                                                                                          | Week 1                                                                                                                       |
| Debugging        | UI mode, trace viewer, Inspector, page.pause(), VS Code breakpoints                              | Step through tests and see exactly what happened when one fails.                                                                                                                                                 | Weeks 1-2                                                                                                                    |
| Code quality     | eslint, @eslint/js, typescript-eslint, eslint-plugin-playwright                                  | Lint rules for JavaScript, TypeScript and Playwright mistakes (e.g. a missing `await`).                                                                                                                          | installed Week 1 Day 2 (Step 10i)                                                                                            |
| Code quality     | prettier, eslint-config-prettier                                                                 | One code format for everyone; stops ESLint and Prettier fighting over formatting.                                                                                                                                | installed Week 1 Day 2 (Step 10j)                                                                                            |
| Code quality     | tsc --noEmit                                                                                     | Type-checks the whole project without producing output files.                                                                                                                                                    | set up Week 1 Day 2 (Step 10h)                                                                                               |
| Reporting        | Built-in HTML report with traces                                                                 | Shows which tests passed or failed, with a trace to replay each failure. Uploaded as a CI artefact.                                                                                                              | Week 1                                                                                                                       |
| CI               | GitHub Actions                                                                                   | Runs the tests on GitHub's machines on every push and PR.                                                                                                                                                        | Week 1 (workflow); Week 9 (branch protection, status badge)                                                                  |
| Config           | dotenv; .env (not committed) and .env.example                                                    | Loads settings such as URLs and credentials from a file instead of hard-coding them.                                                                                                                             | added in Week 2                                                                                                              |
| Test data        | @faker-js/faker                                                                                  | Generates realistic random test data (names, emails).                                                                                                                                                            | added in Week 3                                                                                                              |
| BDD              | playwright-bdd                                                                                   | Runs Gherkin .feature files on top of the same Playwright page objects and fixtures.                                                                                                                             | added in Week 6                                                                                                              |
| API under test   | express, tsx, @types/express                                                                     | The Topics API server added in Week 7, and the tool to run it in TypeScript.                                                                                                                                     | added in Week 7                                                                                                              |
| Accessibility    | @axe-core/playwright                                                                             | Automated accessibility scans inside Playwright tests.                                                                                                                                                           | added in Week 10                                                                                                             |
| Optional         | Husky and lint-staged                                                                            | Run lint on staged files before each commit.                                                                                                                                                                     | Week 9 (optional)                                                                                                            |
| Optional         | Allure                                                                                           | Alternative report; only if a target job asks for it.                                                                                                                                                            | -                                                                                                                            |
| Not used         | cucumber-js, ts-node, Jest, Mocha, Chai, axios, Docker, wait/retry libraries, locator extensions | Playwright already covers these jobs; adding them duplicates tooling.                                                                                                                                            | -                                                                                                                            |

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

| Command                          | You need                              | Verified on 2026-11-09 |
| -------------------------------- | ------------------------------------- | ---------------------- |
| `node --version`                 | v22 or higher                         | v24.16.0               |
| `npm --version`                  | any number (comes with Node)          | 11.13.0                |
| `git --version`                  | any recent version                    | 2.54.0.windows.1       |
| `code --version`                 | any recent version                    | 1.138.0                |
| `git config --global user.name`  | your GitHub username                  | set                    |
| `git config --global user.email` | an email (GitHub noreply recommended) | set                    |

### 1a. If something is missing

Install only what is missing or too old. `winget` (Windows Package Manager) is built into Windows 10/11. **After any install, close PowerShell and open a new window**, so it picks up the new commands, then re-run the check.

| Missing                    | Install with winget (PowerShell window)     | Or download manually                                                                                        |
| -------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Node.js (or older than 22) | `winget install OpenJS.NodeJS.LTS`          | https://nodejs.org: the **LTS** Windows installer (.msi), default options. npm comes with it.               |
| Git                        | `winget install Git.Git`                    | https://git-scm.com/downloads/win, default options.                                                         |
| VS Code                    | `winget install Microsoft.VisualStudioCode` | https://code.visualstudio.com. In the installer keep **"Add to PATH"** ticked, so the `code` command works. |

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

| Extension ID                     | What it is                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ms-playwright.playwright`       | Playwright Test for VS Code (Microsoft): run, debug and pick locators from the editor. `--force` updates it if an older version is already installed. |
| `dbaeumer.vscode-eslint`         | ESLint (Microsoft): lint errors shown as you type.                                                                                                    |
| `esbenp.prettier-vscode`         | Prettier: automatic code formatting.                                                                                                                  |
| `CucumberOpen.cucumber-official` | Cucumber (official): optional, used from Week 6.                                                                                                      |

Installing by ID (publisher.name) guarantees the official extension, not a lookalike.

**Check:** `code --list-extensions` lists all four IDs (in lower case).

Recommended while learning: disable AI coding assistants for this workspace (Extensions view, gear icon, **Disable (Workspace)**).

## Step 3. Create the GitHub repo

**Where:** browser, https://github.com/new (signed in to GitHub).

| Field           | Value                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------- |
| Repository name | `playwright-typescript-playground`                                                           |
| Visibility      | Public                                                                                       |
| Add a README    | On (creates the first commit and the `main` branch, so the repo can be cloned straight away) |
| .gitignore      | Node                                                                                         |
| Licence         | MIT                                                                                          |

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

| Prompt                                              | Answer            |
| --------------------------------------------------- | ----------------- |
| Need to install create-playwright... Ok to proceed? | `y`               |
| Do you want to use TypeScript or JavaScript?        | TypeScript        |
| Where to put your end-to-end tests?                 | `tests` (default) |
| Add a GitHub Actions workflow?                      | Yes               |
| Install Playwright browsers?                        | Yes               |

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

| New or changed file                | What it is                                                                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                     | The project's manifest: name, scripts and the list of dependencies.                                                               |
| `package-lock.json`                | Records the exact version of every installed package, so every machine and CI installs the same set (`npm ci`). Always committed. |
| `playwright.config.ts`             | Playwright settings: test folder, browsers (projects), reporter, retries. Rewritten line by line on Week 1 Day 2.                 |
| `tests/example.spec.ts`            | Example test from the wizard. Deleted on Week 1 Day 2.                                                                            |
| `.github/workflows/playwright.yml` | GitHub Actions workflow: runs the tests on every push and PR to main.                                                             |
| `.gitignore` (modified)            | The wizard appended Playwright's output folders (test results, report, cache) so they are never committed.                        |
| `node_modules/` (not committed)    | The installed packages themselves. Rebuilt from package-lock.json with `npm ci`.                                                  |

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

This step follows the standard **Git workflow** (see that section below) with branch `chore/playwright-setup` and commit message `chore: set up Playwright with TypeScript, example tests and CI`. The one extra action on Day 1 is creating this guide, after the branch is made (workflow step 1) and before staging (workflow step 2):

```powershell
New-Item -ItemType Directory -Force docs
New-Item docs\setup-guide.md
code docs\setup-guide.md
```

- `New-Item -ItemType Directory -Force docs` creates the `docs` folder in the repo root (`-Force`: no error if it already exists). All repo documents live here.
- `New-Item docs\setup-guide.md` creates an empty file (`New-Item` without `-ItemType` creates a file).
- `code docs\setup-guide.md` opens that file in the current VS Code window. Paste the guide as **Markdown source** (lines starting `#`, tables made of `|`), not rendered text, and save with **Ctrl+S**.
- Alternative if you have the guide as a downloaded `.md` file: `Copy-Item $HOME\Downloads\setup-guide-draft.md docs\setup-guide.md` (`$HOME` is your user folder). Adjust the file name to match the download.

**Check:** the PR's check `Playwright Tests / test (pull_request)` is green. The workflow (`.github/workflows/playwright.yml`) runs on Ubuntu: `npm ci`, `npx playwright install --with-deps`, `npx playwright test` (all 3 browsers), then uploads the HTML report as an artefact. Verified 2026-11-09: green in 52s, WebKit included.

---

## Step 10. Configure the framework (Week 1 Day 2)

Turns the wizard's example project into our framework: tidy package.json, line endings, `serve` as a dev dependency, Playwright config, strict TypeScript, ESLint, Prettier and npm scripts.

### 10a. Create the branch

**Where:** PowerShell or VS Code terminal, `PS C:\git-personal\playwright-typescript-playground>`

```powershell
git switch main
git pull
git switch -c chore/config-and-linting
```

- `git switch main` then `git pull`: start from the latest main.
- `git switch -c NAME`: `-c` creates the branch and switches to it in one step. Branch first so every change goes through a PR and CI, never straight onto main.

**Check:** `git status` shows `On branch chore/config-and-linting`.

### 10b. Tidy package.json

**Where:** VS Code, `package.json` in the repo root.

`npm init playwright@latest` leaves npm's defaults in package.json. Change it so that:

- `"private": true` is added: npm refuses to publish the project to the public npm registry by accident. This is a test project, not a library.
- `"license": "MIT"`: matches the LICENSE file GitHub created (npm's default is ISC).
- `"main": "index.js"` is removed: it names the entry file of a library, and that file doesn't exist here.
- Empty `"keywords": []` and `"author": ""` are removed: they are only used when publishing.

Then, in the terminal at `PS C:\git-personal\playwright-typescript-playground>`:

```powershell
npm install
git diff --stat
```

- `npm install` updates package-lock.json so it agrees with the edited package.json (the root entry's licence). No packages change.
- `git diff --stat` lists the changed files and line counts.

**Check:** `npm install` says `up to date`; `git diff --stat` shows `package.json` and `package-lock.json` only.

### 10c. Line endings: .gitattributes

Linux and Mac end each line with LF; Windows traditionally uses CRLF. Git for Windows converts between them (`core.autocrlf`), which caused the `LF will be replaced by CRLF` warnings on Day 1. Prettier expects LF, so CRLF files on a Windows disk would fail `prettier --check` locally while CI (Linux) passes. A `.gitattributes` file in the repo sets the rule for every machine, so nobody needs a personal Git setting.

**Where:** VS Code, new file `.gitattributes` in the repo root:

```gitattributes
# Store and check out every text file with LF line endings, on every machine.
* text=auto eol=lf
```

- `*`: applies to every file.
- `text=auto`: Git decides which files are text; binary files (images, zips) are left alone.
- `eol=lf`: text files are stored and checked out with LF, whatever the OS or personal settings.

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
git add --renormalize .
git status
```

- `git add --renormalize .`: re-applies the line-ending rule to every tracked file and stages any file whose stored line endings change.
- `git status`: **Check:** `package.json` and `package-lock.json` staged, `.gitattributes` untracked (it is new; `--renormalize` only touches tracked files). No other files means everything was already stored as LF.

The files on disk are still CRLF: Git applies the rule only when it writes files out. Commit, then make Git write every file again.

```powershell
git add .gitattributes
git commit -m "chore: tidy package.json and enforce LF line endings"
git status
git rm -r -q --cached .
git reset --hard
git status
```

- `git add .gitattributes` then `git commit -m "..."`: commit the tidy-up. `chore:` follows Conventional Commits (`chore` tooling/config, `feat` new test or feature, `fix` bug fix, `docs` documentation).
- `git status`: must say `nothing to commit, working tree clean` before the next two commands, which discard uncommitted changes.
- `git rm -r -q --cached .`: empties Git's staging list (index) without touching files on disk. `-r` all folders, `-q` quiet, `--cached` index only.
- `git reset --hard`: rewrites every file from the last commit, now with LF. Safe only because everything is committed.

**Check:** reopen `package.json` in VS Code; the status bar (bottom right) says `LF`. `git status` is clean.

### 10d. Add serve as a dev dependency

On Day 1 the app was started with `npx serve webapp`, which fetches whatever serve version is newest. From now on Playwright starts the app itself (`webServer` in the config, Step 10e), locally and in CI, so serve is pinned in package.json and every machine runs the same version.

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
npm install --save-dev serve
git diff --stat
```

- `npm install --save-dev serve`: installs serve and records it under `devDependencies` in package.json (needed to develop and test, not part of a product), with the exact version pinned in package-lock.json. `npm ci` in CI installs it too.
- `git diff --stat`: **Check:** package.json and package-lock.json changed; package.json has `"serve": "^14...."` under devDependencies.

npm reports `2 high severity vulnerabilities`. Check what they are before fixing anything:

```powershell
npm audit
```

- `npm audit`: lists known security advisories in the installed packages and which package pulls each one in.
- Result (2026-11-10): `compression <1.8.2` (denial of service), pulled in by serve. The suggested `npm audit fix --force` would downgrade serve to 10.0.2 (2018), a breaking change. **Not applied:** serve only runs on our own PC and the CI runner, never on the internet, so nobody can attack it. Revisit when a newer serve fixes it. See Troubleshooting.

### 10e. Playwright config (playwright.config.ts)

**Where:** VS Code, `playwright.config.ts` in the repo root. Edit the wizard's file in place; its commented-out examples (dotenv, mobile, branded browsers) are kept as a reference of what the file can do.

1. In `use`, uncomment `baseURL`:

```ts
    baseURL: 'http://localhost:3000',
```

2. In `projects`, comment out firefox and webkit (select the lines, **Ctrl+/**) and add the reason above them:

```ts
/* Chromium only on every run. All browsers return as a nightly run in Week 9. */
// {
//   name: 'firefox',
//   use: { ...devices['Desktop Firefox'] },
// },
// {
//   name: 'webkit',
//   use: { ...devices['Desktop Safari'] },
// },
```

3. Replace the commented-out `webServer` block at the bottom with:

```ts
  /* Start the app before the tests and stop it afterwards. */
  webServer: {
    /* --no-port-switching: fail if 3000 is busy instead of quietly using another port. */
    command: 'npx serve webapp --listen 3000 --no-port-switching --no-clipboard',
    /* Wait until the app answers here before running tests. */
    url: 'http://localhost:3000',
    /* Locally, reuse a server already running; on CI always start a fresh one. */
    reuseExistingServer: !process.env.CI,
  },
```

Every live setting in the finished file:

| Line                                      | What it does                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `defineConfig`, `devices`                 | `defineConfig` gives autocomplete and type checks for the settings; `devices` holds ready-made browser settings.                                                                     |
| `testDir: './tests'`                      | Where test files live.                                                                                                                                                               |
| `fullyParallel: true`                     | Tests run in parallel, even inside one file; forces independent tests.                                                                                                               |
| `forbidOnly: !!process.env.CI`            | CI fails if a `test.only` was left in. `process.env.CI` is set on GitHub runners; `!!` makes it true/false.                                                                          |
| `retries: process.env.CI ? 2 : 0`         | CI retries a failed test up to twice; tests that pass on retry are marked flaky. Locally 0.                                                                                          |
| `workers: process.env.CI ? 1 : undefined` | CI runs one test at a time (small runners); locally Playwright picks from the CPU count.                                                                                             |
| `reporter: 'html'`                        | Built-in HTML report (`npx playwright show-report`).                                                                                                                                 |
| `baseURL`                                 | Tests write paths only, e.g. `page.goto('/html/signin.html')`.                                                                                                                       |
| `trace: 'on-first-retry'`                 | Records a trace only when a failed test is retried (so in CI). Locally use `--trace on`.                                                                                             |
| `projects` (chromium only)                | Chromium on every run; all browsers return as a nightly job in Week 9. `...devices['Desktop Chrome']` copies that device's settings in.                                              |
| `webServer.command`                       | Starts the app with the pinned serve. `--listen 3000` port; `--no-port-switching` fail if 3000 is busy instead of picking another port; `--no-clipboard` avoids the clipboard error. |
| `webServer.url`                           | Playwright waits until this answers (default up to 60 s) before running tests, and stops the server afterwards.                                                                      |
| `reuseExistingServer: !process.env.CI`    | Locally, reuse a server already running on 3000; in CI always start a fresh one (fails if the port is taken).                                                                        |

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
npx playwright test --reporter=list
```

- `--reporter=list`: one line per test in the terminal, instead of only the HTML report.
- **Check:** `Running 2 tests using 2 workers`, `[chromium]` only, `2 passed` (example tests still present at this point). No web server error means `webServer` started the app.

### 10f. Delete the example tests

The wizard's `tests/example.spec.ts` tests playwright.dev, not our app. Our own tests start on Week 1 Day 3.

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
Get-ChildItem -Recurse tests
Remove-Item tests\example.spec.ts
npx playwright test --reporter=list
```

- `Get-ChildItem -Recurse tests`: lists every file in `tests\` and its subfolders (`ls`/`dir` are short names for it). Look before you delete.
- `Remove-Item tests\example.spec.ts`: deletes the example test file.
- `npx playwright test --reporter=list`: runs the suite with no tests left. **Check:** `Error: No tests found` (exit code 1). This is deliberate: an empty run fails so a wrong `testDir` can't pass silently. Until the first real test (Week 1 Day 3) the `test` npm script added `--pass-with-no-tests`; it has now been removed (Step 10k).

Commit:

```powershell
git add -A
git status
git commit -m "chore: configure baseURL, webServer and Chromium only; remove example tests"
```

- `git add -A`: stages every change, including deleted files.
- `git status`: **Check:** `playwright.config.ts`, `package.json`, `package-lock.json` modified; `tests/example.spec.ts` deleted.
- `git commit -m "..."`: saves the snapshot locally.

### 10g. TypeScript compiler

Playwright runs `.ts` files without the `typescript` package, but it only strips the types out; it does not check them. The type check (`tsc --noEmit`) needs the real compiler.

```powershell
npm install --save-dev typescript@~6.0
npx tsc --version
```

- `npm install --save-dev typescript@~6.0`: installs the TypeScript compiler (`tsc`) as a dev dependency, pinned to 6.0.x. `~6.0` means "6.0.anything, never 6.1 or 7". **Why not the latest (7.x):** TypeScript 7 (the new Go-based compiler) has no stable compiler API yet, and typescript-eslint (Step 10i) needs that API. typescript-eslint 8 only accepts `typescript >=4.8.4 <6.1.0` (see typescript-eslint issue #12518). Move to 7 when typescript-eslint supports it.
- `npx tsc --version`: **Check:** `Version 6.0.x`.

### 10h. Strict tsconfig.json

**Where:** VS Code, new file `tsconfig.json` in the repo root:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "playwright-report", "test-results"]
}
```

| Setting                                  | What it does                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `target: "ES2023"`                       | Which JavaScript features TypeScript assumes exist (Node 24 supports ES2023).                                                              |
| `module`, `moduleResolution: "nodenext"` | Understand `import` the way Node does; current recommended setting for code run by Node.                                                   |
| `types: ["node"]`                        | Load Node's type definitions from `@types/node` (e.g. `process.env`). Set explicitly because TypeScript 6 no longer loads them by default. |
| `strict: true`                           | Strictest checks; above all, every value must have a known type, never a silent `any`. Enforces the "no any" rule.                         |
| `noUncheckedIndexedAccess: true`         | `list[3]` is typed as possibly `undefined`, catching out-of-range mistakes.                                                                |
| `noEmit: true`                           | `tsc` only checks; it writes no `.js` files (Playwright runs the `.ts` files itself).                                                      |
| `skipLibCheck: true`                     | Don't type-check packages in node_modules, only our code. Faster.                                                                          |
| `include` / `exclude`                    | Check every `.ts` file except installed packages and generated report folders.                                                             |

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
npx tsc --noEmit
```

- `npx tsc --noEmit`: type-checks every `.ts` file in the project and writes no output files. **Check:** prints nothing (silence = no type errors).

Optional check that strict mode works: create `tests\scratch.ts` containing `function greet(name) { return 'Hello ' + name; }`, run `npx tsc --noEmit`, and expect `error TS7006: Parameter 'name' implicitly has an 'any' type.` Then delete it: `Remove-Item tests\scratch.ts`.

Commit:

```powershell
git add -A
git status
git commit -m "chore: add strict tsconfig and TypeScript 6.0"
```

**Check:** `git status` before committing shows `tsconfig.json` (new), `package.json`, `package-lock.json`.

### 10i. ESLint

The three code checks, and what each one catches:

| Check                     | Question it answers                                  | Example it catches (✘) and the fix (✔)            |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `tsc --noEmit` (Step 10h) | Is it the right type?                                | ✘ `toHaveTitle(123)` ✔ `toHaveTitle('Dashboard')` |
| ESLint (this step)        | Is it good practice? Code is valid but risky.        | ✘ `page.goto('/')` ✔ `await page.goto('/')`       |
| Prettier (Step 10j)       | Is it formatted the same way? Never changes meaning. | ✘ `{email:"a"}` ✔ `{ email: 'a' }`                |

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-playwright
```

- `eslint`: the linter (10.x).
- `@eslint/js`: ESLint's recommended JavaScript rules.
- `typescript-eslint`: lets ESLint read TypeScript and adds TypeScript rules, including type-aware ones such as `no-floating-promises` (missing `await`). Needs `typescript` below 6.1 (Step 10g).
- `eslint-plugin-playwright`: Playwright rules, e.g. `no-wait-for-timeout`, `missing-playwright-await`.

**Check:** installs without `ERESOLVE` errors. Tested 2026-11-10: eslint 10.14.0, @eslint/js 10.0.1, typescript-eslint 8.72.2, eslint-plugin-playwright 2.12.2 with typescript 6.0.3.

npm then reports `12 vulnerabilities (10 moderate, 2 high)`. The 2 high are serve's (Step 10d). The 10 moderate are one advisory: `minimatch` (GHSA-g3hv-75wg-m249, denial of service from a crafted file pattern), used inside ESLint and typescript-eslint. `npm audit fix --force` would downgrade ESLint to 9. **Not applied:** the linter only runs on our own code, on our machines and CI, with our own patterns. Re-check with `npm audit` when ESLint or typescript-eslint update.

**Where:** VS Code, new file `eslint.config.mjs` in the repo root (`.mjs` = a JavaScript module file; ESLint's config format). Final version shown, as formatted by Prettier; the `eslintConfigPrettier` lines are added in Step 10j:

```js
// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig(
  /* Folders ESLint never checks: installed packages, generated reports, and the app under test. */
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'webapp/',
    ],
  },

  /* Basic JavaScript rules, e.g. unused variables. */
  eslint.configs.recommended,

  /* TypeScript rules that use type information, e.g. no-floating-promises (missing await), no any. */
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        /* Let typescript-eslint read tsconfig.json so it knows every type. */
        projectService: true,
      },
    },
  },

  /* This file is plain JavaScript, not in tsconfig, so skip the type-aware rules for .mjs files. */
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  /* Playwright rules, only for test files: e.g. no waitForTimeout, await your expect. */
  {
    files: ['tests/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
  },

  /* Last: switch off every ESLint rule about formatting, because Prettier owns formatting. */
  eslintConfigPrettier,
);
```

```powershell
npx eslint .
```

- `npx eslint .`: lints every file in the repo (`.` = this folder) except the ignored ones. **Check:** prints nothing (no problems).

Optional check that the rules work: create `tests\scratch.spec.ts` with a test that calls `page.goto('/')` without `await`, `await page.waitForTimeout(1000)`, and `expect(page).toHaveURL('/')` without `await`. `npx eslint .` reports 4 problems (`no-floating-promises` twice, `playwright/missing-playwright-await`, and the warning `playwright/no-wait-for-timeout`). Each line shows `line:column`, level, message and the rule name. Errors fail the run; warnings only print, so the `lint` script adds `--max-warnings 0` (Step 10k). Delete the file afterwards.

Commit:

```powershell
Remove-Item tests\scratch.spec.ts
git add -A
git status
git commit -m "chore: add ESLint with typescript-eslint and eslint-plugin-playwright"
```

**Check:** `git status` shows `eslint.config.mjs` (new), `package.json`, `package-lock.json`.

### 10j. Prettier and editor settings

Prettier formats code (spaces, quotes, line length) so it looks the same whoever wrote it. `eslint-config-prettier` turns off ESLint's formatting rules so the two tools never disagree: ESLint owns practice, Prettier owns looks.

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
npm install --save-dev prettier eslint-config-prettier
```

- `prettier`: the formatter (3.x).
- `eslint-config-prettier`: switches off ESLint rules that clash with Prettier. Tested 2026-11-10: prettier 3.9.10, eslint-config-prettier 10.1.8.

**Where:** VS Code, new files in the repo root.

`.prettierrc.json` (only the choices that differ from Prettier's defaults):

```json
{
  "singleQuote": true
}
```

- `singleQuote`: `'text'` instead of `"text"`, matching Playwright's docs.

`.prettierignore`:

```
webapp/
package-lock.json
```

- `webapp/`: the app under test is never modified.
- `package-lock.json`: written by npm, never hand-edited. Prettier already skips `node_modules` and everything in `.gitignore`.

`.vscode\settings.json` (create the `.vscode` folder first; shared editor settings for everyone who opens the repo):

```json
{
  "files.eol": "\n",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

- `files.eol`: new files are created with LF (VS Code on Windows defaults to CRLF, which caused `CRLF will be replaced by LF` on `git add`).
- `editor.defaultFormatter`: use the Prettier extension (Step 2).
- `editor.formatOnSave`: format the file on every Ctrl+S.

```powershell
npx prettier --check .
```

- `npx prettier --check .`: lists files that are not formatted; changes nothing (safe, used in CI). **Check:** first time, 8 files listed (files created on Windows with CRLF, long lines, Markdown tables).

```powershell
npx prettier --write .
npx prettier --check .
npx eslint .
npx tsc --noEmit
git diff --stat
```

- `npx prettier --write .`: rewrites every listed file in Prettier's style (layout only, never behaviour), with LF line endings.
- `npx prettier --check .`: **Check:** `All matched files use Prettier code style!`
- `npx eslint .` and `npx tsc --noEmit`: still silent after formatting.
- `git diff --stat`: shows which files Prettier changed.

Tell ESLint to use `eslint-config-prettier`. In `eslint.config.mjs`, add the import under the others and add it as the **last** item (ESLint applies items top to bottom and later ones win, so last means nothing can switch formatting rules back on):

```js
import eslintConfigPrettier from 'eslint-config-prettier/flat';
```

```js
  /* Last: switch off every ESLint rule about formatting, because Prettier owns formatting. */
  eslintConfigPrettier,
);
```

Commit:

```powershell
npx eslint .
npx prettier --check .
git add -A
git status
git commit -m "chore: add Prettier, VS Code settings, and format the repo"
```

**Check:** eslint silent; Prettier `All matched files use Prettier code style!`; `git status` shows `.prettierrc.json`, `.prettierignore`, `.vscode/settings.json` new, plus reformatted files.

### 10k. npm scripts

Short names for the checks, so everyone and CI run them the same way. **Where:** VS Code, `package.json`, replace `"scripts": {},` with:

```json
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
```

| Script                 | Command                     | What it does                                                                                                                                                                                             |
| ---------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`             | `playwright test`           | Runs every test. (Until Week 1 Day 3 it was `playwright test --pass-with-no-tests`, because there were no tests yet. Removed once the first test existed, so an empty or misconfigured run fails again.) |
| `npm run test:ui`      | `playwright test --ui`      | UI mode, for writing and debugging tests.                                                                                                                                                                |
| `npm run lint`         | `eslint . --max-warnings 0` | ESLint; `--max-warnings 0` makes warnings (e.g. `waitForTimeout`) fail too.                                                                                                                              |
| `npm run typecheck`    | `tsc --noEmit`              | Type check only.                                                                                                                                                                                         |
| `npm run format`       | `prettier --write .`        | Fixes formatting. Run before committing.                                                                                                                                                                 |
| `npm run format:check` | `prettier --check .`        | Reports formatting problems only. Used in CI.                                                                                                                                                            |

No `npx` inside scripts: npm adds `node_modules/.bin` to the PATH while a script runs, so the project's own `eslint`, `tsc`, `prettier`, `playwright` are found directly. `npm test` is the only script that works without `run`.

**Where:** terminal at `PS C:\git-personal\playwright-typescript-playground>`

```powershell
npm test
npm run lint
npm run typecheck
npm run format:check
git diff --stat
```

**Check:** each `npm run` first prints a header (`> playwright-typescript-playground@1.0.0 lint` and the command); anything after it is the tool's output. `npm test` exits without error and prints `To open last HTML report run: npx playwright show-report`; lint and typecheck print only the header; format:check prints `All matched files use Prettier code style!`. If format:check lists `package.json`, the pasted block's layout differs from Prettier's: run `npm run format`.

Commit:

```powershell
npm run format
npm run format:check
git add -A
git status
git commit -m "chore: add npm scripts for test, lint, typecheck and format"
```

### 10l. CI runs the tests through npm test

**Where:** VS Code, `.github\workflows\playwright.yml`. Change the test step's command (keep the indentation; in YAML leading spaces matter):

```yaml
run: npm test
```

(was `run: npx playwright test`). CI now runs exactly the command developers run. (`--pass-with-no-tests` was removed in Week 1 Day 3 once the first test existed.) Lint, typecheck and format checks are added to CI in Week 1 Day 4.

**Week 1 Day 3 change:** in `.github/workflows/playwright.yml` the browser step is now `run: npx playwright install --with-deps chromium` (was `npx playwright install --with-deps`). We only test on Chromium, and installing all three browsers' Linux packages was slow and failed when Ubuntu's package servers were unreachable (see Troubleshooting).

```powershell
npm run format:check
git add -A
git commit -m "ci: run tests through npm test"
```

## Step 11. First page object and test (Week 1 Day 3)

**Where:** VS Code terminal, repo root `PS C:\git-personal\playwright-typescript-playground>`.

```powershell
git switch main                  # go to the main branch
git pull                         # bring down the latest main from GitHub
git switch -c feat/sign-in-tests # -c = create today's branch and switch to it
```

**Where:** VS Code Explorer → New File. Type the full path; VS Code creates the folders. (`tests/` was empty after Day 2 and Git doesn't store empty folders, so it isn't there until a file is added.)

| File                                  | What it is                                                                                                                                                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/pages/SignInPage.ts`           | Page object for the sign-in screen: three locators (`getByLabel('Email')`, `getByLabel('Password')`, `getByRole('button', { name: 'Sign In' })`) and two actions (`goto()`, `signIn(email, password)`). No `expect`. |
| `tests/specs/sign-in/sign-in.spec.ts` | Test "valid user reaches the dashboard": signs in as `user@test.com` / `Password123`, then checks the URL (`toHaveURL('/html/dashboard.html')`) and the "Choose a Topic" heading (`toBeVisible()`).                  |

Folder layout follows the plan: `tests/specs/<app area>/` mirrors `tests/pages/`. Details and rules: `docs/architecture.md`.

**`package.json`:** the `test` script changes from `playwright test --pass-with-no-tests` to `playwright test` (Step 10k), now that a test exists.

**Check (fastest first):**

```powershell
npm run format:check                          # 1. Prettier: "All matched files use Prettier code style!"
npm run lint                                  # 2. ESLint: no output = no problems
npm run typecheck                             # 3. tsc: no output = no type errors
npx playwright test sign-in --reporter=list   # 4. only files whose path contains "sign-in"
```

Expected for step 4: `✓ ... tests\specs\sign-in\sign-in.spec.ts:40:3 › Sign in › valid user reaches the dashboard` and `1 passed`.

## Run, debug and report commands

**Where:** VS Code terminal, in the repo root.

**npm scripts vs npx.** The standard checks are npm scripts (Step 10k): `npm test`, `npm run lint`, `npm run typecheck`, `npm run format`, `npm run format:check`. Use them before every commit; CI runs the same ones, so there is one definition of each check. Use `npx playwright ...` (below) for one-off runs with your own options while exploring or debugging. Both run the same Playwright from `node_modules`; `npm test` just has the agreed flags built in.

**Order before every commit (fastest first):** `npm run format:check` (fix with `npm run format`) → `npm run lint` → `npm run typecheck` → `npm test`. A typo then fails in seconds, not as a confusing test failure. CI uses the same order (from Week 1 Day 4).

| Command                                  | What it does                                                                                                                                                                                           | When to use it                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx serve webapp --listen 3000`         | Starts the app by hand at http://localhost:3000 (uses the serve version pinned in `package.json`). Open http://localhost:3000/html/signin.html. Stop it with Ctrl+C.                                   | Looking at the app or using Pick locator / codegen. Not needed for `npm test`: Playwright starts the app itself (webServer), and reuses this one if it's already running. |
| `npx playwright test`                    | Runs every test, on every browser project in `playwright.config.ts`, headless (no visible window).                                                                                                     | Normal full run, and what CI does.                                                                                                                                        |
| `npx playwright test --ui`               | Opens UI mode: pick tests, watch them run step by step, time-travel through each action, Pick locator.                                                                                                 | Writing and debugging tests day to day.                                                                                                                                   |
| `npx playwright test --project=chromium` | Runs only the `chromium` project (Desktop Chrome).                                                                                                                                                     | Isolating a browser-specific failure. Since Week 1 Day 2 Chromium is the only project, so it changes nothing until more browsers return (Week 9).                         |
| `npx playwright test example`            | Runs only test files whose path contains `example` (a filter, not an exact name).                                                                                                                      | Running one spec file.                                                                                                                                                    |
| `npx playwright test --reporter=list`    | Same run, but prints one line per test in the terminal (✓/✘, browser, file, test name, time) instead of only writing the HTML report. Overrides `reporter` for this run only; the config is unchanged. | Quick terminal check; pasting results.                                                                                                                                    |
| `npx playwright test --trace on`         | Records a trace for every test in this run (the config only records on a retry).                                                                                                                       | Debugging locally, where there are no retries.                                                                                                                            |
| `npx playwright test --debug`            | Opens a visible browser plus the Playwright Inspector, paused before the first action, to step through.                                                                                                | Investigating one failing test.                                                                                                                                           |
| `npx playwright show-report`             | Opens the last HTML report in the browser.                                                                                                                                                             | After a run, to see results and traces.                                                                                                                                   |
| `npx playwright codegen`                 | Opens a browser and records your clicks as test code.                                                                                                                                                  | **Exploring only**: to see which locator Playwright suggests. Generated code is never pasted into the repo.                                                               |
| `npx playwright --version`               | Prints the installed Playwright version.                                                                                                                                                               | Checking the install; bug reports.                                                                                                                                        |

`npx` runs the `playwright` command from this project's `node_modules`, so everyone uses the version in `package.json`.

## Git workflow (every change)

**Where:** VS Code terminal, in the repo root. Used for every piece of work from Day 1 onwards. Lessons refer to this section instead of repeating it.

**The rule:** nothing is committed straight to `main`. Every change goes on a branch, through a pull request (PR), and is merged only when GitHub Actions is green. Docs changes go in the same commit as the code they describe.

**Worked example, start to finish** (Week 1 Day 3: adding the sign-in tests). `TYPE/short-description` in the steps below is the branch name, here `feat/sign-in-tests`.

```powershell
# 1. Start: latest main, then a new branch for this piece of work
git switch main                              # go to main
git pull                                     # get the latest main from GitHub
git switch -c feat/sign-in-tests             # create the branch and move onto it

# 2. Work: write tests/specs/sign-in/sign-in.spec.ts, save often

# 3. Checks: the same four CI runs
npm run format                               # fix layout
npm run lint                                 # bad practice? must print no problems
npm run typecheck                            # wrong types? must print no errors
npm test                                     # all tests pass?

# 4. Commit: a snapshot on your PC only
git add .                                    # stage every changed file
git status                                   # check the list is what you expect
git commit -m "feat: add sign-in tests for valid and wrong password"

# 5. Push: copy the branch to GitHub, then open the PR in the browser
git push -u origin feat/sign-in-tests

# 6. Wait for CI green on the PR, then Squash and merge, then Delete branch (browser)

# 7. Clean up on your PC
git switch main                              # back to main
git pull                                     # download the squashed commit
git branch -D feat/sign-in-tests             # delete your local branch
git fetch --prune                            # delete the stale origin/feat/sign-in-tests bookmark
```

### 1. Start from an up-to-date main and create a branch

```powershell
git status
git switch main
git pull
git switch -c TYPE/short-description
```

- `git status` first: **Check** it says `nothing to commit, working tree clean`. Uncommitted changes would be carried onto the new branch and mixed into unrelated work. If there are leftovers, commit them on their own branch first, or ask before discarding them.
- `git switch main` moves to the main branch.
- `git pull` downloads new commits from GitHub and updates your main, so the branch starts from the latest code. Run it even if `git switch main` says "up to date with 'origin/main'": that message compares against your last-fetched copy of GitHub, not GitHub itself.
- `git switch -c NAME` creates a new branch from where you are and moves onto it (`-c` = create). Uncommitted files come with you.
- Branch names: `TYPE/short-description`, lower case with hyphens. `chore/` setup and tooling, `feat/` new tests or features, `fix/` fixes, `docs/` docs only. Example: `feat/sign-in-tests`.
- **Check:** `git status` shows `On branch TYPE/short-description`.

### 2. Run the checks, then stage and commit

Before every commit, run the same four checks CI runs. Fix anything they report before committing.

```powershell
npm run format
npm run lint
npm run typecheck
npm test
```

- `npm run format`: Prettier fixes the layout of every file (format-on-save usually already has).
- `npm run lint`: ESLint; must print no problems (warnings fail too).
- `npm run typecheck`: tsc; must print no errors.
- `npm test`: every test passes.

Then:

```powershell
git add .
git status
git commit -m "type: what changed"
```

- `git add .` stages (marks for the next commit) every new and changed file under the current folder, except what `.gitignore` excludes.
- `git status` shows what will be committed. **Check** that `node_modules/`, `test-results/` and `playwright-report/` are not listed.
- `git commit -m "..."` saves the staged files as one commit. Message format: `type: what changed`, imperative, same types as branch names. Example: `feat: add sign-in tests for valid and wrong password`.

### 3. Push

```powershell
git push -u origin TYPE/short-description
```

- Uploads the branch to GitHub (`origin` = the GitHub copy of the repo).
- `-u` (upstream) links your local branch to the GitHub one, so later pushes on this branch are just `git push`.
- The first push on a machine may open a browser window to sign in to GitHub.
- The output prints a link to create a pull request.

### 4. Open a pull request (browser)

1. Open the link from the push output, or the **Compare & pull request** banner on the repo page.
2. Base: `main`. Compare: your branch.
3. Title: same style as the commit message. Description: what changed, why, and how it was tested (with real results).
4. Click **Create pull request**. GitHub Actions starts automatically.

More commits on the same branch (fixes, review changes): repeat step 2, then `git push`. The PR updates and CI runs again.

### 5. Merge when green (browser)

1. **Check:** all checks at the bottom of the PR are green. Never merge on red or while checks are running.
2. Merge button arrow: choose **Squash and merge**, then **Confirm squash and merge**.
3. Click **Delete branch**.

Merge options on GitHub, and why this repo uses squash:

| Option                           | What it does                                                                         | Result on main                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Squash and merge** (used here) | Combines all the PR's commits into one new commit, with the PR title as its message. | One commit per PR; history reads like a changelog.                         |
| Create a merge commit            | Keeps every branch commit and adds a "Merge pull request #N" commit.                 | Full detail, but noisy ("fix typo", "try again") plus extra merge commits. |
| Rebase and merge                 | Replays each branch commit onto main, no merge commit.                               | Linear, but every small commit lands on main.                              |

Workplace note: many teams use merge commits or rebase; what matters is that one option is used consistently (often enforced in the repo settings). The reasoning for this repo is in the decision records.

### 6. Clean up locally

```powershell
git switch main
git pull
git branch -D TYPE/short-description
git fetch --prune
git log --oneline
```

- `git switch main` then `git pull`: back on main, with the merged commit downloaded.
- `git branch -D NAME` deletes the local branch. Capital `-D` is needed after a squash merge: the squash made a new commit on main, so Git can't see the branch's own commits were merged and lowercase `-d` refuses with "not fully merged". The work is safe in main.
- `git fetch --prune` downloads updates and removes stale **remote-tracking branches**. Git keeps three copies of a branch name: the local branch, the branch on GitHub, and `origin/NAME`, a local bookmark of where the GitHub branch was at the last fetch or pull. Deleting a branch on GitHub leaves the bookmark behind until it is pruned.
- `git log --oneline` shows the history, one commit per line, newest first. **Check:** the squashed commit is at the top.

### Everyday status commands

| Command             | What it does                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `git status`        | Current branch, and which files are changed, staged or untracked.                                               |
| `git log --oneline` | History, one line per commit.                                                                                   |
| `git branch -a`     | All branches: local, and remote-tracking (`remotes/origin/...`).                                                |
| `git diff`          | Exact line changes not yet staged. `git diff --staged` for staged ones.                                         |
| `git diff --stat`   | Summary only: each changed file and how many lines were added or removed. Quick sanity check before committing. |
| `git restore FILE`  | Throws away uncommitted changes to FILE (cannot be undone).                                                     |

## Troubleshooting

| Problem                                                                                                                                                                                         | Cause                                                                                                                                                                                                                 | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm` or `npx` fails with "running scripts is disabled on this system"                                                                                                                          | PowerShell execution policy blocks `npm.ps1`                                                                                                                                                                          | PowerShell window: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, answer `Y`, then open a new window.                                                                                                                                                                                                                                                                                                     |
| `node`, `git` or `code` "is not recognized" right after installing                                                                                                                              | The open PowerShell window has the old PATH                                                                                                                                                                           | Close PowerShell and open a new window. For `code`, reinstall VS Code with "Add to PATH" ticked.                                                                                                                                                                                                                                                                                                                                   |
| `DeprecationWarning: url.parse()` when running `code --install-extension`                                                                                                                       | Comes from VS Code's own command-line tool                                                                                                                                                                            | Harmless. Ignore.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Commands fail or create files in odd places                                                                                                                                                     | PowerShell opened in `C:\Windows\System32`                                                                                                                                                                            | `cd C:\git-personal\playwright-typescript-playground` first, or use the VS Code terminal.                                                                                                                                                                                                                                                                                                                                          |
| `ERROR Cannot copy server address to clipboard` when running `npx serve webapp`                                                                                                                 | `serve` tries to copy the URL to the clipboard and fails in the VS Code terminal                                                                                                                                      | Harmless: the server is running. To silence it: `npx serve webapp --no-clipboard`.                                                                                                                                                                                                                                                                                                                                                 |
| `Playwright Host validation warning: Host system is missing dependencies! ... libwebp.dll` at the end of `npm init playwright@latest`                                                           | Windows is missing a library one of the downloaded browsers expects. The install still finishes with `Success!`.                                                                                                      | Only WebKit is affected: its tests fail with `browserType.launch: Host system is missing dependencies! libwebp.dll`. Chromium and Firefox pass. No official Windows fix found (2026-11-09). Workaround: run locally with `--project=chromium --project=firefox`; CI runs on Ubuntu, where `npx playwright install --with-deps` installs WebKit's libraries. From Week 1 Day 2 the config is Chromium only.                         |
| `npm install` says `2 high severity vulnerabilities` after adding serve                                                                                                                         | serve 14 depends on an old `compression` package with a denial-of-service advisory (GHSA-vc2v-76pw-4v95).                                                                                                             | Accepted, not fixed: serve is a dev dependency that only runs locally and in CI, not exposed to the internet. Do **not** run `npm audit fix --force`: it downgrades serve to 10.0.2. Re-check with `npm audit` when serve updates. The 10 moderate (`minimatch`, inside ESLint) are accepted for the same reason: `--force` would downgrade ESLint to 9.                                                                           |
| `npm install --save-dev typescript` installs 7.x; later typescript-eslint fails with `ERESOLVE` (peer `typescript@">=4.8.4 <6.1.0"`) or ESLint crashes                                          | TypeScript 7 (Go compiler) has no stable compiler API yet, which typescript-eslint needs                                                                                                                              | Install `typescript@~6.0`. Upgrade only when typescript-eslint lists 7 in its supported range.                                                                                                                                                                                                                                                                                                                                     |
| `warning: in the working copy of 'X', CRLF will be replaced by LF` on `git add` for a new file                                                                                                  | VS Code on Windows saves new files with CRLF by default                                                                                                                                                               | Harmless (Git stores LF). Fixed at the source by `"files.eol": "\n"` in `.vscode/settings.json` (Step 10j); `npx prettier --write .` rewrites existing files with LF.                                                                                                                                                                                                                                                              |
| `prettier --check` flags a file you just saved in VS Code                                                                                                                                       | Format-on-save didn't run. Most common cause: VS Code **Auto Save** is on with `afterDelay`, and format-on-save never runs on delayed auto-saves. Otherwise VS Code hadn't loaded the new `.vscode/settings.json`.    | `npm run format` fixes it now. Then either press **Ctrl+S** yourself after editing, or set **Files: Auto Save** to `onFocusChange` (File > Preferences > Settings). If it still doesn't format: Ctrl+Shift+P → **Reload Window**, and check the Prettier icon in the status bar (bottom right).                                                                                                                                    |
| GitHub Actions stuck on "Install Playwright Browsers" for many minutes                                                                                                                          | The workflow installs all three browsers plus their Linux system packages (`--with-deps`); the package download sometimes stalls                                                                                      | Cancel the run, then on the run page click **Re-run jobs → Re-run all jobs**. Permanent fix (done in Week 1 Day 3): the workflow installs Chromium only, `npx playwright install --with-deps chromium`.                                                                                                                                                                                                                            |
| GitHub Actions fails in "Install Playwright Browsers" after a long time: `Temporary failure resolving 'security.ubuntu.com'`, `404 Not Found`, `Unable to fetch some archives`, `exit code 100` | GitHub's Linux machine couldn't download Ubuntu packages (a network/mirror problem on GitHub's side, not our code). Most failing packages (libsoup3, libdvdnav, libgme...) are for WebKit/Firefox, which we don't use | Install Chromium only in the workflow: `npx playwright install --with-deps chromium` (fewer packages, fewer chances to fail). Then re-run. (Week 1 Day 3)                                                                                                                                                                                                                                                                          |
| Windows Firewall popup on first `npx serve`                                                                                                                                                     | Node is opening a network port                                                                                                                                                                                        | Allow **Private networks** only.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `warning: in the working copy of '...', LF will be replaced by CRLF the next time Git touches it` on `git add`                                                                                  | Git for Windows converts line endings: files use LF (Unix style) in the repo and CRLF (Windows style) on disk (`core.autocrlf=true`).                                                                                 | Fixed by `.gitattributes` (`* text=auto eol=lf`, Step 10c): Git now stores and checks out LF on every machine. If an old clone still shows CRLF in the VS Code status bar, commit your work, then run `git rm -r -q --cached .` and `git reset --hard`.                                                                                                                                                                            |
| CI step "Install Playwright Browsers" runs for 10+ minutes (normally under a minute; whole job ~1 min)                                                                                          | The runner is stuck downloading a browser or Linux packages (`--with-deps` uses apt): a slow mirror or a network hang on GitHub's side, not your code.                                                                | Expand the step's log. If the last line hasn't changed for several minutes, click **Cancel workflow**, then **Re-run all jobs**. The workflow's `timeout-minutes: 60` would stop it eventually. Seen 2026-11-09: stuck in apt at `Get:109 ... libdecor-0-0` from azure.archive.ubuntu.com. If it keeps happening: cache browsers between runs, or run the job in the official Playwright Docker image (dependencies preinstalled). |
