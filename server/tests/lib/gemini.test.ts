import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../src/lib/app-error.js';

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

const { generateText } = await import('../../src/lib/gemini.js');

describe('generateText', () => {
  beforeEach(() => {
    generateContentMock.mockReset();
  });

  it('returns trimmed model text on success', async () => {
    generateContentMock.mockResolvedValue({ text: '  Gate 6 is step-free.  ' });
    await expect(generateText('prompt')).resolves.toBe('Gate 6 is step-free.');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('retries once after a transient failure and then succeeds', async () => {
    generateContentMock
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValue({ text: 'answer' });
    await expect(generateText('prompt')).resolves.toBe('answer');
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it('maps repeated failures to a 502 AppError with a sanitized message', async () => {
    generateContentMock.mockRejectedValue(new Error('internal quota detail'));
    const error = await generateText('prompt').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(502);
    expect((error as AppError).message).not.toContain('quota');
  });

  it('treats an empty model response as an upstream failure', async () => {
    generateContentMock.mockResolvedValue({ text: '' });
    const error = await generateText('prompt').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(502);
  });
});
