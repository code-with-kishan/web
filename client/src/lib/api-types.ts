// Response shapes returned by the StadiumIQ API. Kept in sync with the
// server feature types; the client only depends on the fields it renders.

/** Languages the fan assistant supports. */
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'pt' | 'ar';

/** Answer returned by POST /api/assistant/ask. */
export interface AssistantAnswer {
  answer: string;
  language: SupportedLanguage;
  cached: boolean;
}

/** Crowd-management status for a zone. */
export type ZoneStatus = 'comfortable' | 'busy' | 'critical';

/** A stadium zone with derived density, from the operations snapshot. */
export interface ZoneOccupancy {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  densityPct: number;
  status: ZoneStatus;
}

/** An operational incident. */
export interface Incident {
  id: string;
  zoneId: string;
  category: 'crowd' | 'medical' | 'facility' | 'security';
  severity: 'low' | 'medium' | 'high';
  summary: string;
  status: 'open' | 'resolved';
  reportedAt: string;
}

/** Venue sustainability counters. */
export interface SustainabilityMetrics {
  wasteDivertedPct: number;
  energyKwh: number;
  waterRefillCount: number;
  co2SavedKg: number;
}

/** Full operations snapshot from GET /api/operations/snapshot. */
export interface OpsSnapshot {
  zones: ZoneOccupancy[];
  incidents: Incident[];
  sustainability: SustainabilityMetrics;
  generatedAt: string;
}

/** AI operations briefing from POST /api/operations/briefing. */
export interface OpsBriefing {
  briefing: string;
  generatedAt: string;
}

/** Error body shape returned by the API on failure. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}
