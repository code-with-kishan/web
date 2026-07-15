// Domain types for stadium operations: live crowd state, open incidents,
// sustainability metrics, and the AI briefing built from them. Types for
// persisted documents are inferred from the zod schemas in schemas.ts, so
// the runtime validation and the static types can never drift apart.
import type { z } from 'zod';

import type { incidentSchema, sustainabilityMetricsSchema, zoneRecordSchema } from './schemas.js';

/** Crowd-management status derived from a zone's density. */
export type ZoneStatus = 'comfortable' | 'busy' | 'critical';

/** A stadium zone document stored in Firestore. */
export type ZoneRecord = z.infer<typeof zoneRecordSchema>;

/** A zone enriched with derived density and status for the dashboard. */
export interface ZoneOccupancy extends ZoneRecord {
  densityPct: number;
  status: ZoneStatus;
}

/** An operational incident reported inside the venue. */
export type Incident = z.infer<typeof incidentSchema>;

/** Venue sustainability counters for the current event day. */
export type SustainabilityMetrics = z.infer<typeof sustainabilityMetricsSchema>;

/** The full operational picture at one moment in time. */
export interface OpsSnapshot {
  zones: ZoneOccupancy[];
  incidents: Incident[];
  sustainability: SustainabilityMetrics;
  generatedAt: string;
}

/** An AI-generated operations briefing. */
export interface OpsBriefing {
  briefing: string;
  generatedAt: string;
}
