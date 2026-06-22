import { en } from './locales/en';
import { ja } from './locales/ja';
import { DEFAULT_LOCALE, detectLocale } from './locales/registry';
import type {
  AppMessageKey,
  DeepPartial,
  Locale,
  MessageKey,
  Messages,
  ResolvedLocale,
  WebMessageKey,
} from './types';

export { SUPPORTED_LOCALES } from './locales/registry';

/** Runtime catalogs. This is the one spot a new locale's catalog is bound. */
export const LOCALES: Record<Locale, DeepPartial<Messages>> = { en, ja };

/** Maps an OS locale tag (BCP 47, e.g. "ja-JP") to a supported locale. */
export function resolveSystemLocale(
  osLocale: string | undefined
): ResolvedLocale {
  if (!osLocale) return DEFAULT_LOCALE;
  const lang = osLocale.toLowerCase().split(/[-_]/)[0];
  return detectLocale(lang) ?? DEFAULT_LOCALE;
}

/** Collapses 'system' to a concrete locale using the OS-provided locale tag. */
export function resolveLocale(
  preference: 'system' | Locale,
  systemLocale: string | undefined
): ResolvedLocale {
  if (preference === 'system') return resolveSystemLocale(systemLocale);
  return preference;
}

function lookup(
  messages: DeepPartial<Messages>,
  path: string
): string | undefined {
  let cur: unknown = messages;
  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function hasKey(locale: ResolvedLocale, path: string): boolean {
  return (
    lookup(LOCALES[locale], path) !== undefined ||
    lookup(en, path) !== undefined
  );
}

const pluralRulesByLocale = new Map<ResolvedLocale, Intl.PluralRules>();

function getPluralRules(locale: ResolvedLocale): Intl.PluralRules {
  const cached = pluralRulesByLocale.get(locale);
  if (cached) return cached;
  const rules = new Intl.PluralRules(locale);
  pluralRulesByLocale.set(locale, rules);
  return rules;
}

function interpolate(
  template: string,
  vars: Record<string, string | number> | undefined
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : `{${key}}`
  );
}

export type Vars = Record<string, string | number>;

/**
 * Locale-bound translator. `K` is the key space; it defaults to `AppMessageKey`
 * so existing `t: TranslateFn` annotations (all app-namespace) stay typed
 * without edits. Use `TranslateFn<WebMessageKey>` / `TranslateFn<MessageKey>`
 * for the web / un-namespaced translators.
 */
export type TranslateFn<K extends string = AppMessageKey> = (
  key: K,
  vars?: Vars
) => string;

/** Pluralized translator using the locale's CLDR plural category. */
export type TranslateNFn = (
  count: number,
  baseKey: string,
  vars?: Vars
) => string;

export function createTn(
  locale: ResolvedLocale,
  namespace?: string
): TranslateNFn {
  const t = createT(locale, namespace);
  const prefix = namespace ? `${namespace}.` : '';
  return (count, baseKey, vars) => {
    const category = getPluralRules(locale).select(count);
    const categoryKey = `${baseKey}_${category}`;
    const key = hasKey(locale, `${prefix}${categoryKey}`)
      ? categoryKey
      : `${baseKey}_other`;
    return t(key, vars);
  };
}

/** `t(key, vars?)` bound to a locale. Falls back to en, then to the raw key. */
export function createT(
  locale: ResolvedLocale,
  namespace: 'app'
): TranslateFn<AppMessageKey>;
export function createT(
  locale: ResolvedLocale,
  namespace: 'web'
): TranslateFn<WebMessageKey>;
export function createT(
  locale: ResolvedLocale,
  namespace?: undefined
): TranslateFn<MessageKey>;
export function createT(
  locale: ResolvedLocale,
  namespace?: string
): TranslateFn<string>;
export function createT(
  locale: ResolvedLocale,
  namespace?: string
): TranslateFn<string> {
  const messages = LOCALES[locale];
  const prefix = namespace ? `${namespace}.` : '';
  return (key, vars) => {
    const fullKey = `${prefix}${key}`;
    const found = lookup(messages, fullKey) ?? lookup(en, fullKey);
    return interpolate(found ?? fullKey, vars);
  };
}
