import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from './locales/registry';

export const defaultLocale: Locale = DEFAULT_LOCALE;
export const locales: readonly Locale[] = SUPPORTED_LOCALES;

/** Prepends locale prefix; default locale gets no prefix. Preserves hash placement. */
export function getLocalizedPath(path: string, locale: Locale): string {
  const hashIdx = path.indexOf('#');
  const hash = hashIdx >= 0 ? path.slice(hashIdx) : '';
  const pathOnly = hashIdx >= 0 ? path.slice(0, hashIdx) : path;
  const cleanPath = pathOnly.startsWith('/') ? pathOnly.slice(1) : pathOnly;

  if (locale === defaultLocale) {
    return `/${cleanPath}${hash}`;
  }
  return `/${locale}${cleanPath ? `/${cleanPath}` : ''}${hash}`;
}

/** Extracts the locale prefix from a URL pathname; falls back to the default. */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] as Locale;

  if (locales.includes(firstSegment) && firstSegment !== defaultLocale) {
    return firstSegment;
  }
  return defaultLocale;
}

/** Locale to switch to when toggling. */
export function getAlternateLocale(currentLocale: Locale): Locale {
  const currentIndex = locales.indexOf(currentLocale);
  const nextIndex = (currentIndex + 1) % locales.length;
  return locales[nextIndex];
}

/** Drops the leading locale segment from a pathname when present. */
export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] as Locale;

  if (locales.includes(firstSegment)) {
    return `/${segments.slice(1).join('/')}`;
  }

  return pathname;
}
