import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeFirestore } from './helpers/fake-firestore.js';

const generateContentMock = vi.fn();
const fakeDb = new FakeFirestore();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

vi.mock('../src/lib/firestore.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/firestore.js')>();
  return { ...original, getFirestore: () => fakeDb.asFirestore() };
});

let app: Express;

beforeAll(async () => {
  const { buildApp } = await import('../src/app.js');
  const { ensureSeeded } = await import('../src/features/operations/service.js');
  app = buildApp();
  await ensureSeeded();
});

beforeEach(() => {
  generateContentMock.mockReset();
});

describe('GET /api/health', () => {
  it('reports ok without volunteering build metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /.well-known/security.txt', () => {
  it('serves the RFC 9116 disclosure contact as plain text', async () => {
    const res = await request(app).get('/.well-known/security.txt');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/plain');
    expect(res.text).toContain('Contact:');
    expect(res.text).toContain('Expires:');
    // Must not fall through to the SPA shell.
    expect(res.text).not.toContain('<!doctype html>');
  });
});

describe('hardened HTTP headers', () => {
  it('sets Helmet security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('ships a CSP with no unsafe grants of any kind', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).not.toContain('unsafe-');
    expect(res.headers['content-security-policy']).toContain("object-src 'none'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('denies unused browser features via Permissions-Policy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['permissions-policy']).toContain('camera=()');
    expect(res.headers['permissions-policy']).toContain('geolocation=()');
  });

  it('forbids caching of API responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('refuses cross-site form-encoded POSTs to the API (CSRF hardening)', async () => {
    const res = await request(app)
      .post('/api/operations/briefing')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('a=1');
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});

describe('GET /api/stadium/facilities', () => {
  it('returns all facilities without a filter', async () => {
    const res = await request(app).get('/api/stadium/facilities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.facilities)).toBe(true);
    expect(res.body.facilities.length).toBeGreaterThan(0);
  });

  it('filters by a valid category', async () => {
    const res = await request(app).get('/api/stadium/facilities?category=accessibility');
    expect(res.status).toBe(200);
    expect(
      res.body.facilities.every((f: { category: string }) => f.category === 'accessibility'),
    ).toBe(true);
  });

  it('rejects an unknown category with 400', async () => {
    const res = await request(app).get('/api/stadium/facilities?category=bogus');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('POST /api/assistant/ask', () => {
  it('returns a grounded answer for a valid question', async () => {
    generateContentMock.mockResolvedValue({ text: 'Gate 6 offers step-free access.' });
    const res = await request(app)
      .post('/api/assistant/ask')
      .send({ question: 'Where is the accessible entrance?', language: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.answer).toContain('Gate 6');
    expect(res.body.language).toBe('en');
  });

  it('rejects an empty question with 400', async () => {
    const res = await request(app).post('/api/assistant/ask').send({ question: '' });
    expect(res.status).toBe(400);
  });

  it('rejects unknown body keys with 400', async () => {
    const res = await request(app)
      .post('/api/assistant/ask')
      .send({ question: 'hi', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('maps a Gemini outage to a sanitized 502', async () => {
    generateContentMock.mockRejectedValue(new Error('secret internal quota trace'));
    const res = await request(app)
      .post('/api/assistant/ask')
      .send({ question: 'A brand new question to dodge the cache', language: 'fr' });
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('quota');
  });
});

describe('operations endpoints', () => {
  it('GET /api/operations/snapshot returns zones, incidents and sustainability', async () => {
    const res = await request(app).get('/api/operations/snapshot');
    expect(res.status).toBe(200);
    expect(res.body.zones.length).toBeGreaterThan(0);
    expect(res.body.sustainability.wasteDivertedPct).toBeGreaterThan(0);
  });

  it('POST /api/operations/briefing generates an AI briefing', async () => {
    generateContentMock.mockResolvedValue({ text: 'TOP RISKS\n- South Concourse busy' });
    const res = await request(app).post('/api/operations/briefing');
    expect(res.status).toBe(200);
    expect(res.body.briefing).toContain('TOP RISKS');
  });
});

describe('unknown routes', () => {
  it('returns a 404 with a stable error shape', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
