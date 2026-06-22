# Contributing to @seqlens/i18n

Thank you for helping translate [seqlens](https://seqlens.app). This guide covers the two most common contributions: **improving an existing translation** and **adding a new language**.

## Prerequisites

- [pnpm](https://pnpm.io/) `>=10`
- Node.js `>=22`

```bash
git clone https://github.com/kumoproductions/seqlens-i18n.git
cd seqlens-i18n
pnpm install
```

Run the type checker once to confirm your setup:

```bash
pnpm typecheck
```

It should exit cleanly.

## File structure

All translation strings live in `src/locales/`:

```
src/locales/
  en.ts        Source of truth — defines the full Messages type
  ja.ts        Japanese translations (DeepPartial<Messages>)
  _template.ts Starting point for new locales
```

Catalogs are organized into two top-level namespaces:

- `app.*` — strings used by the seqlens desktop app
- `web.*` — strings used by the marketing site

Inside each namespace, keys are grouped by feature (e.g. `app.settings.general`, `web.licensing`). Keep the same structure across locales — that's what gives editors autocomplete and lets the build catch typos.

## Improving an existing translation

1. Open the locale file (e.g. `src/locales/ja.ts`).
2. Edit the string. Keep the key untouched.
3. Run `pnpm typecheck`.
4. Commit and open a PR.

That's it. The PR template will ask you which locale you changed and why.

## Adding a new language

Adding a new locale (let's say French — `fr`) is three steps:

### 1. Copy the template

```bash
cp src/locales/_template.ts src/locales/fr.ts
```

Translate values inside `fr.ts`. **Keep the keys identical to `en.ts`.** Missing keys fall back to English at runtime, so it's fine to ship an incomplete first pass — just translate what you can.

### 2. Register the locale (2 places)

- **`src/locales/registry.ts`** — add an entry to `LOCALE_META` with the OS/BCP-47 language subtags that should auto-detect to it (add `complete: true` once it's fully translated):

  ```ts
  export const LOCALE_META = {
    en: { source: true, complete: true, detect: ['en'] },
    ja: { complete: true, detect: ['ja'] },
    fr: { detect: ['fr'] },
  } as const satisfies Record<string, LocaleMeta>;
  ```

  This single entry drives the `Locale` type, the supported list, OS auto-detection, and routing — nothing else to edit for those.

- **`src/engine.ts`** — import the catalog and bind it in `LOCALES`:

  ```ts
  import { fr } from './locales/fr';
  export const LOCALES: Record<Locale, DeepPartial<Messages>> = { en, ja, fr };
  ```

  TypeScript will flag this spot if you register a locale in step 2 but forget to bind its catalog here.

### 3. Run the type checker

```bash
pnpm typecheck
```

Open a PR. We will help wire up anything you missed.

## Conventions

### Plurals

Keys that depend on a count use CLDR plural suffixes. Current catalogs define `_one` / `_other`:

```ts
countSequence_one: '1 sequence',
countSequence_other: '{count} sequences',
```

`createTn(locale, namespace)(count, baseKey, vars)` picks the right CLDR plural category for the locale, falling back to `_other` when that category key is absent. In languages with **no grammatical plural distinction** (Japanese, Chinese, Korean, ...), use the same wording for plural forms — call sites stay uniform.

### Interpolation

Placeholders use `{name}` syntax:

```ts
welcome: 'Hello, {name}',
// at call site:
t('welcome', { name: 'Anna' }); // → "Hello, Anna"
```

Placeholders that fail to match a variable render as the literal token (e.g. `{missing}`), so typos are visible.

### Stylistic English labels

Some labels (eyebrows like `EXPORT`, short brand identifiers, credit lines, the
metadata category taxonomy) are intentionally kept in English across all locales
when that fits the design. Don't translate these mechanically.

These keys are listed in [`src/locales/_exempt.ts`](./src/locales/_exempt.ts).
The coverage checker (below) flags any value that still equals English **unless**
its key is on that list — so a genuine "forgot to translate" is caught, while a
deliberate English label passes. If you intend a value to stay English in every
locale, add its key to `_exempt.ts` (keep it sorted).

### Tone

- **app namespace**: concise, friendly, lowercase sentences (e.g. "Done", "Loading…"). Match the existing tone of your language's macOS / Windows system UI.
- **web namespace**: marketing voice. Slightly more polished but never corporate-sounding.

When in doubt, mirror the tone of the English source string.

## Checking your work

Two commands guard translations, both run on every PR via GitHub Actions:

```bash
pnpm typecheck       # keys preserve the Messages type contract (shape)
pnpm check-coverage  # keys are present and actually translated (coverage)
```

`check-coverage` reports, per locale:

- **stale keys** — present in a locale but not in `en.ts` (a typo or rename); always fails.
- **missing keys** — in `en.ts` but absent from the locale; they fall back to English.
- **untranslated keys** — value still identical to English and not in `_exempt.ts`.

For an in-progress locale, missing/untranslated are warnings — ship what you have.
A green check means your changes are complete and consistent.

## How upstream sync works

This repository is mirrored from the (private) seqlens monorepo via `git subtree`. When a PR is merged here, maintainers pull it back into the monorepo as part of the regular release cycle. You do not need to do anything special — just open the PR here.

## License

By submitting a contribution, you agree to license it under the MIT License (see [LICENSE](./LICENSE)).

## Questions

Open an issue, or email translations@seqlens.app.
