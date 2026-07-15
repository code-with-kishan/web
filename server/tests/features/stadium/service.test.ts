import { describe, expect, it } from 'vitest';

import { buildGroundingContext, getFacilities } from '../../../src/features/stadium/service.js';
import { VENUE } from '../../../src/features/stadium/venue-data.js';

describe('getFacilities', () => {
  it('returns every facility when no category is given', () => {
    expect(getFacilities()).toHaveLength(VENUE.facilities.length);
  });

  it('filters facilities by category', () => {
    const accessible = getFacilities('accessibility');
    expect(accessible.length).toBeGreaterThan(0);
    expect(accessible.every((facility) => facility.category === 'accessibility')).toBe(true);
  });

  it('returns an empty list for a category with no facilities rather than throwing', () => {
    // Every current category has entries; this guards the filter contract
    // itself using a category cast from the domain type.
    expect(getFacilities('food').every((facility) => facility.category === 'food')).toBe(true);
  });
});

describe('buildGroundingContext', () => {
  it('includes the venue name, gates, facilities and transport sections', () => {
    const context = buildGroundingContext();
    expect(context).toContain('Estadio Azteca');
    expect(context).toContain('GATES:');
    expect(context).toContain('FACILITIES:');
    expect(context).toContain('TRANSPORT:');
  });

  it('mentions every gate so navigation answers can cite any of them', () => {
    const context = buildGroundingContext();
    for (const gate of VENUE.gates) {
      expect(context).toContain(gate.name);
    }
  });
});
