// Application-wide constants. Every tunable number lives here so behaviour
// is auditable in one place.

/** Fallback HTTP port when Cloud Run does not inject one. */
export const DEFAULT_PORT = 8080;

/** Maximum accepted JSON request body. */
export const JSON_BODY_LIMIT = '100kb';

/** Maximum length of a fan question sent to the assistant. */
export const MAX_QUESTION_LENGTH = 500;

/** How long an identical assistant answer is served from cache. */
export const ASSISTANT_CACHE_TTL_MS = 5 * 60_000;

/** How long an operations briefing is reused before regenerating. */
export const BRIEFING_CACHE_TTL_MS = 60_000;

/** Upper bound on cached entries before the oldest is evicted. */
export const CACHE_MAX_ENTRIES = 500;

/** Hard timeout for a single Gemini call. */
export const GEMINI_TIMEOUT_MS = 30_000;

/** Output budget for Gemini responses (answers and briefings are short). */
export const GEMINI_MAX_OUTPUT_TOKENS = 1024;

/**
 * Thinking-token budget. Zero disables Gemini 2.5's internal reasoning, which
 * these well-structured prompts do not need — it removes latency and prevents
 * thinking from consuming the whole output budget and returning empty text.
 */
export const GEMINI_THINKING_BUDGET = 0;

/** Interval between simulated crowd-telemetry updates written to Firestore. */
export const TELEMETRY_TICK_MS = 60_000;

/** Bounds of the simulated zone occupancy random walk, as a percentage. */
export const TELEMETRY_MIN_DENSITY_PCT = 15;
export const TELEMETRY_MAX_DENSITY_PCT = 98;
export const TELEMETRY_MAX_STEP_PCT = 6;

/** Upper bound of water-bottle refills added per simulated telemetry tick. */
export const TELEMETRY_REFILL_MAX_GROWTH = 40;

/** Zone density above which a zone is flagged busy / critical. */
export const DENSITY_BUSY_PCT = 65;
export const DENSITY_CRITICAL_PCT = 85;

/** General API rate limit per client IP. */
export const API_RATE_LIMIT = { windowMs: 15 * 60_000, limit: 300 } as const;

/** Stricter limit for the two Gemini-backed endpoints (cost control). */
export const GENAI_RATE_LIMIT = { windowMs: 60_000, limit: 15 } as const;
