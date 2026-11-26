# 004. Spec naming

- **Status:** Accepted
- **Date:** 2026-11-25 (Week 3, Day 3)

## Context

Ten topic pages share one layout (`TopicLayout`) and each gets its own page object in `tests/pages/topics/`. Their tests needed a home before the first one was written. The existing specs already followed an unwritten pattern (`sign-in/sign-in.spec.ts`); this record writes it down and settles the topic pages.

## Decisions

### 1. One spec per screen, named like its page object

- **Chose:** spec files are kebab-case `<screen>.spec.ts` in `tests/specs/<area>/`, mirroring `tests/pages/`. Topic pages: one spec each in `tests/specs/topics/` (`cryptography-and-codes.spec.ts`, `volcanic-worlds.spec.ts`, `time-and-calendars.spec.ts`), matching `tests/pages/topics/CryptographyAndCodesPage.ts` and so on.
- **Benefit:** smaller files, easier to manage; a failing file name tells you the page at once; files run in parallel; two people editing different topics don't clash.
- **Cost:** many files (ten for topics alone).
- **Rejected:** one `topics/topics.spec.ts` with a `describe` per topic. Benefit: fewer files, one place to read. Cost: a long file that grows with every topic, more merge conflicts, a failure names only the file, not the page.

### 2. Inside a spec

- **Chose:** one `test.describe` per file, named as a user names the screen (`'Cryptography & Codes'`), tagged `@regression`. Test titles: the user's action, then the result (`'uploading an image shows a preview'`), as in [architecture: Naming](../architecture.md#naming).
- **Benefit:** the report reads as "screen › what the user did and saw".
- **Cost:** none beyond keeping titles honest when a test changes.

## Consequences

- A new topic page gets `tests/pages/topics/<Name>Page.ts`, a fixture, and `tests/specs/topics/<name>.spec.ts`, in the same PR.
- Rules: [architecture: Naming](../architecture.md#naming).
