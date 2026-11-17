# nesto signup — end-to-end tests

Playwright + TypeScript tests for the nesto signup page in the QA environment,
running in both English and French.

## Requirements

Node 20 or newer.

## Install

```bash
npm ci
npx playwright install chromium
```

No further setup. The suite points at `https://app.qa.nesto.ca` by default.

## Run

```bash
npm test              # both languages
npm run test:en       # English only
npm run test:fr       # French only
npm run test:ui       # Playwright UI mode: pick tests, watch the browser, time travel
npm run report        # open the HTML report from the last run
npm run typecheck     # tsc, no tests
npm run lint          # ESLint, no warnings allowed
```

Filtering by tag uses Playwright's `--grep`, which also combines with `--project`:

```bash
npx playwright test --grep @smoke
npx playwright test --grep "@api|@negative"
npx playwright test --grep @smoke --project=chromium-fr
```

Debugging:

```bash
npx playwright test --headed     # watch the browser
npx playwright test --debug      # step through, with the inspector
```

## Both languages

The signup page takes its language from the URL path: `/signup` in English,
`/fr/signup` in French. Each language is a Playwright project, so every test runs
once per language without any loop inside the test, and either can be run alone.

Adding a test automatically covers both languages. Nothing needs duplicating.

## Configuration

`.env` is optional — everything has a working default. Copy `.env.example` to
`.env` only if you need different values.

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://app.qa.nesto.ca` | Environment under test |
| `EMAIL_DOMAIN` | `qa-automation.test` | Domain for generated test accounts |

`EMAIL_DOMAIN` must not be `example.com`, `example.org`, `example.net` or
`test.com`: the signup API rejects those with
`422 {"error":"invalid parameters","parameters":["placeholder email detected"]}`.
`.test` is reserved for testing and can never receive mail, so generated addresses
cannot reach a real person.

## Layout

```
src/config/env.ts       BASE_URL and EMAIL_DOMAIN, with defaults
src/fixtures/test.ts    the typed `lang` option each project sets
src/pages/              page objects: locators and actions, no assertions
tests/signup/           the tests: assertions, no locators
```

`npm run lint` uses `eslint-plugin-playwright` together with type-aware rules. The
one that matters is `missing-playwright-await`: an assertion written without `await`
passes while checking nothing, and that is the hardest kind of bug to notice in a
test suite. Warnings are treated as failures so they cannot accumulate.

Locators are `data-testid`, because that is the only anchor that stays the same in
English and French. The page's `id` attributes are generated (`field-2`, `field-4`,
…) and move with render order, so they are not used.

## What is here so far

A smoke test covering that the signup form renders in both languages, on the
framework described above. Field, validation and API coverage is being added next.

## What I would add next

- GitHub Actions running both languages on every push, with the HTML report kept
  as an artifact.
- Cross-browser (Firefox, WebKit) and mobile viewports, on a schedule rather than
  on every commit.
- An accessibility pass with `@axe-core/playwright` in both languages.
- A check that no English text is left on the French page.
