import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import express from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { mountClient } from '../../src/middleware/static-client.js';

// A minimal fixture "client build": an HTML shell plus a content-hashed asset,
// so these tests do not depend on client/dist existing in CI.
let app: express.Express;

beforeAll(() => {
  const fixtureDist = mkdtempSync(path.join(tmpdir(), 'stadiumiq-dist-'));
  writeFileSync(path.join(fixtureDist, 'index.html'), '<!doctype html><title>StadiumIQ</title>');
  writeFileSync(path.join(fixtureDist, 'app-abc123.js'), 'console.log("bundle");');

  app = express();
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  mountClient(app, fixtureDist);
});

describe('mountClient', () => {
  it('serves hashed assets with a long-lived immutable cache header', async () => {
    const res = await request(app).get('/app-abc123.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('serves the SPA shell with no-cache for client routes', async () => {
    const res = await request(app).get('/operations');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(res.text).toContain('<!doctype html>');
  });

  it('never long-caches the HTML shell when requested as a file', async () => {
    const res = await request(app).get('/index.html');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('does not intercept API routes', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
