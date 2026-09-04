# Menyuka — MVP

Photograph a physical menu on your phone. Get it translated, or answer 2–3
single-tap questions and land on 2–4 dishes you can hand across the table.

No account, no install, no restaurant relationship. Cold upload only.

See `Menyuka_MVP_Build_Context.md` for the product brief this implements.

## Run it

```bash
cp .env.example .env.local   # then paste your Anthropic API key in
npm install
npm run dev                  # http://localhost:3000
```

Open it on a phone on the same network (`http://<your-lan-ip>:3000`) — the
camera capture, the thumb-reach targets, and the hand-it-over screen are the
only way to judge this thing.

```bash
npm run engine:check   # question-engine adaptivity check, no API key needed
npm run copy:check     # fail if app copy drifted from lib/translations
npm run build          # production build
npx eslint .           # lint
```

## The flow

`upload → language → confirmation → fork → (browse | 2–3 questions → results) → show to server`

Extraction is kicked off the instant a photo is picked and runs *while* the
diner chooses a language, so the slowest call in the flow hides behind a screen
they were going to see anyway. The full item list is never the first thing shown
after upload — the confirmation step comes first, because OCR from an
uncontrolled photo is error-prone and this is the diner's most anxious moment.

## How the question engine works

`lib/questions.ts`. Six candidate axes (`protein`, `spice`, `format`,
`familiarity`, `prep`, `richness`); every item is tagged on all six at
extraction time. For a given menu the engine:

1. Scores each axis by **Shannon entropy × coverage** over the dishes still in
   play — how evenly it splits the menu, discounted by how much of the menu it
   describes at all.
2. **Excludes axes with no real signal**: fewer than two distinct values, under
   55% coverage, or under 0.65 bits of entropy (an 85/15 split fails, 80/20
   passes). This is what keeps a spice question off a sushi menu.
3. Asks the highest-scoring axis, then **re-scores the survivors** before
   choosing the next question — so question two adapts to what question one
   left behind.
4. Stops at three questions, or as soon as the remaining set is small enough
   that another tap would buy nothing.

Results **rank the whole menu** against the answers rather than filtering it
down, with partial credit for near-misses on ordinal axes (spice, richness).
It will return three dishes, or two, rather than padding to four with something
that matches nothing the diner asked for. It reaches past the matches only when
there are fewer than two of them — and then labels what it shows as closest
matches, so a compromise is never passed off as a match. There is no dead end.
"Show me others" pages through equally-good alternates for the same answers,
wrapping.

`npm run engine:check` runs it against three hand-tagged menus and asserts the
behaviour above. Current output: the North Indian menu gets asked
`format → protein`, the sushi menu `format → familiarity` (spice excluded
entirely), and a five-item bakery counter is asked nothing at all.

Point it at a saved `/api/extract` response to walk a real menu instead — the
fastest way to sanity-check the engine against a new cuisine:

```bash
npm run engine:check -- ./extraction.json
```

A live Roman trattoria menu opens on `protein` rather than `format`, which is
the adaptation working: spice scores 0.978 there (only three dishes carry heat)
and loses to both.

## Architecture

| | |
|---|---|
| `app/api/extract` | Photo(s) → one Claude vision call → transcribed, priced, tagged items + the menu's language + a polite "I'd like to order this" phrase in that language |
| `app/api/translate` | Items + target language → per-dish name + plain-language blurb. Items are split into chunks of 12 and translated concurrently |
| `lib/translations/` | The app's own UI strings, pre-translated at build time for all 16 languages. Nothing menu-derived — see the README there |
| `lib/questions.ts` | Question scoring, selection, ranking, shuffle. Pure functions, no API |
| `lib/session.ts` | sessionStorage only. No database, no accounts, nothing survives the tab |
| `components/MenyukaApp.tsx` | The screen state machine |

Both API calls use `claude-opus-5` with adaptive thinking and structured
outputs (Zod → `messages.parse`), at `effort: "medium"` for extraction and
`"low"` for translation — extraction is the accuracy-critical call, translation
is the latency-critical one.

Two things keep the wait tolerable. The app's own interface copy — buttons,
question prompts, answer labels — is **pre-translated at build time** rather
than regenerated per session; it was 57% of the translate call's output while
being identical for every menu in a language. And dish translation is **split
into chunks of 12 run concurrently**, so wall-clock is the slowest chunk rather
than the sum. Measured on the same menu: 23–60s before, 11–12s after, and a
51-item menu now costs the same as a 17-item one.

Regenerate app copy with `npm run copy:translate` after editing `lib/copy.ts`.
`npm run copy:check` fails if you forget — the generated files carry a hash of
the English source.

Photos are downscaled to a 1568px long edge in the browser before upload.
That's the largest edge Claude's vision actually uses, and it turns a 6 MB
camera JPEG into a few hundred KB — which matters more than anything else on
restaurant wifi.

## Decisions worth knowing about

- **Question selection runs on the client**, not the server. It's the same pure
  scoring function the brief specifies, executed where the menu data already
  lives — a server round-trip per question would add a visible pause to every
  single tap, on exactly the connection the primary user is on.
- **One light theme, no dark mode.** The show-to-server screen gets handed
  across a table in a dim restaurant; a dark card with small light text is the
  wrong thing to hand someone.
- **Failed translation is degraded, not broken.** The flow still works in the
  menu's own language, so a translation failure stays quiet instead of blocking.
- **UI copy translation is limited** to the strings needed to get through the
  flow, per the brief — menu content is the translation priority.

## Not built (out of scope for this MVP)

Restaurant accounts or partner portal, QR partner flow, availability sync,
payments, user accounts or history, dish photography, POS integration, and
full multilingual UI chrome.
