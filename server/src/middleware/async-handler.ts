// Adapter for async route handlers: awaits the handler and forwards any
// rejection to the central error middleware, so no route repeats the same
// .catch(next) plumbing.
import type { Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so a rejected promise is forwarded to
 * Express's error pipeline instead of surfacing as an unhandled rejection.
 */
export function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch((error: unknown) => {
      next(error);
    });
  };
}
