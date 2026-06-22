import type { Messages } from './locales/en';
import type { Locale } from './locales/registry';

export type { Messages } from './locales/en';
/** Languages with translation catalogs. Defined in `locales/registry.ts`. */
export type { Locale } from './locales/registry';

/** User-facing preference; `'system'` defers to OS locale. */
export type LanguagePreference = 'system' | Locale;

/** Resolved concrete locale. */
export type ResolvedLocale = Locale;

/** Deeply optional; lets non-canonical locales fall back to en for missing keys. */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/** Dot-paths to string leaves (e.g. `"app.settings.general.themeLabel"`). */
export type LeafPath<T, P extends string = ''> = T extends string
  ? P
  : T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: LeafPath<T[K], P extends '' ? K : `${P}.${K}`>;
      }[keyof T & string]
    : never;

export type MessageKey = LeafPath<Messages>;

/** Message keys under the `app` namespace, without the `app.` prefix. */
export type AppMessageKey = LeafPath<Messages['app']>;

/** Message keys under the `web` namespace, without the `web.` prefix. */
export type WebMessageKey = LeafPath<Messages['web']>;
