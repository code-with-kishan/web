// Output boundary for LLM-generated text. The prompts instruct the model to
// return plain text, but generated output is untrusted by definition: this is
// the enforcement layer that guarantees no markup, control characters, or
// unbounded payload ever reaches an API response (defence in depth against
// prompt injection).

/** Hard ceiling on generated text returned to clients, in characters. */
export const MAX_MODEL_TEXT_LENGTH = 8_000;

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/gi;

const DELETE_CHAR_CODE = 0x7f;
const FIRST_PRINTABLE_CODE = 0x20;

/**
 * Printable characters pass; of the control range only \n and \t survive.
 * Stray angle brackets are also dropped so nothing tag-like — even malformed
 * fragments the tag pattern cannot match — survives sanitization.
 */
function isAllowedCharacter(character: string): boolean {
  if (character === '<' || character === '>') {
    return false;
  }
  const code = character.charCodeAt(0);
  if (code >= FIRST_PRINTABLE_CODE) {
    return code !== DELETE_CHAR_CODE;
  }
  return character === '\n' || character === '\t';
}

/**
 * Sanitizes model-generated text before it leaves the API: strips HTML tags
 * and control characters, trims surrounding whitespace, and caps the length.
 * Idempotent and safe for empty input.
 */
export function sanitizeModelText(text: string): string {
  let kept = '';
  for (const character of text.replace(HTML_TAG_PATTERN, '')) {
    if (isAllowedCharacter(character)) {
      kept += character;
    }
  }
  const cleaned = kept.trim();
  return cleaned.length > MAX_MODEL_TEXT_LENGTH ? cleaned.slice(0, MAX_MODEL_TEXT_LENGTH) : cleaned;
}
