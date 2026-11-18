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
