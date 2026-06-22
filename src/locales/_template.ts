import type { DeepPartial, Messages } from '../types';

/**
 * New-locale starter. Copy to `<locale>.ts`, rename the export, translate values.
 * Keys must match en.ts (missing keys fall back to English).
 * Register in src/types.ts, src/engine.ts, src/routing.ts. See CONTRIBUTING.md.
 * Plurals: provide both `_one` and `_other`. Interpolate with `{name}`.
 * Stylistic English labels stay English across locales (see ja.ts).
 */
export const __template: DeepPartial<Messages> = {
  app: {},
  web: {},
};
