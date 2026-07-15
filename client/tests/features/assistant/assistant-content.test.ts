import { describe, expect, it } from 'vitest';

import { parseLanguage } from '../../../src/features/assistant/assistant-content.js';

describe('parseLanguage', () => {
  it('returns a recognised language code unchanged', () => {
    expect(parseLanguage('es')).toBe('es');
  });

  it('falls back to English for an unrecognised code', () => {
    expect(parseLanguage('xx')).toBe('en');
  });
});
