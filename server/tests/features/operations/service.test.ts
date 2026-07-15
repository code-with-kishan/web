import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { FakeFirestore } from '../../helpers/fake-firestore.js';

const fakeDb = new FakeFirestore();

vi.mock('../../../src/lib/firestore.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../src/lib/firestore.js')>();
  return { ...original, getFirestore: () => fakeDb.asFirestore() };
});

const { advanceTelemetry, ensureSeeded, getSnapshot } =
  await import('../../../src/features/operations/service.js');

describe('ensureSeeded / getSnapshot / advanceTelemetry', () => {
  beforeEach(() => {
    fakeDb.reset();
  });

  it('seeds baseline data only when the zones collection is empty', async () => {
    await ensureSeeded();
    expect(fakeDb.read('zones', 'north-stand')).toBeDefined();
    expect(fakeDb.read('incidents', 'inc-001')).toBeDefined();
    expect(fakeDb.read('sustainability', 'current')).toBeDefined();
  });

  it('does not overwrite existing data on a second start', async () => {
    await ensureSeeded();
    await fakeDb.collection('zones').doc('north-stand').set({
      id: 'north-stand',
      name: 'North Stand',
      capacity: 18_000,
      occupancy: 17_000,
    });
    await ensureSeeded();
    expect(fakeDb.read('zones', 'north-stand')?.['occupancy']).toBe(17_000);
  });

  it('returns zones sorted by density with incidents and sustainability', async () => {
    await ensureSeeded();
    const snapshot = await getSnapshot();
    expect(snapshot.zones.length).toBeGreaterThan(0);
    const densities = snapshot.zones.map((zone) => zone.densityPct);
    expect(densities).toEqual([...densities].sort((a, b) => b - a));
    expect(snapshot.sustainability.wasteDivertedPct).toBeGreaterThan(0);
    expect(snapshot.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('advanceTelemetry keeps every zone inside simulated density bounds', async () => {
    await ensureSeeded();
    await advanceTelemetry(() => 1);
    const snapshot = await getSnapshot();
    for (const zone of snapshot.zones) {
      expect(zone.densityPct).toBeGreaterThanOrEqual(15);
      expect(zone.densityPct).toBeLessThanOrEqual(98);
    }
  });

  it('advanceTelemetry is a no-op before the database has been seeded', async () => {
    // Must not write partial sustainability state when there are no zones.
    await advanceTelemetry(() => 1);
    expect(fakeDb.read('sustainability', 'current')).toBeUndefined();
  });

  it('skips malformed documents instead of crashing the snapshot pipeline', async () => {
    await ensureSeeded();
    await fakeDb.collection('zones').doc('corrupt').set({ id: 'corrupt', capacity: 'NaN' });
    await fakeDb.collection('incidents').doc('corrupt').set({ id: 'corrupt' });

    const snapshot = await getSnapshot();

    expect(snapshot.zones.some((zone) => zone.id === 'corrupt')).toBe(false);
    expect(snapshot.incidents.some((incident) => incident.id === 'corrupt')).toBe(false);
    expect(snapshot.zones.length).toBeGreaterThan(0);
  });

  it('advanceTelemetry leaves malformed zone documents untouched', async () => {
    await ensureSeeded();
    await fakeDb.collection('zones').doc('corrupt').set({ id: 'corrupt', capacity: 'NaN' });

    await advanceTelemetry(() => 1);

    expect(fakeDb.read('zones', 'corrupt')).toEqual({ id: 'corrupt', capacity: 'NaN' });
  });
});
