// Domain types for the multilingual fan assistant. SupportedLanguage is
// derived from the schema's language list so the type and the runtime
// validation can never drift apart.
import type { SUPPORTED_LANGUAGES } from './schemas.js';

/** Languages the assistant answers in (FIFA World Cup 2026 host + top fan languages). */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** A grounded answer returned to the client. */
export interface AssistantAnswer {
  answer: string;
  language: SupportedLanguage;
  cached: boolean;
}
