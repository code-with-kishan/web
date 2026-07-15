import { Firestore } from '@google-cloud/firestore';
import { describe, expect, it } from 'vitest';

// Deliberately unmocked: this suite covers the real module. Constructing a
// Firestore client is offline-safe — it only authenticates on first RPC.
import { COLLECTIONS, getFirestore, SUSTAINABILITY_DOC_ID } from '../../src/lib/firestore.js';

describe('getFirestore', () => {
  it('creates a real Firestore client on first use', () => {
    expect(getFirestore()).toBeInstanceOf(Firestore);
  });

  it('memoizes the client so every request shares one connection pool', () => {
    expect(getFirestore()).toBe(getFirestore());
  });
});

describe('operations collection contract', () => {
  it('exposes the collection names and singleton document id the feature relies on', () => {
    expect(COLLECTIONS).toEqual({
      zones: 'zones',
      incidents: 'incidents',
      sustainability: 'sustainability',
    });
    expect(SUSTAINABILITY_DOC_ID).toBe('current');
  });
});
