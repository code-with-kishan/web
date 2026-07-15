// Static UI content for the fan assistant: supported languages and the
// quick-action prompts shown as chips.
import type { SupportedLanguage } from '../../lib/api-types.js';

/** A language option offered in the assistant's language selector. */
export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
}

/** Languages the assistant answers in (native names for recognisability). */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
];

/**
 * Narrows an arbitrary string (e.g. a `<select>` value) to a
 * SupportedLanguage, falling back to English if it is not a recognised code.
 * Cast-free: the matched option's `code` is already typed as the union.
 */
export function parseLanguage(value: string): SupportedLanguage {
  return LANGUAGE_OPTIONS.find((option) => option.code === value)?.code ?? 'en';
}

/** One-tap questions covering navigation, accessibility and transport. */
export const QUICK_ACTIONS: string[] = [
  'Which gate should I use for section 150?',
  'What is the step-free route to accessible seating?',
  'Where is the nearest prayer room?',
  'How do I get to the metro after the match?',
  'Where can I refill a water bottle?',
];
