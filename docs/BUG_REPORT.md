# Bug report - nesto signup page (QA)

Environment: https://app.qa.nesto.ca/signup, Chromium (Playwright), English and French.
Found while building the automated suite. Severity is my own judgement and open to discussion.

---

## BUG-01 - Anything entered in the first second after the form appears is discarded

**Severity:** Medium · **Where:** signup form, every field · **Language:** both

**Steps**
1. Open https://app.qa.nesto.ca/signup
2. As soon as the form appears, type into "First name" or tick the consent box.
3. Wait two seconds.

**Expected:** What was entered stays.

**Actual:** The field empties and the checkbox un-ticks, with no feedback. 6 attempts out of 6.
```
submit button enabled at +0ms:  true
checkbox right after click:     checked
checkbox 1.5s later:            UNCHECKED
```

**Why it matters:** The page is server-rendered, so the form looks ready before its
JavaScript has started. When it starts, it redraws the form from its own empty state. A
customer can tick the consent box (sharing mortgage information with partners), see it
quietly un-tick, and submit without noticing. Nothing on the page tells a client when it
is safe to type, so the suite waits for the network to go quiet (T-03). Disabling the form
until the JavaScript has started would fix it.

---

## BUG-02 - The French quote page keeps the English title

**Severity:** Low · **Where:** /getaquote/fr, where a successful signup lands · **Language:** French

**Steps**
1. Complete a signup from https://app.qa.nesto.ca/fr/signup
2. Look at the browser tab once it reaches /getaquote/fr

**Expected:** A French title, as the signup page has.

**Actual:**
```
/fr/signup     title: nesto | Enregistrement   <- translated
/getaquote/fr  title: Get A Quote              <- not translated
```

**Notes:** The page content and `<html lang>` are French; only the title is not. Separately,
the two pages put the language in different places: /fr/signup but /getaquote/fr.

---

## BUG-03 - The signup page has no top-level heading

**Severity:** Low (accessibility) · **Where:** /signup · **Language:** both

**Steps**
1. Open the signup page and list its headings.

**Expected:** One `<h1>` naming the page, as /getaquote has.

**Actual:** The only heading is an `<h2>`, "Create a nesto account".

**Why it matters:** Screen reader users jump to the `<h1>` to learn what a page is for.
Here that shortcut lands nowhere.

---

## BUG-04 - The API creates an account with no password

**Severity:** High (security) · **Where:** `POST /api/accounts`

**Steps**
1. Send a valid payload with `"password": ""` and `"passwordSpecified": false`.

**Expected:** Refused.

**Actual:** `201 Created`, with a working access token in the reply.

**Why it matters:** The form always sends a password, but the endpoint can be called
without a browser and has no protection (BUG-05), so the form is the only thing enforcing
the rule. I did not test whether such an account can later sign in.

---

## BUG-05 - The signup API has no CSRF protection, CAPTCHA or rate limiting

**Severity:** Medium · **Where:** `POST /api/accounts`

**Steps**
1. From any HTTP client, with no browser, cookies or token, post a valid payload.

**Expected:** Some protection against automated account creation.

**Actual:** `201 Created` every time. About twenty accounts were created in a few seconds
while probing validation, with no throttling or challenge.

**Notes:** The suite relies on this, but so could abuse. Whether production blocks it is a
question for the team.

---

## BUG-06 - The API accepts data the form refuses

**Severity:** Medium · **Where:** `POST /api/accounts`

**Steps** - with Postman, curl or any HTTP client:
1. `POST https://app.qa.nesto.ca/api/accounts` with header `Content-Type: application/json`
   and this body. No cookie or token is needed. The email must not be in use yet, so
   change it on every run.
   ```json
   {
     "firstName": "<b>x</b>",
     "lastName": "Repro",
     "email": "bug06-repro-1@qa-automation.test",
     "phone": "+15145550123",
     "region": "QC",
     "language": "en",
     "leadDistributeConsentAgreement": false,
     "password": "AutoTest1234",
     "passwordSpecified": true,
     "createdAt": "LOGIN",
     "partner": "nesto",
     "formName": "signup"
   }
   ```
   The same as one command:
   ```bash
   curl -i -X POST https://app.qa.nesto.ca/api/accounts \
     -H 'Content-Type: application/json' \
     -d '{"firstName":"<b>x</b>","lastName":"Repro","email":"bug06-repro-1@qa-automation.test","phone":"+15145550123","region":"QC","language":"en","leadDistributeConsentAgreement":false,"password":"AutoTest1234","passwordSpecified":true,"createdAt":"LOGIN","partner":"nesto","formName":"signup"}'
   ```
2. The reply is `201 Created` and `account.firstName` is `<b>x</b>`, stored as sent.
3. For the other rows below, change that one field in the same body.

Without any tool: submit the form once with valid data, then in the browser's developer
tools right-click the `POST /api/accounts` request, "Copy as fetch", change a field and
run it in the console.

| Sent | API | The form |
|---|---|---|
| `firstName: ""` | `201 Created` | refused, "The field is required" |
| `firstName: "Test123"` | `201 Created` | refused, "Invalid name" |
| `firstName: "<script>alert(1)</script>"` | `201 Created` | refused, "Invalid name" |
| `phone: ""` or `"123"` | `201 Created` | refused |
| `region: ""` | `201 Created` | refused |
| `email: "  spaced@..."` | `201 Created` | refused |

**Expected:** The API enforces at least the form's rules.

**Evidence:** the `<script>` row was sent once, on 2026-11-17. The reply was `201 Created`
for account id `1066321`, with `"firstName": "<script>alert(1)</script>"`. Accounts cannot
be deleted, so it can still be looked up. The repro above uses `<b>x</b>` instead: it
shows the same thing and nothing in it can run.

**Why it matters:** Anyone can skip the form, as shown above, and nothing on the server
stops that (BUG-05). This is why the negative tests check that no request was sent, not
only that a message appeared. The `<script>` value is stored as given; I did not test
whether it is escaped where it is later shown.

---

## BUG-07 - A duplicate email is refused with the wrong status and message

**Severity:** Medium · **Where:** `POST /api/accounts`

**Steps**
1. Create an account, then another with the same address.

**Expected:** `409 Conflict`, saying the address is already registered.

**Actual:** `400 {"error":"bad format","description":"error creating account"}`

**Notes:** The format is fine; the address is taken. A client cannot tell the two apart, so
it cannot show a useful message. Matching is correctly case-insensitive. The suite asserts
`400` because that is today's behaviour (A-07).

---

## BUG-08 - Password rule failures answer `401 Unauthorized`

**Severity:** Low · **Where:** `POST /api/accounts`

**Steps**
1. Send a payload with an 11-character password.

**Expected:** `400` or `422`.

**Actual:** `401 {"error":"invalid password","reason":"invalid password"}`

**Notes:** `401` means "not signed in", which does not apply to creating an account. The
same endpoint answers `422`, naming the field, for a bad `region` or `language`.

---

## BUG-09 - The password length messages say "letters" instead of "characters"

**Severity:** Low (copy) · **Where:** signup form · **Language:** both

**Steps**
1. Submit a password of 11 characters, then one of 33.

**Expected:** "Minimum of 12 characters required" / "Maximum of 32 characters required"

**Actual:**
```
EN  Minimum of 12 letters required   Maximum of 32 letters required
FR  Minimum de 12 lettres requises   Maximum de 32 lettres requises
```

**Notes:** A password must contain a digit, so it cannot be all letters. The hint above the
field says "between 12 and 32 characters", so the two disagree.

---

## BUG-10 - Empty fields are reported as badly formatted rather than missing

**Severity:** Low (UX) · **Where:** signup form · **Language:** both

**Steps**
1. Fill the form correctly, then clear one field at a time and submit.

**Expected:** An empty field says it is required.

**Actual:**
```
empty first name  ->  The field is required           correct
empty email       ->  Invalid email                   wrong problem
empty password    ->  Minimum of 12 letters required  wrong problem
```

**Notes:** Only the name fields say what is actually wrong.
