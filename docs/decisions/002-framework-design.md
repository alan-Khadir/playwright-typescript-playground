# 002. Framework design

- **Status:** Accepted
- **Date:** 2026-11-19 (Week 2, Day 4). Decisions made Week 1 Day 4 to Week 2 Day 3.

## Context

By Week 2 the repo has 5 page objects, 2 components, fixtures and 3 specs. Before more pages arrive (topic pages in Week 3, playwright-bdd in Week 6), the shape of the framework needs to be written down: how specs get page objects, how shared parts are reused, where checks live and where files go. Each choice below lists what we turned down, with the benefit and the cost of every option, ours included.

## Decisions

### 1. Specs get page objects from fixtures

- **Chose:** every page object has a fixture in `tests/fixtures/index.ts`. Specs import `test` and `expect` from there and name what they need: `async ({ homePage, signInPage }) => ...`. Never `new` in a spec.
- **Benefit:** a test lists exactly what it uses. Each object is built in one place, so a constructor change touches one file. Playwright builds only the fixtures a test asks for, all on the same tab, and throws them away after the test.
- **Cost:** one more file to look in: a newcomer must find `fixtures/index.ts` to see where `homePage` comes from. Every new page object needs a fixture entry. Fixtures are a Playwright idea to learn.
- **Rejected:**
  - `new HomePage(page)` in each test. Benefit: plain TypeScript, nothing hidden. Cost: the same lines in every test; a constructor change touches every spec.
  - `beforeEach` with `let homePage`. Benefit: familiar (NUnit `[SetUp]`), one place per file. Cost: `let` can be reassigned, objects are built even for tests that don't use them, and it can't be shared across spec files.

### 2. Composition, no base classes

- **Chose:** a part shared by 2+ screens is a component in `tests/components/` (`NavBar`, `TopicLayout`). A page object builds it in its own constructor and exposes it as a `readonly` property: `homePage.navBar.openSignIn()`. No `BasePage`, no `BaseTest`.
- **Benefit:** each page object has only the parts its screen really has. A change to `NavBar` affects only the pages that include it. Reading a page object shows everything it has, with no parent class to open.
- **Cost:** each page object that needs a component repeats one line (`this.navBar = new NavBar(page)`). Calls are one step longer (`homePage.navBar.openSignIn()` instead of `homePage.openSignIn()`).
- **Rejected:**
  - `BasePage` that every page extends. Benefit: shared code written once; familiar from Selenium and C#. Cost: every page gets everything, even parts its screen doesn't have; the base class grows into a dumping ground that every page depends on.
  - `BaseTest` for shared setup. Benefit: one place for setup. Cost: does what fixtures already do, and hides setup the test can't see in its own parameter list.

### 3. Every assertion lives in the spec

- **Chose:** page objects hold locators (`readonly` properties) and actions only. Every `expect` is in the spec, as a web-first assertion on a page object's locator: `await expect(signInPage.errorMessage).toBeVisible()`.
- **Benefit:** a test shows what it checks. The same page object serves tests that expect success and tests that expect failure. Web-first assertions retry, so no extra waiting code.
- **Cost:** specs are longer, and the same check can appear in more than one spec.
- **Rejected:**
  - `expect` inside page object methods (`verifyErrorShown()`). Benefit: shorter specs, the check written once. Cost: the check is hidden from the test; the page object is tied to one expected outcome. Martin Fowler's PageObject article advises against it.
  - Methods that return values (`getErrorText()`). Benefit: simple. Cost: the value is read once with no retry, so tests become flaky.

### 4. Page objects mirror specs; folders only when needed

- **Chose:** one page object per screen in `tests/pages/`, grouped the same way as specs. Topic page objects will go in `tests/pages/topics/`, each with `readonly layout: TopicLayout`. Components only for parts on 2+ screens; utils only for helpers used in 2+ specs. A folder is created with its first file.
- **Benefit:** from a spec's folder you know where its page objects are. No empty or speculative folders.
- **Cost:** files may move later when a group appears. "Which screen?" is sometimes a judgement call.
- **Rejected:**
  - One flat `pages/` folder forever. Benefit: simplest. Cost: hard to scan once 10 topic pages arrive.
  - Creating the full folder tree up front. Benefit: shows the plan. Cost: empty folders (Git doesn't even store them) and structure for code that may never exist.

## Consequences

- A new screen means a page object and a fixture, before the test (steps: [architecture: Adding a test](../architecture.md#adding-a-test)).
- Week 6 (playwright-bdd) reuses the same page objects and fixtures; step definitions get page objects from fixtures, like specs.
- The rules themselves: [architecture.md](../architecture.md). How each works: [learning/concepts.md](../learning/concepts.md).
