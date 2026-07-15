import { describe, expect, it } from 'vitest';

import { nextOccupancy, toZoneOccupancy } from '../../../src/features/operations/crowd.js';

describe('toZoneOccupancy', () => {
  it('derives density percentage from occupancy and capacity', () => {
    const zone = toZoneOccupancy({ id: 'z', name: 'Zone', capacity: 1000, occupancy: 500 });
    expect(zone.densityPct).toBe(50);
    expect(zone.status).toBe('comfortable');
  });

  it('flags a zone busy at 65% density and critical at 85%', () => {
    expect(toZoneOccupancy({ id: 'z', name: 'Z', capacity: 100, occupancy: 65 }).status).toBe(
      'busy',
    );
    expect(toZoneOccupancy({ id: 'z', name: 'Z', capacity: 100, occupancy: 85 }).status).toBe(
      'critical',
    );
  });

  it('stays comfortable just below the busy threshold', () => {
    expect(toZoneOccupancy({ id: 'z', name: 'Z', capacity: 100, occupancy: 64 }).status).toBe(
      'comfortable',
    );
  });

  it('rounds a fractional density to the nearest whole percent', () => {
    // 1/3 = 33.33% must round to 33, not carry the fraction.
    expect(toZoneOccupancy({ id: 'z', name: 'Z', capacity: 3, occupancy: 1 }).densityPct).toBe(33);
  });
});

describe('nextOccupancy', () => {
  const zone = { id: 'z', name: 'Zone', capacity: 10_000, occupancy: 5000 };

  it('never exceeds the maximum simulated density', () => {
    const crowded = { ...zone, occupancy: 9700 };
    expect(nextOccupancy(crowded, () => 1)).toBeLessThanOrEqual(9800);
  });

  it('never drops below the minimum simulated density', () => {
    const empty = { ...zone, occupancy: 1600 };
    expect(nextOccupancy(empty, () => 0)).toBeGreaterThanOrEqual(1500);
  });

  it('moves occupancy by at most the configured step', () => {
    const next = nextOccupancy(zone, () => 1);
    expect(Math.abs(next - zone.occupancy)).toBeLessThanOrEqual(600);
  });
});
