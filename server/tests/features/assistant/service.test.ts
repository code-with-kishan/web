import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../../src/lib/app-error.js';

const generateTextMock = vi.fn();

vi.mock('../../../src/lib/gemini.js', () => ({
  generateText: generateTextMock,
}));

const { askAssistant, clearAssistantCache } =
  await import('../../../src/features/assistant/service.js');

describe('askAssistant', () => {
  beforeEach(() => {
    generateTextMock.mockReset();
    clearAssistantCache();
  });

  it('returns a grounded answer in the requested language', async () => {
    generateTextMock.mockResolvedValue('La Puerta 6 tiene acceso sin escalones.');
    const result = await askAssistant({
      question: '¿Dónde está el acceso accesible?',
      language: 'es',
    });
    expect(result.answer).toContain('Puerta 6');
    expect(result.language).toBe('es');
    expect(result.cached).toBe(false);
  });

  it('embeds the venue grounding data and the question in the prompt', async () => {
    generateTextMock.mockResolvedValue('answer');
    await askAssistant({ question: 'Where can I refill my water bottle?', language: 'en' });
    const prompt = generateTextMock.mock.calls[0]?.[0] as string;
    expect(prompt).toContain('Estadio Azteca');
    expect(prompt).toContain('Where can I refill my water bottle?');
    expect(prompt).toContain('Reply in English.');
  });

  it('serves an identical question from cache without a second Gemini call', async () => {
    generateTextMock.mockResolvedValue('Gate 4 serves the South Stand.');
    const first = await askAssistant({ question: 'Which gate for section 150?', language: 'en' });
    const second = await askAssistant({ question: 'Which gate for section 150?', language: 'en' });
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.answer).toBe(first.answer);
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('caches per language, so the same question in Spanish triggers a new call', async () => {
    generateTextMock.mockResolvedValue('answer');
    await askAssistant({ question: 'Where is the prayer room?', language: 'en' });
    await askAssistant({ question: 'Where is the prayer room?', language: 'es' });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it('propagates upstream failures unchanged for the error middleware', async () => {
    generateTextMock.mockRejectedValue(AppError.upstreamFailure('gemini', 'down'));
    await expect(askAssistant({ question: 'hello', language: 'en' })).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
