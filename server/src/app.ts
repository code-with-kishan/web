// Express application wiring: security middleware, API routes, and static
// serving of the built React client. Route handlers dispatch to feature
// services; errors funnel into the central error handler.
import compression from 'compression';
import cors from 'cors';
import express from 'express';

import { JSON_BODY_LIMIT } from './config/constants.js';
import { env } from './config/env.js';
import { assistantRoutes } from './features/assistant/routes.js';
import { operationsRoutes } from './features/operations/routes.js';
import { stadiumRoutes } from './features/stadium/routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiLimiter } from './middleware/rate-limit.js';
import {
  noStoreApi,
  permissionsPolicy,
  requireJsonPosts,
  securityHeaders,
  securityTxtHandler,
} from './middleware/security.js';
import { mountClient } from './middleware/static-client.js';

function corsOrigins(): string[] {
  return env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
}

/** Builds the fully-wired Express app (exported for supertest). */
export function buildApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(securityHeaders());
  app.use(permissionsPolicy);
  app.use(cors({ origin: corsOrigins() }));
  app.use(compression());
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // Live operational data must never be stored by browsers or intermediaries,
  // and API POSTs only accept JSON (cross-site form posts are refused).
  app.use('/api', noStoreApi, requireJsonPosts);

  // Coordinated-disclosure contact (RFC 9116). Registered before the SPA
  // fallback so it resolves to the file, not the client shell.
  app.get('/.well-known/security.txt', securityTxtHandler);

  // Liveness endpoint. Lives under /api because the Google Front End reserves
  // the bare /healthz path and answers it at the edge before Cloud Run. Placed
  // ahead of the rate limiter so health checks are never throttled.
  app.get('/api/health', (_req, res) => {
    // Status only — no version or build metadata on an unauthenticated route.
    res.json({ status: 'ok' });
  });

  app.use('/api', apiLimiter);
  app.use('/api/stadium', stadiumRoutes);
  app.use('/api/assistant', assistantRoutes);
  app.use('/api/operations', operationsRoutes);

  mountClient(app);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
