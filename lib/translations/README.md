# Pre-translated app copy

These files hold **the app's own interface strings** — buttons, headings, the
six question prompts, and the answer labels for the closed tag vocabulary in
`lib/tags.ts`. Every one of them is authored in English in `lib/copy.ts`.

**Nothing here comes from a menu.** Dish names and the plain-language blurbs are
translated per photo at runtime in `lib/anthropic.ts`, and always will be — they
can't be known before someone takes a picture.

## Why these are generated instead of translated at runtime

They used to ride along in the same API call as the dish translations, where
they accounted for **57% of the generated output** on a 17-item menu, and more
on smaller ones. They're identical for every menu in a given language, so that
was the same work redone on every session, delaying the dish content the diner
was actually waiting on.

## Which questions get asked is still decided per menu

Pre-translating the labels doesn't make the flow static. The engine still picks
which axis to ask about and which options to show from the tag distribution of
the photographed menu — `protein` on one, `format` on another, spice excluded
entirely where nothing is spicy. Only the wording of a given label is fixed, and
"Beef" is the same word in Spanish whether or not this restaurant serves any.

This works because the tag vocabulary is a closed enum. If axes or tag values
ever became model-generated per menu, their labels would have to move back to
runtime.

## Workflow

```bash
npm run copy:translate         # regenerate every language
npm run copy:translate -- es   # regenerate one
npm run copy:check             # fail if lib/copy.ts drifted from these files
```

Each file stamps a `_sourceHash` of the English source. Edit a string in
`lib/copy.ts` without regenerating and `copy:check` fails — without that guard
this optimisation would quietly rot into stale wording.
