import { describe, expect, it } from 'vitest';

import { askRequestSchema } from '../../../src/features/assistant/schemas.js';

describe('askRequestSchema', () => {
  it('accepts a valid question and defaults the language to English', () => {
    const parsed = askRequestSchema.parse({ question: 'Where is Gate 4?' });
    expect(parsed.language).toBe('en');
    expect(parsed.question).toBe('Where is Gate 4?');
  });

  it('trims surrounding whitespace from the question', () => {
    const parsed = askRequestSchema.parse({ question: '  metro?  ' });
    expect(parsed.question).toBe('metro?');
  });

  it('rejects an empty question', () => {
    expect(askRequestSchema.safeParse({ question: '   ' }).success).toBe(false);
  });

  it('rejects a question longer than 500 characters', () => {
    const oversized = 'a'.repeat(501);
    expect(askRequestSchema.safeParse({ question: oversized }).success).toBe(false);
  });

  it('rejects an unsupported language code', () => {
    expect(askRequestSchema.safeParse({ question: 'hola', language: 'de' }).success).toBe(false);
  });

  it('rejects unknown keys (strict boundary)', () => {
    const result = askRequestSchema.safeParse({ question: 'hi', injected: 'payload' });
    expect(result.success).toBe(false);
  });
});
