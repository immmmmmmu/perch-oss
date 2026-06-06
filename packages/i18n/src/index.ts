// @perch/i18n — type-safe message catalogue powered by Paraglide JS 2.
//
// Generated output lives under `./paraglide/`. Re-export the runtime + the
// `m` namespace (Paraglide's auto-import surface) so consumers can write:
//
//     import { m, setLocale } from '@perch/i18n';
//     m.common_login();              // → "ログイン" / "Sign in"
//     setLocale('en');               // switch active locale
//
// Trace: TASK-0004 / FR-18 / NFR-8.

export const PERCH_I18N_VERSION = '0.0.0' as const;
export const SUPPORTED_LOCALES = ['ja', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export { m } from './paraglide/messages.js';
export {
  getLocale,
  setLocale,
  baseLocale,
  locales,
  isLocale,
  type Locale as ParaglideLocale,
} from './paraglide/runtime.js';
