// Minimal Gemini REST API client for Vercel serverless functions.
// Uses native fetch (Node 18+), no SDK dependency required.
// Returns undefined when GEMINI_API_KEY is not set or when the call fails.

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_OUTPUT_TOKENS = 1024;
const TIMEOUT_MS = 25_000;

/**
 * Calls the Gemini REST API synchronously.
 * Returns undefined (instead of throwing) if the key is missing or the call fails,
 * so callers can gracefully fall back to pre-fed answers.
 */
export async function generateText(prompt: string): Promise<string | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${String(response.status)}`);
      return undefined;
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.trim().length > 0 ? text.trim() : undefined;
  } catch (err) {
    console.error('Gemini fetch failed:', err);
    return undefined;
  }
}
