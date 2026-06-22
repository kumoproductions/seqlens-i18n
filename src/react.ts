import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createT,
  createTn,
  resolveLocale,
  type TranslateFn,
  type TranslateNFn,
} from './engine';
import type {
  AppMessageKey,
  LanguagePreference,
  MessageKey,
  ResolvedLocale,
  WebMessageKey,
} from './types';

interface I18nContextValue {
  /** Concrete locale being rendered. */
  locale: ResolvedLocale;
  /** User preference (may be 'system'); independent from `locale`. */
  preference: LanguagePreference;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  preference: LanguagePreference;
  /** OS locale tag (e.g. Electron `app.getLocale()` via IPC). */
  systemLocale: string | undefined;
  children: ReactNode;
}

/** Resolves preference + systemLocale to a concrete locale and re-renders on change. */
export function I18nProvider({
  preference,
  systemLocale,
  children,
}: I18nProviderProps): React.JSX.Element {
  const locale = resolveLocale(preference, systemLocale);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, preference }),
    [locale, preference]
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

/** Translator bound to current locale; namespace is auto-prepended. */
export function useT(namespace: 'app'): TranslateFn<AppMessageKey>;
export function useT(namespace: 'web'): TranslateFn<WebMessageKey>;
export function useT(namespace?: undefined): TranslateFn<MessageKey>;
export function useT(namespace?: string): TranslateFn<string>;
export function useT(namespace?: string): TranslateFn<string> {
  const { locale } = useI18n();
  return useCallback<TranslateFn<string>>(
    (key, vars) => createT(locale, namespace)(key, vars),
    [locale, namespace]
  );
}

/** Pluralized translator bound to current locale; namespace is auto-prepended. */
export function useTn(namespace?: string): TranslateNFn {
  const { locale } = useI18n();
  return useMemo(() => createTn(locale, namespace), [locale, namespace]);
}

/** Subscribes to `seqlens:language-changed` to keep preference state in sync. */
export function useLanguagePreferenceState(
  initial: LanguagePreference
): [LanguagePreference, (next: LanguagePreference) => void] {
  const [preference, setPreference] = useState<LanguagePreference>(initial);
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<LanguagePreference>).detail;
      setPreference(next);
    };
    window.addEventListener('seqlens:language-changed', handler);
    return () =>
      window.removeEventListener('seqlens:language-changed', handler);
  }, []);
  return [preference, setPreference];
}
