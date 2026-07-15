// Gemini access through the official @google/genai SDK. One client is
// shared across requests; every call gets a hard timeout and one retry.
import { GoogleGenAI } from '@google/genai';

import { env } from '../config/env.js';
import {
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_THINKING_BUDGET,
  GEMINI_TIMEOUT_MS,
} from '../config/constants.js';
import { AppError } from './app-error.js';
import { logger } from './logger.js';
import { sanitizeModelText } from './sanitize-model-text.js';

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

async function requestText(prompt: string): Promise<string | undefined> {
  const response = await getClient().models.generateContent({
    model: env.GEMINI_MODEL,
    contents: prompt,
    config: {
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET },
      abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    },
  });
  return response.text;
}

/**
 * Generates plain text from Gemini for the given prompt.
 *
 * Transient failures are retried once; persistent failures surface as a 502
 * AppError so the client sees a sanitized, actionable message. Model output
 * is untrusted: it passes through {@link sanitizeModelText} (markup and
 * control characters stripped, length capped) before reaching any caller.
 *
 * @param prompt - Full prompt including system framing and grounding data.
 * @returns The model's sanitized text response.
 */
export async function generateText(prompt: string): Promise<string> {
  let text: string | undefined;
  try {
    text = await requestText(prompt);
  } catch (firstError) {
    logger.warn({ err: firstError }, 'Gemini call failed, retrying once');
    try {
      text = await requestText(prompt);
    } catch (secondError) {
      logger.error({ err: secondError }, 'Gemini call failed after retry');
      throw AppError.upstreamFailure('gemini', 'The AI service is temporarily unavailable.');
    }
  }
  const sanitized = text === undefined ? '' : sanitizeModelText(text);
  if (sanitized === '') {
    throw AppError.upstreamFailure('gemini', 'The AI service returned an empty response.');
  }
  return sanitized;
}
