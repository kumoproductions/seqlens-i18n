/**
 * Single source of truth for which locales exist and how they behave.
 *
 * This module intentionally has NO value imports. It is loaded both by the
 * bundler build graph and by `scripts/check-coverage.ts`, which runs under
 * `node --experimental-strip-types` and cannot resolve the extensionless
 * relative imports used elsewhere in the package. Keep it import-free.
 *
 * Adding a locale: add an entry here, then bind its catalog in `engine.ts`.
 * Everything else (the `Locale` type, supported list, OS auto-detection,
 * routing, and coverage) derives from this map.
 */

export interface LocaleMeta {
  /** The canonical catalog other locales inherit from. Exactly one locale. */
  source?: boolean;
  /** Fully translated; coverage treats gaps as errors rather than warnings. */
  complete?: boolean;
  /** BCP-47 primary language subtags that auto-detect to this locale. */
  detect: readonly string[];
}

const META = {
  en: { source: true, complete: true, detect: ['en'] },
  ja: { complete: true, detect: ['ja'] },
} satisfies Record<string, LocaleMeta>;

export type Locale = keyof typeof META;

export const LOCALE_META: Record<Locale, LocaleMeta> = META;

export const SUPPORTED_LOCALES: readonly Locale[] = Object.keys(
  LOCALE_META
) as Locale[];

/** Source-of-truth locale; the routing default and the universal fallback. */
export const DEFAULT_LOCALE: Locale =
  SUPPORTED_LOCALES.find((l) => LOCALE_META[l].source) ?? 'en';

/** Maps a BCP-47 primary subtag (e.g. "ja") to a locale, if one claims it. */
export function detectLocale(lang: string): Locale | undefined {
  return SUPPORTED_LOCALES.find((code) =>
    LOCALE_META[code].detect.includes(lang)
  );
}
