# Bug report - nesto signup page (QA)

Environment: https://app.qa.nesto.ca/signup
Browser: Chromium (Playwright), English and French
Found while building the automated suite. Each entry says how to reproduce it.
Severity is my own judgement and open to discussion.

---

## BUG-01 - A click on the consent checkbox is undone about a second later

**Severity:** Medium
**Where:** Signup form, the "contacted by nesto's partners" checkbox
**Language:** both

**Steps**
1. Open https://app.qa.nesto.ca/signup
2. As soon as the form appears, click the consent checkbox. On a fast connection this
   is roughly the first second after it becomes visible.
3. Watch the checkbox without touching anything else.

**Expected:** It stays ticked.

**Actual:** It ticks, then un-ticks on its own about 1.5 seconds later.

**Measured**
```
submit button enabled at +0ms:  true
checkbox right after click:     checked
checkbox 1.5s later:            UNCHECKED
```

**Why it happens**
The page is server-rendered, so the form is painted and usable-looking before its
JavaScript has attached. A click in that window updates the DOM, and then React finishes
loading, re-renders the checkbox from its own state - which still says unticked - and the
user's click is discarded.

**Why it matters**
A customer who reads quickly and ticks the consent box immediately can submit the form
believing they opted in, or believing they did not, depending on which way the race fell.
For a consent checkbox about sharing mortgage information with partners, that is the wrong
place for ambiguity.

It also affects automated testing. Any test that clicks the checkbox as its first action
after load hits this: ours did, and failed in about one run in three under parallel load,
passing in isolation. The suite now retries the click until it sticks and the comment at
that line points here, so the workaround cannot be mistaken for the behaviour being
correct.

**Note**
Every signal the page offers - the submit button being enabled, the fields being visible,
the checkbox accepting a click - is already true during this window, so there is nothing a
careful client could wait for. A `data-hydrated` attribute, or disabling the form until the
JavaScript attaches, would remove the ambiguity.
