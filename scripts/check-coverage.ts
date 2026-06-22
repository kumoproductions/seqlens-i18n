/**
 * Translation coverage checker. Run with `pnpm check-coverage`.
 *
 * Complements `tsc` (which guarantees key *shape*) by checking key *coverage*:
 * - stale keys (present in a locale, absent from en) — always an error
 * - missing keys (in en, absent from the locale) — error for complete locales,
 *   warning otherwise (incomplete locales fall back to English by design)
 * - untranslated keys (value identical to en, not in the exempt list) — same
 *   severity as missing; this is what catches a forgotten translation
 *
 * Locales are imported directly (with `.ts`) so the script runs under
 * `node --experimental-strip-types` without a bundler.
 */
import { en } from '../src/locales/en.ts';
import { ja } from '../src/locales/ja.ts';
import { EXEMPT_KEYS } from '../src/locales/_exempt.ts';
import { LOCALE_META, SUPPORTED_LOCALES } from '../src/locales/registry.ts';

type Catalog = Record<string, unknown>;

// Registry drives which locales are checked and which are "complete". Catalogs
// are bound here directly (with `.ts`) so the script runs under Node; a locale
// registered in registry.ts but missing here is reported as an error below.
const CATALOGS: Record<string, Catalog> = { en, ja };

function leaves(obj: unknown, prefix = '', out = new Map<string, string>()) {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object') leaves(v, p, out);
      else if (typeof v === 'string') out.set(p, v);
    }
  }
  return out;
}

const enLeaves = leaves(en);
const exempt = new Set(EXEMPT_KEYS);
let errors = 0;

function report(label: string, keys: string[], fatal: boolean) {
  if (keys.length === 0) return;
  const mark = fatal ? 'ERROR' : 'warn';
  if (fatal) errors += keys.length;
  console.log(`  ${mark} ${label}: ${keys.length}`);
  for (const k of keys.slice(0, 40)) console.log(`    ${k}`);
  if (keys.length > 40) console.log(`    … and ${keys.length - 40} more`);
}

console.log(`en: ${enLeaves.size} keys, exempt: ${exempt.size}\n`);

// Keep the exempt list honest: real keys, sorted, no duplicates.
const danglingExempt = EXEMPT_KEYS.filter((k) => !enLeaves.has(k));
const duplicateExempt = EXEMPT_KEYS.filter((k, i) => EXEMPT_KEYS.indexOf(k) !== i);
const sortedExempt = [...EXEMPT_KEYS].sort();
const unsortedExempt = EXEMPT_KEYS.filter((k, i) => k !== sortedExempt[i]);
if (danglingExempt.length || duplicateExempt.length || unsortedExempt.length) {
  console.log('_exempt.ts');
  report('entries not found in en (stale)', danglingExempt, true);
  report('duplicate entries', duplicateExempt, true);
  report('entries out of sorted order', unsortedExempt, true);
  console.log('');
}

for (const locale of SUPPORTED_LOCALES) {
  if (LOCALE_META[locale].source) continue;
  const catalog = CATALOGS[locale];
  if (!catalog) {
    console.log(locale);
    report('registered locale has no catalog bound in check-coverage', [locale], true);
    console.log('');
    continue;
  }
  const complete = LOCALE_META[locale].complete === true;
  console.log(`${locale}${complete ? ' [complete]' : ''}`);
  const loc = leaves(catalog);

  const stale = [...loc.keys()].filter((k) => !enLeaves.has(k));
  const missing = [...enLeaves.keys()].filter((k) => !loc.has(k));
  const untranslated = [...loc.entries()]
    .filter(([k, v]) => enLeaves.get(k) === v && !exempt.has(k))
    .map(([k]) => k);

  report('stale keys (not in en)', stale, true);
  report('missing keys', missing, complete);
  report('untranslated (identical to en)', untranslated, complete);

  if (!stale.length && !missing.length && !untranslated.length) {
    console.log('  ✓ fully covered');
  }
  console.log('');
}

if (errors > 0) {
  console.log(`✗ coverage failed: ${errors} error(s)`);
  process.exit(1);
}
console.log('✓ coverage OK');
