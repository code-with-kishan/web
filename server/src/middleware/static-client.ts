// Static serving of the built React client plus the SPA history fallback.
// Isolated from app.ts so the composition root stays small.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express, { type Express } from 'express';

// From the compiled location (server/dist/middleware/static-client.js) up to
// the repo root, then into the built client.
const CLIENT_DIST_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../client/dist',
);

/** One year in ms — safe for content-hashed Vite assets. */
const IMMUTABLE_ASSET_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Mounts hashed-asset static serving and the SPA history fallback. Call last,
 * after all API and well-known routes, so it only catches unmatched GETs.
 *
 * @param clientDistPath - Where the built client lives; overridable in tests
 *   to point at a fixture build.
 */
export function mountClient(app: Express, clientDistPath: string = CLIENT_DIST_PATH): void {
  app.use(
    express.static(clientDistPath, {
      index: false,
      maxAge: IMMUTABLE_ASSET_MAX_AGE_MS,
      immutable: true,
      setHeaders: (res, filePath) => {
        // The HTML shell must never be long-cached.
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );
  // SPA fallback: every non-API GET renders the client shell.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}
