// Boundary validation for operations documents read from Firestore. The
// datastore is written by this service, but reads are still parsed so a
// corrupt or hand-edited document can never crash the snapshot pipeline —
// the same "parse, don't trust" rule applied to every other input boundary.
import { z } from 'zod';

/** A stadium zone document stored in Firestore. */
export const zoneRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  occupancy: z.number().int().nonnegative(),
});

/** An operational incident reported inside the venue. */
export const incidentSchema = z.object({
  id: z.string().min(1),
  zoneId: z.string().min(1),
  category: z.enum(['crowd', 'medical', 'facility', 'security']),
  severity: z.enum(['low', 'medium', 'high']),
  summary: z.string().min(1),
  status: z.enum(['open', 'resolved']),
  reportedAt: z.string().min(1),
});

/** Venue sustainability counters for the current event day. */
export const sustainabilityMetricsSchema = z.object({
  wasteDivertedPct: z.number().nonnegative(),
  energyKwh: z.number().nonnegative(),
  waterRefillCount: z.number().nonnegative(),
  co2SavedKg: z.number().nonnegative(),
});
