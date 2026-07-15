// Full user journey across the API surface, in the order a real matchday
// session exercises it: liveness → venue context → facilities → a grounded
// assistant answer → the live operations snapshot → an AI briefing on it.
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

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

describe('matchday journey: fan arrival to operations briefing', () => {
  it('serves liveness and venue context', async () => {
    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    const venue = await request(app).get('/api/stadium/venue');
    expect(venue.status).toBe(200);
    expect(venue.body.venue).toEqual({
      name: expect.any(String) as string,
      city: expect.any(String) as string,
      tournament: expect.any(String) as string,
      capacity: expect.any(Number) as number,
    });
  });

  it('filters facilities the fan asks about', async () => {
    const all = await request(app).get('/api/stadium/facilities');
    expect(all.status).toBe(200);
    expect(all.body.facilities.length).toBeGreaterThan(0);

    const food = await request(app).get('/api/stadium/facilities?category=food');
    expect(food.status).toBe(200);
    const categories = (food.body.facilities as { category: string }[]).map(
      (facility) => facility.category,
    );
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every((category) => category === 'food')).toBe(true);
  });

  it('answers a grounded accessibility question in the fan language', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'La Puerta 6 tiene acceso sin escalones.' });
    const res = await request(app)
      .post('/api/assistant/ask')
      .send({ question: '¿Dónde está la entrada accesible del estadio?', language: 'es' });
    expect(res.status).toBe(200);
    expect(res.body.language).toBe('es');
    expect(res.body.answer).toContain('Puerta 6');
  });

  it('reports the live snapshot and turns it into an AI briefing', async () => {
    const snapshot = await request(app).get('/api/operations/snapshot');
    expect(snapshot.status).toBe(200);
    expect(snapshot.body.zones.length).toBeGreaterThan(0);
    expect(snapshot.body.sustainability.wasteDivertedPct).toBeGreaterThan(0);

    generateContentMock.mockResolvedValueOnce({ text: 'TOP RISKS\n- Monitor South Concourse' });
    const briefing = await request(app).post('/api/operations/briefing');
    expect(briefing.status).toBe(200);
    expect(briefing.body.briefing).toContain('TOP RISKS');

    // The briefing prompt must be grounded on the snapshot state, not generic.
    const promptArg = JSON.stringify(generateContentMock.mock.calls.at(-1));
    expect(promptArg).toContain('South Concourse');
    expect(promptArg).toContain('% full');
  });

  it('rejects an off-contract request at every boundary it crosses', async () => {
    const badQuery = await request(app).get('/api/stadium/facilities?category=weapons');
    expect(badQuery.status).toBe(400);

    const badBody = await request(app).post('/api/assistant/ask').send({ question: '' });
    expect(badBody.status).toBe(400);

    const unknownRoute = await request(app).get('/api/does-not-exist');
    expect(unknownRoute.status).toBe(404);
  });
});
