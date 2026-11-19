# Bug report - nesto signup page (QA)

Environment: https://app.qa.nesto.ca/signup
Browser: Chromium (Playwright), English and French
Found while building the automated suite. Each entry says how to reproduce it.
Severity is my own judgement and open to discussion.

---

## BUG-01 - Anything entered in the first second after the form appears is discarded

**Severity:** Medium
**Where:** Signup form, every field
**Language:** both

**Steps**
1. Open https://app.qa.nesto.ca/signup
2. As soon as the form appears, type into "First name" or tick the consent box. On a
   fast connection this is roughly the first second after it becomes visible.
3. Wait two seconds without touching anything else.

**Expected:** What was entered stays.

**Actual:** The field empties itself and the checkbox un-ticks, with no feedback.

**Measured**
```
submit button enabled at +0ms:  true
checkbox right after click:     checked
checkbox 1.5s later:            UNCHECKED
```
Typing into a field immediately after it appears and checking the value two seconds
later: the value had been discarded on 6 attempts out of 6.

**Why it happens**
The page is server-rendered, so the form is painted and usable-looking before its
JavaScript has attached. A click in that window updates the DOM, and then React finishes
loading, re-renders the form from its own state - which is still empty - and whatever was
entered is discarded.

**Why it matters**
A fast typist loses what they entered and has to notice and retype it. Worse for the
consent box, which is about sharing mortgage information with partners: a customer can
tick it, watch it quietly un-tick, and submit the form in whichever state the race left
it. That is the wrong place for ambiguity.

It also affects automated testing, which is how it was found. A test that fills the form
as its first action after load submits an empty form. The suite now waits for the page's
network to go quiet before touching anything, which is a workaround for the missing
signal, not a fix for the defect.

**Note**
Every signal the page offers - the submit button being enabled, the fields being visible,
the checkbox accepting a click - is already true during this window, so there is nothing a
careful client could wait for. Disabling the form until the JavaScript has
attached would make the state honest; an attribute marking the page as ready would at
least give clients something to wait for.

---

## BUG-02 - The French quote page keeps the English title

**Severity:** Low
**Where:** https://app.qa.nesto.ca/getaquote/fr - the page a successful signup lands on
**Language:** French

**Steps**
1. Complete a signup from https://app.qa.nesto.ca/fr/signup
2. Look at the browser tab once it settles on /getaquote/fr

**Expected:** A French title, as the signup page itself manages
(/fr/signup is titled "nesto | Enregistrement").

**Actual:** "Get A Quote", identical to the English page.

```
/fr/signup     title: nesto | Enregistrement   <- translated
/getaquote/fr  title: Get A Quote              <- not translated
/getaquote     title: Get A Quote
```

**Notes**
The page content is in French and `<html lang>` is correctly "fr", so this is only the
title. It shows in the browser tab, in bookmarks, and in anything that reads page
metadata. Found while asserting where a signup lands, so it is strictly next to the
signup page rather than on it.

Worth noting separately: the two pages mark the language differently. Signup uses a
prefix, /fr/signup, while the quote page uses a suffix, /getaquote/fr.

---

## BUG-03 - The signup page has no top-level heading

**Severity:** Low (accessibility)
**Where:** https://app.qa.nesto.ca/signup
**Language:** both

**Steps**
1. Open the signup page and list its headings.

**Expected:** One `<h1>` naming the page, as the quote page does.

**Actual:** The only heading is an `<h2>`, "Create a nesto account". There is no `<h1>`.

**Notes**
Screen reader users navigate by headings, and jumping to the top-level heading is the
usual way to find out what a page is for. With no `<h1>`, that shortcut lands nowhere.
The page a signup leads to, /getaquote, does have one, so the two pages are inconsistent
with each other.

---

## BUG-04 - The API creates an account with no password at all

**Severity:** High (security)
**Where:** `POST /api/accounts`
**Language:** n/a

**Steps**
1. Send a valid payload with `"password": ""` and `"passwordSpecified": false`.

**Expected:** Refused. An account without a password cannot be signed into.

**Actual:** `201 Created`, and the reply contains a working access token.

**Why it matters**
The signup form always sends a password, so this is not reachable through the page. It
matters because the endpoint is reachable without a browser and has no CSRF token,
CAPTCHA or rate limiting (BUG-05), so the form is the only thing enforcing the rule. I did
not test whether such an account can later be signed into - that is outside the signup
page, but it is worth checking.

---

## BUG-05 - The signup API has no CSRF protection, CAPTCHA or rate limiting

**Severity:** Medium
**Where:** `POST /api/accounts`

**Steps**
1. From any HTTP client, with no browser, cookies or token, post a valid payload.

**Expected:** Some protection against automated account creation.

**Actual:** `201 Created`, every time. Around twenty accounts were created this way in a
few seconds while probing validation, with no throttling or challenge.

**Notes**
This made the suite easier to write and I rely on it, but the same property allows abuse.
Whether it is acceptable in QA and blocked in production is a question for the team.

---

## BUG-06 - The API accepts data the form refuses

**Severity:** Medium
**Where:** `POST /api/accounts`

**Steps** - send each of these directly to the endpoint, one at a time:

| Sent | API | The form |
|---|---|---|
| `firstName: ""` | `201 Created` | refused, "The field is required" |
| `firstName: "Test123"` | `201 Created` | refused, "Invalid name" |
| `firstName: "<script>alert(1)</script>"` | `201 Created` | refused, "Invalid name" |
| `phone: ""` or `"123"` | `201 Created` | refused |
| `region: ""` | `201 Created` | refused |
| `email: "  spaced@..."` | `201 Created` | refused |

**Expected:** The API enforces at least the rules the form does.

**Actual:** All of the above create an account.

**Why it matters**
It is why the automated negative tests check that no request was sent, rather than only
that a message appeared: if the form ever submitted despite showing an error, the server
would accept the result. The `<script>` case is the one I would prioritise - the value is
stored as given. I did not test whether it is escaped wherever it is later displayed.

---

## BUG-07 - A duplicate email is refused with the wrong status and message

**Severity:** Medium
**Where:** `POST /api/accounts`

**Steps**
1. Create an account with any address.
2. Create another with the same address.

**Expected:** `409 Conflict`, saying the address is already registered.

**Actual:** `400 {"error":"bad format","description":"error creating account"}`

**Notes**
The format is fine; the address is taken. A client cannot tell "you sent nonsense" from
"this user exists", so it cannot show anything useful. Matching is correctly
case-insensitive - the same address in a different case is also refused. The suite asserts
`400` because that is what happens today; see A-07.

---

## BUG-08 - Password rule failures answer `401 Unauthorized`

**Severity:** Low (wrong status code)
**Where:** `POST /api/accounts`

**Steps**
1. Send a payload with an 11-character password.

**Expected:** `400` or `422` - the input failed validation.

**Actual:** `401 {"error":"invalid password","reason":"invalid password"}`

**Notes**
`401` means "not authenticated", which does not apply when creating an account. The same
endpoint correctly answers `422` with the offending field named for an invalid `region` or
`language`, so this is inconsistent with itself.

---

## BUG-09 - The password length messages say "letters" where they mean "characters"

**Severity:** Low (copy)
**Where:** Signup form, both languages

**Steps**
1. Submit a password of 11 characters, then one of 33.

**Expected:** "Minimum of 12 characters required" / "Maximum of 32 characters required"

**Actual**
```
EN  Minimum of 12 letters required   Maximum of 32 letters required
FR  Minimum de 12 lettres requises   Maximum de 32 lettres requises
```

**Notes**
A password must contain a digit, so it cannot be twelve letters. The hint above the field
gets it right - "between 12 and 32 characters" - so the two disagree. Same mistake in both
languages and in both the minimum and maximum messages.

---

## BUG-10 - Empty fields are reported as badly formatted rather than missing

**Severity:** Low (UX)
**Where:** Signup form, both languages

**Steps**
1. Fill the form correctly, then clear one field at a time and submit.

**Expected:** An empty field says it is required.

**Actual**
```
empty first name  ->  The field is required        correct
empty email       ->  Invalid email                says the format is wrong
empty password    ->  Minimum of 12 letters required  says it is too short
```

**Notes**
Telling someone their empty email is invalid, or that their empty password is too short,
points them at the wrong problem. Only the name fields say what is actually wrong.
