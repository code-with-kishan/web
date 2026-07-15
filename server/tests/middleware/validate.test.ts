import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError } from '../../src/lib/app-error.js';
import {
  validateBody,
  validatedBody,
  validatedQuery,
  validateQuery,
} from '../../src/middleware/validate.js';

function run(
  handler: ReturnType<typeof validateBody>,
  req: Partial<Request>,
): ReturnType<typeof vi.fn> {
  const next = vi.fn();
  handler(req as Request, {} as Response, next as NextFunction);
  return next;
}

describe('validateBody + validatedBody', () => {
  const schema = z.object({ question: z.string().min(1) }).strict();

  it('lets a valid body through and reads it back fully typed', () => {
    const req = { body: { question: 'Where is Gate 6?' } };
    const next = run(validateBody(schema), req);
    expect(next).toHaveBeenCalledWith();
    expect(validatedBody(schema, req as Request)).toEqual({ question: 'Where is Gate 6?' });
  });

  it('forwards a 400 AppError naming the failing field', () => {
    const next = run(validateBody(schema), { body: { question: '' } });
    const forwarded = (next.mock.calls[0] as unknown[])[0] as AppError;
    expect(forwarded).toBeInstanceOf(AppError);
    expect(forwarded.statusCode).toBe(400);
    expect(forwarded.message).toContain('question');
  });

  it('falls back to a generic message when the schema reports no issues', () => {
    // A zod refinement can fail while contributing no issue entries; the
    // middleware must still produce a client-safe 400 rather than crash.
    const issuelessSchema = {
      safeParse: () => ({ success: false as const, error: { issues: [] } }),
    } as unknown as z.ZodTypeAny;
    const next = run(validateBody(issuelessSchema), { body: {} });
    const forwarded = (next.mock.calls[0] as unknown[])[0] as AppError;
    expect(forwarded.statusCode).toBe(400);
    expect(forwarded.message).toBe('Invalid request');
  });

  it('uses the bare issue message when the issue has no path', () => {
    const rootIssueSchema = z.unknown().refine(() => false, { message: 'root rejected' });
    const next = run(validateBody(rootIssueSchema), { body: {} });
    const forwarded = (next.mock.calls[0] as unknown[])[0] as AppError;
    expect(forwarded.message).toBe('root rejected');
  });
});

describe('validateQuery + validatedQuery', () => {
  const schema = z.object({ category: z.string().optional() }).strict();

  it('lets a valid query through and reads it back fully typed', () => {
    const req: Partial<Request> = { query: { category: 'food' } };
    const next = run(validateQuery(schema), req);
    expect(next).toHaveBeenCalledWith();
    expect(validatedQuery(schema, req as Request)).toEqual({ category: 'food' });
  });

  it('forwards a 400 AppError for unknown query keys', () => {
    const next = run(validateQuery(schema), { query: { admin: 'true' } });
    const forwarded = (next.mock.calls[0] as unknown[])[0] as AppError;
    expect(forwarded).toBeInstanceOf(AppError);
    expect(forwarded.statusCode).toBe(400);
  });
});
