# @seqlens/i18n

Translation engine and message catalogs for [seqlens](https://seqlens.app) — the desktop app for browsing image sequences and the marketing site.

This repository is the **public home of seqlens translations**. Community contributors are welcome to fix wording, polish existing locales, and add new languages.

## Supported locales

| Locale | Code | Status |
| --- | --- | --- |
| English | `en` | Source of truth |
| Japanese | `ja` | Complete |

Want to add your language? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Repository layout

```
src/
  index.ts        Public exports — createT, createTn, LOCALES, SUPPORTED_LOCALES
  engine.ts       Translation engine (key lookup, interpolation, plural picker)
  react.ts        React bindings — I18nProvider, useT, useTn, useI18n
  routing.ts      URL helpers for the marketing site (locale prefixes)
  types.ts        Locale / Messages / LeafPath types
  locales/
    en.ts         Source of truth — every key lives here first
    ja.ts         DeepPartial<Messages> — missing keys fall back to en
    _template.ts  Starting point for new locales
```

## API at a glance

### Non-React consumers

```ts
import { createT, createTn, resolveLocale } from '@seqlens/i18n';

const locale = resolveLocale('system', navigator.language); // → 'en' | 'ja'
const t = createT(locale, 'app');
t('common.loading');                       // → "Loading…"
t('common.countSequence_other', { count: 12 }); // → "12 sequences"

const tn = createTn(locale, 'app');
tn(1, 'common.countSequence');             // → "1 sequence"
tn(7, 'common.countSequence');             // → "7 sequences"
```

### React consumers

```tsx
import { I18nProvider, useT, useTn } from '@seqlens/i18n/react';

<I18nProvider preference="system" systemLocale={navigator.language}>
  <App />
</I18nProvider>;

function Header() {
  const t = useT('app');
  return <h1>{t('titleBar.title')}</h1>;
}
```

### Web routing helpers

```ts
import { getLocalizedPath, getLocaleFromPath } from '@seqlens/i18n/routing';

getLocalizedPath('/pricing', 'ja'); // → '/ja/pricing'
getLocaleFromPath('/ja/about');     // → 'ja'
```

## Translation conventions

- **Source of truth is `en.ts`.** New keys land there first; other locales inherit the type and fall back at runtime.
- **Plurals** use CLDR suffixes (`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`) selected by `Intl.PluralRules`. If a locale-specific category is missing, runtime falls back to `_other`. Current catalogs define `_one` / `_other`.
- **Interpolation** uses `{name}` syntax: `'Hello, {name}'` → `t(key, { name: 'Anna' })`.
- **Stylistic English labels** (eyebrows, credit lines, short brand-ish identifiers, the metadata category taxonomy) are intentionally kept in English even in non-English locales when that fits the design. These keys are enumerated in [`src/locales/_exempt.ts`](./src/locales/_exempt.ts).
- **Missing keys fall back to English**, then to the raw key string — so translation gaps degrade gracefully without crashes.

Run `pnpm check-coverage` to verify a locale has no stale keys and nothing left untranslated (a value equal to English that isn't on the exempt list). It runs in CI alongside `pnpm typecheck`.

## About this repo

`@seqlens/i18n` is developed inside the (private) seqlens monorepo and mirrored here via `git subtree`. PRs against this repository flow back upstream automatically. You do **not** need to clone the seqlens monorepo to contribute a translation — just edit files under `src/locales/` and open a PR.

## License

MIT — see [LICENSE](./LICENSE).
