# Menyuka — MVP Build Context for Claude Code

## Problem Statement

When a diner sits down at a restaurant, they typically have seconds to minutes to go
from "menu in hand" to "order placed." For first-time visitors, non-native speakers,
and people unfamiliar with a cuisine, that window is dominated by decision fatigue and
comprehension friction, not genuine preference-weighing. Menus are long, densely
worded, and written for people who already know the food. Non-native speakers can't
always ask staff to explain, whether due to language barriers or social discomfort.
The result is decision paralysis, a default "safe" order that doesn't reflect what the
person actually wanted, and a diner who leaves less satisfied than they could have
been.

**Menyuka's job in this MVP** is narrowly defined: let a diner photograph any physical
menu and, within a few taps, either (a) read the whole thing translated into their
language, or (b) skip reading altogether and be guided to 2–4 dishes that fit them —
without needing any relationship with the restaurant, any account, or any app install.

This MVP deliberately does not attempt restaurant partnerships, POS integration,
real-time availability sync, or persistent user accounts. It exists to test one thing:
whether narrowing (not translating everything) is the right wedge for solving
menu-decision paralysis.

## What "Done" Looks Like

A deployed, working web app where a stranger can:
1. Open a link on their phone (no install, no login)
2. Photograph or upload a menu
3. Pick their preferred language
4. See a quick confirmation of what was read from the photo
5. Choose to either browse the translated full menu, or answer 2–3 tap-only
   questions and land on 2–4 recommended dishes
6. Reach a "show to your server" screen they can turn around and hand across the
   table

## Core User Flow

1. **Upload** — customer photographs one or more menu pages (mobile camera or file
   picker)
2. **Language** — single-tap language picker; stored in local/session state, not
   an account; visible and changeable at any point afterward (small persistent
   toggle, not buried in a menu)
3. **Extraction confirmation** — system shows a skimmable list of what it read
   (dish names) before doing anything else with it; this is a required trust step,
   not optional polish, since OCR from an uncontrolled photo is inherently
   error-prone and this is the most anxious moment for the user
4. **Fork** — two clearly presented options, neither one a default:
   - **Browse Full Menu** — translated list, plain-language descriptions per item
   - **Help Me Choose** — the guided flow below
5. **Help Me Choose flow:**
   - System dynamically selects 2–3 questions from a candidate pool (protein
     type, spice level, format, familiarity, temperature/prep style), choosing
     whichever axes best split *this specific menu* into meaningfully distinct
     groups — not a hardcoded fixed question set
   - Questions presented one at a time, single tap each
   - Narrows to 2–4 dishes with plain-language description and price (no photos
     in MVP — see Explicitly Out of Scope)
   - "Shuffle" — show alternate matches for the same answers, no re-answering
   - "Start over" — discard answers, re-enter the question flow
6. **Show-to-server screen** — large text, orientation-friendly for handing across
   a table; works for either path above

The full menu (translated or not) is never the first thing shown after upload —
confirmation and the fork come first.

## Explicitly Out of Scope for This MVP

- Restaurant accounts, portal, or any partnership/onboarding flow
- QR-code partner flow (this MVP is cold-upload only)
- Real-time 86'd-item / availability sync (no restaurant relationship exists)
- Payments or in-app checkout
- User accounts, login, or persistent history across sessions
- Dish photography or AI-generated dish images — plain-language description only
- Full multilingual UI chrome beyond what's needed for the flow above (menu
  content translation is the priority, not localizing every button label)
- Any POS integration

## Primary User

First-timer / non-native-speaker diner using a personal phone at a restaurant table,
often on mediocre wifi, wanting to go from photo to decision in under a minute,
one-handed.

## Tech Stack

- **Framework:** Next.js (React), single app for frontend + backend (API routes /
  server actions) — one deploy target, no separate service needed at this scale
- **Styling:** Tailwind CSS
- **AI:** Claude API (vision-capable model) for:
  - OCR + structured extraction from the menu photo (name, description, price,
    category)
  - Tagging each item (protein, spice level, format, temperature/prep style) —
    prompt for structured JSON output directly, no separate OCR pipeline
  - Translating menu item text and question/result UI copy into the user's
    chosen language
- **Question-selection logic:** Plain server-side scoring function (information-
  gain style) over the tagged item set for the current menu — no ML
  infrastructure needed at this scale
- **State/storage:** No database for MVP. Session state (extracted menu, chosen
  language, question answers) held in memory or client-side/local state for the
  duration of the session. Nothing persists after the session ends.
- **Hosting:** Vercel

## Functional Requirements (MVP subset)

| ID | Requirement | Priority |
|----|-------------|----------|
| M-1 | User can start a session via photo upload (camera or file picker) | Must |
| M-2 | System never shows the full item list as the first screen after upload | Must |
| M-3 | Cold-upload flow shows a confirmation of extracted items before anything else | Must |
| M-4 | User picks a language before the fork; can change it anytime via a visible toggle | Must |
| M-5 | Fork screen presents "Browse Full Menu" and "Help Me Choose" as equal, explicit options | Must |
| M-6 | Browse mode shows translated items with plain-language descriptions | Must |
| M-7 | System dynamically selects 2–3 questions per menu based on actual item tag distribution, not a fixed set | Must |
| M-8 | Each question is answerable with a single tap | Must |
| M-9 | Narrowed results show 2–4 items with plain-language description and price | Must |
| M-10 | "Shuffle" reveals alternate matches without re-answering | Must |
| M-11 | "Start over" discards answers and restarts the question flow | Must |
| M-12 | Selecting a dish (or finishing browse) produces a "show to server" screen | Must |
| M-13 | Core flow usable one-handed on a phone, thumb-reachable tap targets | Must |
| M-14 | Loading states show progress/feedback within ~1–2s, never a blank wait | Must |
| M-15 | Question-selection engine must exclude axes with no real signal for a given menu (e.g. skip a spice question at a sushi restaurant) | Must |
| M-16 | If no answer combination converges to a reasonable result count, fall back to closest matches rather than a dead end | Must |

## Success Signal for This MVP

Not a metrics dashboard — just: can a first-time tester go from menu photo to a
confident dish selection, on their own phone, without help, faster and with less
visible hesitation than reading the physical menu unaided? Validate on at least two
structurally different menus (e.g. a cuisine with strong spice/protein variation vs.
one without) to confirm the question engine actually adapts rather than defaulting to
the same three questions everywhere.
