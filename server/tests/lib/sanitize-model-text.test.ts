import { describe, expect, it } from 'vitest';

import { MAX_MODEL_TEXT_LENGTH, sanitizeModelText } from '../../src/lib/sanitize-model-text.js';

describe('sanitizeModelText', () => {
  it('passes ordinary multilingual answers through unchanged', () => {
    const answer = 'Use Gate 6 for step-free access.\n- الطابق الأرضي متاح';
    expect(sanitizeModelText(answer)).toBe(answer);
  });

  it('strips HTML tags an injected prompt could smuggle into the answer', () => {
    const attack = 'Gate 6 <script>alert("xss")</script> is <b>open</b>';
    expect(sanitizeModelText(attack)).toBe('Gate 6 alert("xss") is open');
  });

  it('strips control characters while keeping newlines and tabs', () => {
    const bell = String.fromCharCode(7);
    const escapeChar = String.fromCharCode(27);
    const nul = String.fromCharCode(0);
    const noisy = `TOP RISKS
-	South${bell} Concourse${escapeChar}[31m${nul}`;
    expect(sanitizeModelText(noisy)).toBe('TOP RISKS\n-\tSouth Concourse[31m');
  });

  it('drops stray angle brackets that malformed markup could leave behind', () => {
    expect(sanitizeModelText('Gates 1 < 4 are <open')).toBe('Gates 1  4 are open');
  });

  it('caps runaway output at the documented maximum length', () => {
    const runaway = 'a'.repeat(MAX_MODEL_TEXT_LENGTH + 500);
    expect(sanitizeModelText(runaway)).toHaveLength(MAX_MODEL_TEXT_LENGTH);
  });

  it('trims surrounding whitespace and handles empty input', () => {
    expect(sanitizeModelText('  answer  ')).toBe('answer');
    expect(sanitizeModelText('')).toBe('');
    expect(sanitizeModelText(' ')).toBe('');
  });
});
