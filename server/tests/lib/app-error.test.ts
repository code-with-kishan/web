import { describe, expect, it } from 'vitest';

import { AppError } from '../../src/lib/app-error.js';

describe('AppError', () => {
  it('carries the status, code, and message and is a real Error', () => {
    const error = new AppError(418, 'TEAPOT', 'short and stout');
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe('TEAPOT');
    expect(error.message).toBe('short and stout');
    expect(error.name).toBe('AppError');
  });

  it('badRequest is a 400 BAD_REQUEST', () => {
    const error = AppError.badRequest('missing field');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('missing field');
  });

  it('notFound is a 404 NOT_FOUND', () => {
    const error = AppError.notFound('no route');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('no route');
  });

  it('upstreamFailure is a 502 with an upper-cased dependency code', () => {
    const error = AppError.upstreamFailure('gemini', 'timeout');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('GEMINI_UNAVAILABLE');
    expect(error.message).toBe('timeout');
  });
});
