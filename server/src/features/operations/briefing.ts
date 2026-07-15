// AI operations briefing: turns the live snapshot into prioritized,
// actionable recommendations for the venue operations team.
import { BRIEFING_CACHE_TTL_MS, CACHE_MAX_ENTRIES } from '../../config/constants.js';
import { generateText } from '../../lib/gemini.js';
import { TtlCache } from '../../lib/ttl-cache.js';
import { getSnapshot } from './service.js';
import type { OpsBriefing, OpsSnapshot } from './types.js';

const briefingCache = new TtlCache<OpsBriefing>(BRIEFING_CACHE_TTL_MS, CACHE_MAX_ENTRIES);
const BRIEFING_CACHE_KEY = 'latest';

function describeSnapshot(snapshot: OpsSnapshot): string {
  const zoneLines = snapshot.zones.map(
    (zone) =>
      `- ${zone.name}: ${String(zone.densityPct)}% full (${String(zone.occupancy)}/${String(zone.capacity)}) — ${zone.status}`,
  );
  const incidentLines = snapshot.incidents.map(
    (incident) =>
      `- [${incident.status}] ${incident.severity} ${incident.category} in ${incident.zoneId}: ${incident.summary}`,
  );
  const sustainability = snapshot.sustainability;
  return [
    'ZONE DENSITY:',
    ...zoneLines,
    'INCIDENTS:',
    ...incidentLines,
    'SUSTAINABILITY:',
    `- Waste diverted from landfill: ${String(sustainability.wasteDivertedPct)}%`,
    `- Energy used today: ${String(sustainability.energyKwh)} kWh`,
    `- Water bottle refills: ${String(sustainability.waterRefillCount)}`,
    `- CO2 saved vs. baseline: ${String(sustainability.co2SavedKg)} kg`,
  ].join('\n');
}

/**
 * Builds the briefing prompt from a snapshot. Exported separately so the
 * prompt content is unit-testable without calling Gemini.
 */
export function buildBriefingPrompt(snapshot: OpsSnapshot): string {
  return [
    'You are the operations intelligence assistant for Estadio Azteca during the FIFA World Cup 2026.',
    'From the live venue data below, write a briefing for the stadium operations director with',
    'exactly these four plain-text sections, each a short dash list (no markdown headings or bold):',
    'TOP RISKS — the 2-3 most pressing crowd or incident risks right now.',
    'CROWD ACTIONS — concrete redirections, gate changes or staffing moves, named by zone and gate.',
    'INCIDENT FOLLOW-UPS — next step for each open incident.',
    'SUSTAINABILITY — one observation and one action based on the metrics.',
    'Be specific and decisive; under 220 words total.',
    '',
    '--- LIVE VENUE DATA ---',
    describeSnapshot(snapshot),
    '--- END LIVE VENUE DATA ---',
  ].join('\n');
}

/**
 * Generates (or serves the cached) operations briefing from the current
 * Firestore snapshot. A short cache keeps repeated clicks from re-running
 * inference on effectively unchanged data.
 */
export async function generateBriefing(): Promise<OpsBriefing> {
  const cached = briefingCache.get(BRIEFING_CACHE_KEY);
  if (cached !== undefined) {
    return cached;
  }
  const snapshot = await getSnapshot();
  const briefing = await generateText(buildBriefingPrompt(snapshot));
  const result: OpsBriefing = { briefing, generatedAt: new Date().toISOString() };
  briefingCache.set(BRIEFING_CACHE_KEY, result);
  return result;
}

/** Clears the briefing cache (used by tests). */
export function clearBriefingCache(): void {
  briefingCache.clear();
}
