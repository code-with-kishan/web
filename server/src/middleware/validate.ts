// Request validation at the trust boundary: every body/query is gated by a
// strict zod schema before feature logic runs, then read back through typed
// accessors — handlers never cast and never touch unvalidated input.
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';

import { AppError } from '../lib/app-error.js';

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return 'Invalid request';
  }
  const path = issue.path.join('.');
  return path === '' ? issue.message : `${path}: ${issue.message}`;
}

/** Rejects the request with a field-naming 400 unless the body satisfies the schema. */
export function validateBody(schema: z.ZodTypeAny): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(AppError.badRequest(firstIssue(result.error)));
      return;
    }
    next();
  };
}

/** Rejects the request with a field-naming 400 unless the query satisfies the schema. */
export function validateQuery(schema: z.ZodTypeAny): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(AppError.badRequest(firstIssue(result.error)));
      return;
    }
    next();
  };
}

/**
 * Typed read of a request body already gated by {@link validateBody}.
 * Parsing again (rather than caching and casting) keeps the type flowing
 * straight from the schema — no assertions anywhere in the request path.
 */
export function validatedBody<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, req: Request): T {
  return schema.parse(req.body);
}

/** Typed read of query params already gated by {@link validateQuery}. */
export function validatedQuery<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, req: Request): T {
  return schema.parse(req.query);
}
