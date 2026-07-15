// Layered rate limiting: a general API budget per client, plus a stricter
// budget on the Gemini-backed endpoints to bound inference cost.
import { rateLimit } from 'express-rate-limit';

import { API_RATE_LIMIT, GENAI_RATE_LIMIT } from '../config/constants.js';

const RATE_LIMIT_MESSAGE = {
  error: { code: 'RATE_LIMITED', message: 'Too many requests — please slow down.' },
};

/** General limit applied to every /api route. */
export const apiLimiter = rateLimit({
  windowMs: API_RATE_LIMIT.windowMs,
  limit: API_RATE_LIMIT.limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});

/** Stricter limit for endpoints that trigger Gemini inference. */
export const genAiLimiter = rateLimit({
  windowMs: GENAI_RATE_LIMIT.windowMs,
  limit: GENAI_RATE_LIMIT.limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: RATE_LIMIT_MESSAGE,
});
