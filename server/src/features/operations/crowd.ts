// Pure crowd-density logic: deriving dashboard status from occupancy and
// advancing the simulated telemetry feed. No I/O, so these are trivially
// unit-testable and reused by the Firestore repository in service.ts.
import {
  DENSITY_BUSY_PCT,
  DENSITY_CRITICAL_PCT,
  TELEMETRY_MAX_DENSITY_PCT,
  TELEMETRY_MAX_STEP_PCT,
  TELEMETRY_MIN_DENSITY_PCT,
} from '../../config/constants.js';
import type { ZoneOccupancy, ZoneRecord } from './types.js';

/** Derives dashboard density percentage and crowd status from a zone record. */
export function toZoneOccupancy(zone: ZoneRecord): ZoneOccupancy {
  const densityPct = Math.round((zone.occupancy / zone.capacity) * 100);
  const status =
    densityPct >= DENSITY_CRITICAL_PCT
      ? 'critical'
      : densityPct >= DENSITY_BUSY_PCT
        ? 'busy'
        : 'comfortable';
  return { ...zone, densityPct, status };
}

/**
 * Applies one bounded random-walk step to a zone's occupancy, keeping the
 * simulated crowd inside realistic density bounds.
 *
 * @param zone - The zone whose occupancy is being advanced.
 * @param random - Injectable source of randomness for deterministic tests.
 */
export function nextOccupancy(zone: ZoneRecord, random: () => number = Math.random): number {
  const stepPct = (random() * 2 - 1) * TELEMETRY_MAX_STEP_PCT;
  const proposed = zone.occupancy + Math.round((stepPct / 100) * zone.capacity);
  const min = Math.round((TELEMETRY_MIN_DENSITY_PCT / 100) * zone.capacity);
  const max = Math.round((TELEMETRY_MAX_DENSITY_PCT / 100) * zone.capacity);
  return Math.min(max, Math.max(min, proposed));
}
