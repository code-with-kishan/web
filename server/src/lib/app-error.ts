// Single error type used across the API. Handlers throw AppError; the
// central error middleware is the only place that formats error responses.

/** Operational error carrying an HTTP status and a stable machine-readable code. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

  /** 400 — the client sent a request that fails validation. */
  static badRequest(message: string): AppError {
    return new AppError(400, 'BAD_REQUEST', message);
  }

  /** 404 — the requested resource or route does not exist. */
  static notFound(message: string): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  /** 502 — a downstream dependency (Gemini, Firestore) failed. */
  static upstreamFailure(dependency: string, message: string): AppError {
    return new AppError(502, `${dependency.toUpperCase()}_UNAVAILABLE`, message);
  }
}
