// Boundary validation for the assistant feature.
import { z } from 'zod';

import { MAX_QUESTION_LENGTH } from '../../config/constants.js';

/** Language codes accepted by the assistant. */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt', 'ar'] as const;

/** Body schema for POST /api/assistant/ask. Unknown keys are rejected. */
export const askRequestSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(1, 'question must not be empty')
      .max(
        MAX_QUESTION_LENGTH,
        `question must be at most ${String(MAX_QUESTION_LENGTH)} characters`,
      ),
    language: z.enum(SUPPORTED_LANGUAGES).default('en'),
  })
  .strict();

/** Parsed ask request. */
export type AskRequest = z.infer<typeof askRequestSchema>;
