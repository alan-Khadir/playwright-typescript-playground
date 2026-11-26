# 003. Test data

- **Status:** Accepted
- **Date:** 2026-11-24 (Week 3, Day 2)

## Context

The create account tests typed the same hand-written details (`fred@test.com`) into every test, and invalid values were copied between tests by mistake. Our app doesn't save accounts, but a real one would: the second run, or two tests running in parallel, would hit "email already taken". `@faker-js/faker` is now installed. This record covers where test data comes from and where it lives.

## Decisions

### 1. Valid data generated, invalid values written by hand

- **Chose:** valid details come from faker (`faker.person.fullName()`, `faker.internet.email()`, `faker.internet.password({ length: 12 })`). The one invalid value a test is about is written in the test: `validAccount({ email: 'fred.test.com' })`.
- **Benefit:** values differ every run, so tests don't collide once data is stored. The reader sees exactly what each test breaks; everything else is "any valid value".
- **Cost:** the valid values aren't visible in the spec; you see them only in the trace or report. faker's email is very likely unique, not guaranteed.
- **Rejected:**
  - Hand-written values everywhere. Benefit: readable, same every run. Cost: collides when the app stores data; copied blocks drift (Day 1 slip).
  - Generated invalid values too. Benefit: wider coverage. Cost: the test no longer says which bad value it checks, and a failure is hard to repeat.

### 2. One factory with overrides, in the spec until shared

- **Chose:** `validAccount(overrides: Partial<AccountDetails> = {}): AccountDetails` at the top of `create-account.spec.ts`. It returns a full valid account; `...overrides` goes last so the test's value wins. It moves to `tests/test-data/` when a second spec needs it. The empty-form test passes `{}` to `createAccount`, not the factory.
- **Benefit:** valid data in one place; each test is one line of data. Typed by `AccountDetails`, so a wrong property name fails `npm run typecheck`.
- **Cost:** one more function to read before the tests.
- **Rejected:**
  - `tests/test-data/accounts.ts` now. Benefit: ready for reuse. Cost: a shared folder for one user (our rule: shared code only for 2+ specs).
  - A builder class (`new AccountBuilder().withEmail(...)`). Benefit: familiar from C#. Cost: much more code for what spread already does.

### 3. Random every run, no fixed seed

- **Chose:** no `faker.seed()`. Each run gets new values.
- **Benefit:** over many runs the tests meet more real-world values (apostrophes, accents, long names) and can find bugs fixed data never would.
- **Cost:** a failure caused by one value (say `Seán O'Brien`) may not happen on the next run. To reproduce it, read the filled values from the trace and pass them as overrides.
- **Rejected:** `faker.seed(123)`. Benefit: the same values every run, so any failure repeats. Cost: the data never changes, so it finds no more than hand-written data; with parallel workers the order of calls, and so the values, can still differ.

### 4. Sign-in keeps the one fixed user

- **Chose:** sign-in and the auth setup use `user@test.com` / `Password123`.
- **Benefit:** it is the only account the app has; a created account isn't saved, so it can't be used to sign in.
- **Cost:** shared fixed data: at scale, tests that change this user's state would affect each other. Fine here because sign-in only reads it.
- **Rejected:** create a new user per test. Benefit: full isolation. Cost: impossible in this app (accounts aren't saved).

## Consequences

- New forms get a typed factory with overrides, next to the spec that uses it, once 2+ tests share the same data shape. A single test builds its object inline (`FactDetails` in the Cryptography spec, Week 3 Day 3), still with faker for the filler values. (Amended 2026-11-26.)
- Week 6 data-driven tests (name length, password mismatch) pass their bad values as overrides.
- How faker and spread work: [learning/concepts.md](../learning/concepts.md).
