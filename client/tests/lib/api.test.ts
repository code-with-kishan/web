import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  askAssistant,
  fetchSnapshot,
  requestBriefing,
  toErrorMessage,
} from '../../src/lib/api.js';

function mockFetch(response: Partial<Response> & { json: () => Promise<unknown> }): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('askAssistant', () => {
  it('posts the question and language and returns the parsed answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ answer: 'Gate 6', language: 'en', cached: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await askAssistant('Where is the accessible gate?', 'en');

    expect(result.answer).toBe('Gate 6');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      question: 'Where is the accessible gate?',
      language: 'en',
    });
  });

  it('throws an ApiError carrying the server message on a 4xx/5xx', async () => {
    mockFetch({
      ok: false,
      json: () => Promise.resolve({ error: { code: 'BAD_REQUEST', message: 'question required' } }),
    });
    const error = await askAssistant('x', 'en').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('BAD_REQUEST');
    expect((error as ApiError).message).toBe('question required');
  });

  it('maps a network failure to a generic ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await askAssistant('x', 'en').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('NETWORK');
  });
});

describe('error body handling', () => {
  it('maps a non-JSON error response to a generic ApiError', async () => {
    mockFetch({ ok: false, json: () => Promise.reject(new SyntaxError('not json')) });
    const error = await askAssistant('x', 'en').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('UNKNOWN');
    expect((error as ApiError).message).toContain('temporarily unavailable');
  });

  it('maps a malformed error envelope to a generic ApiError', async () => {
    // An error field that is not an object, and one whose message is not a
    // string, must both fall back to the safe generic message.
    mockFetch({ ok: false, json: () => Promise.resolve({ error: 'catastrophe' }) });
    const stringError = await askAssistant('x', 'en').catch((caught: unknown) => caught);
    expect((stringError as ApiError).code).toBe('UNKNOWN');

    mockFetch({ ok: false, json: () => Promise.resolve({ error: { code: 'X', message: 42 } }) });
    const numberMessage = await askAssistant('x', 'en').catch((caught: unknown) => caught);
    expect((numberMessage as ApiError).code).toBe('UNKNOWN');
  });
});

describe('response-shape validation', () => {
  it('rejects a 200 response whose body is not the expected shape', async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ unexpected: 'shape' }) });
    const error = await askAssistant('x', 'en').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('MALFORMED');
  });
});

describe('operations API calls', () => {
  it('fetchSnapshot returns the snapshot payload', async () => {
    mockFetch({
      ok: true,
      json: () =>
        Promise.resolve({ zones: [], incidents: [], sustainability: {}, generatedAt: 'now' }),
    });
    const snapshot = await fetchSnapshot();
    expect(snapshot.generatedAt).toBe('now');
  });

  it('requestBriefing returns the briefing payload', async () => {
    mockFetch({
      ok: true,
      json: () => Promise.resolve({ briefing: 'TOP RISKS', generatedAt: 'now' }),
    });
    const briefing = await requestBriefing();
    expect(briefing.briefing).toBe('TOP RISKS');
  });
});

describe('toErrorMessage', () => {
  it('returns the sanitized message of an ApiError', () => {
    expect(toErrorMessage(new ApiError('BAD_REQUEST', 'question required'), 'fallback')).toBe(
      'question required',
    );
  });

  it('returns the fallback for any non-ApiError value', () => {
    expect(toErrorMessage(new Error('leaky internal detail'), 'fallback')).toBe('fallback');
    expect(toErrorMessage('a string', 'fallback')).toBe('fallback');
  });
});
