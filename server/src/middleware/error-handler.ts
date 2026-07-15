// Central error handling: the only place that turns errors into HTTP
// responses. Handlers throw; this middleware logs and sanitizes.
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';

const INTERNAL_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.';

/**
 * 404 handler for unmatched routes, forwarded to the error handler. The body
 * is a static message — the offending method and path go to the structured
 * log, never reflected back into the response.
 */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound('No matching route.'));
}

/** Express error middleware: structured log + sanitized JSON body. */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(500, 'INTERNAL', error instanceof Error ? error.message : 'Unknown error');

  logger.error(
    {
      code: appError.code,
      statusCode: appError.statusCode,
      method: req.method,
      path: req.path,
      message: appError.message,
    },
    'Request failed',
  );

  // AppError messages are authored and safe to expose; anything unexpected
  // (code INTERNAL) is replaced so internals never leak to clients.
  const clientMessage = appError.code === 'INTERNAL' ? INTERNAL_ERROR_MESSAGE : appError.message;
  res.status(appError.statusCode).json({ error: { code: appError.code, message: clientMessage } });
}
