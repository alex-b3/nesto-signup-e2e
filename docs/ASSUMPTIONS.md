# Assumptions and trade-offs

An **assumption** here is something the brief did not settle and I could not verify, so I
decided it and moved on. A **trade-off** is something given up on purpose.

Things I checked against the QA environment are not listed as assumptions - they are
facts, and they live in the tests that assert them. Each entry says what I did not know,
what I decided, and what happens if I was wrong. Code that depends on one carries an
`A-xx` or `T-xx` comment at the line it affects.

---

## Assumptions

**A-01 - Test accounts are permanent, and that is acceptable.**
The brief says "create as many accounts as you need" but not who clears them up, and the
signup API has no delete. I assumed accumulating accounts is fine. Every one is
identifiable: first name `Auto`, last name `Suite`, so they can be found in a single
query. A full run creates four.
*If I am wrong:* they can be filtered and removed by that name.

**A-02 - A domain that can never receive mail is the right kind of throwaway.**
The brief says to use throwaway addresses but not which domain, and the obvious choice is
refused: `example.com`, `.org`, `.net` and `test.com` all come back
`422 {"error":"invalid parameters","parameters":["placeholder email detected"]}`.
I assumed the intent is "must not reach a real inbox" rather than "must be a working
mailbox", so addresses use `qa-automation.test`. The `.test` top-level domain is reserved
by RFC 6761 and can never be registered, so nothing sent there can reach anyone.
*If I am wrong,* and a readable inbox is ever needed: one change to `EMAIL_DOMAIN`.

**A-03 - The `data-testid` attributes are deliberate and safe to build on.**
Every control on the form has one. I cannot tell from outside whether they are maintained
on purpose, but they are the only anchors that do not change between English and French,
so the suite depends on them.
*If I am wrong* and they get renamed, every locator is in one page object.

**A-04 - The province default cannot be relied on, so no test uses it.**
The field fills in about 1.6 seconds after load and resolved to Alberta in every
environment I tried, including UTC and Europe/London. The brief's own screenshot shows
Quebec. I could not work out the rule, so tests select a province explicitly - and the
factory deliberately uses one that is *not* the default, so selecting is observable.
*If I am wrong* and the default is defined somewhere, the suite is missing one small check.

**A-05 - The password hint on the page states the whole rule.**
"Between 12 and 32 characters and contain one uppercase letter, one lowercase letter and
one number." I checked the boundaries but cannot prove there is no further hidden rule,
such as forbidden characters.
*If I am wrong:* a password the suite treats as valid could be rejected, and the failure
would point straight at the factory.

**A-06 - "The entered information in the form" is covered twice, because it reads two ways.**
The requirement can mean the endpoint's own contract - send those fields, check they come
back - or the round trip that starts at the form. Both are tested, in
`signup-api.spec.ts`. The second is not redundant: the API stores whatever phone format it
is given (`5145550123` and `514-555-0123` are both accepted and stored verbatim), so the
`+1` is added by the page, not the server. The same goes for the form's province arriving
as `region` and the page's language arriving as `preferredLanguage`. A test that builds
its own payload cannot notice if the page stops doing any of that.
*If I am wrong* about which reading was meant, one of the two tests is surplus rather than
missing.

**A-07 - Where the application looks wrong, the test asserts what it does today.**
A duplicate email returns `400 "bad format"` where `409 Conflict` would fit. I assumed my
job is to describe current behaviour accurately and report the disagreement separately,
not to write a test that fails every run.
*If I am wrong,* or when it is fixed: the test fails, which is when someone should look.

**A-08 - Arriving directly at `/fr/signup` is the same as clicking the toggle.**
Language lives in the URL path and the toggle navigates there, so the suite sets language
per project rather than clicking through the UI in every test.
*If I am wrong,* something set only by the click would be missed - one test clicks it for
real, which would catch that.

---

## Trade-offs

**T-01 - `data-testid` instead of role and visible name.**
The usual advice is to find elements the way a user would. On a bilingual page that breaks
the moment the language changes.
*Cost:* accessibility is no longer covered as a side effect, so labels are asserted
explicitly with `toHaveAccessibleName` instead.

**T-02 - Chromium only, in two languages.**
Two language projects already run every test twice; adding Firefox and WebKit would
multiply that again for one page.
*Cost:* browser-specific bugs are not caught. Listed under what I would add next.

**T-03 - `networkidle` before touching the form.**
Playwright's documentation discourages it. Without it the page discards anything typed in
its first second - measured at six attempts out of six - and the page offers no readiness
marker of its own.
*Cost:* about half a second per navigation, and it would hang on a page that polled
forever. See BUG-01.

**T-04 - No cleanup, so the suite leaves data behind.**
Deletion is not possible, and keeping tests independent was worth more than tidiness.
*Cost:* nesto's QA database grows with every run.
