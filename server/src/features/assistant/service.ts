// Assistant feature logic: grounded, cached, multilingual answers.
import { ASSISTANT_CACHE_TTL_MS, CACHE_MAX_ENTRIES } from '../../config/constants.js';
import { generateText } from '../../lib/gemini.js';
import { TtlCache } from '../../lib/ttl-cache.js';
import { buildGroundingContext } from '../stadium/service.js';
import { buildAssistantPrompt } from './prompts.js';
import type { AskRequest } from './schemas.js';
import type { AssistantAnswer } from './types.js';

const answerCache = new TtlCache<string>(ASSISTANT_CACHE_TTL_MS, CACHE_MAX_ENTRIES);

function cacheKey(request: AskRequest): string {
  return `${request.language}:${request.question.toLowerCase()}`;
}

/**
 * Answers a fan question in the requested language, grounded in the venue
 * dataset. Identical questions are served from cache to keep quick actions
 * instant and Gemini cost bounded.
 */
export async function askAssistant(request: AskRequest): Promise<AssistantAnswer> {
  const key = cacheKey(request);
  const cachedAnswer = answerCache.get(key);
  if (cachedAnswer !== undefined) {
    return { answer: cachedAnswer, language: request.language, cached: true };
  }

  const prompt = buildAssistantPrompt(request.question, request.language, buildGroundingContext());
  const answer = await generateText(prompt);
  answerCache.set(key, answer);
  return { answer, language: request.language, cached: false };
}

/** Clears the answer cache (used by tests). */
export function clearAssistantCache(): void {
  answerCache.clear();
}
