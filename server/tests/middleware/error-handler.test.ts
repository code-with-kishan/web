import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../../src/lib/app-error.js';
import { errorHandler, notFoundHandler } from '../../src/middleware/error-handler.js';

function makeRes(): Response & { statusCode?: number; body?: unknown } {
  const res = {
    status: vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((body: unknown) => {
      res.body = body;
      return res;
    }),
  } as unknown as Response & { statusCode?: number; body?: unknown };
  return res;
}

const req = { method: 'GET', path: '/test' } as Request;
const next = vi.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  it('passes an AppError through with its status, code and message', () => {
    const res = makeRes();
    errorHandler(AppError.badRequest('question: Required'), req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: { code: 'BAD_REQUEST', message: 'question: Required' },
    });
  });

  it('wraps an unexpected Error as 500 and hides its message from the client', () => {
    const res = makeRes();
    errorHandler(new Error('db password leaked in trace'), req, res, next);
    expect(res.statusCode).toBe(500);
    const body = res.body as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL');
    expect(body.error.message).not.toContain('password');
  });

  it('handles a thrown non-Error value without crashing', () => {
    const res = makeRes();
    errorHandler('a raw string was thrown', req, res, next);
    expect(res.statusCode).toBe(500);
    const body = res.body as { error: { code: string; message: string } };
    expect(body.error.code).toBe('INTERNAL');
    // The sanitized message never echoes arbitrary thrown values.
    expect(body.error.message).not.toContain('raw string');
  });
});

describe('notFoundHandler', () => {
  it('forwards a 404 AppError with a static, non-reflected message', () => {
    const forward = vi.fn();
    notFoundHandler(req, makeRes(), forward as NextFunction);
    const forwarded = (forward.mock.calls[0] as unknown[])[0] as AppError;
    expect(forwarded).toBeInstanceOf(AppError);
    expect(forwarded.statusCode).toBe(404);
    // Request input must never be echoed back into the response body.
    expect(forwarded.message).toBe('No matching route.');
  });
});
