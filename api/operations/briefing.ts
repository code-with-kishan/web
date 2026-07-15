// Vercel serverless function: POST /api/operations/briefing
// Generates an operations briefing via Gemini when GEMINI_API_KEY is set;
// falls back to an algorithmically-compiled briefing from the live snapshot.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from '../_lib/gemini';
import { BASELINE_ZONES, BASELINE_INCIDENTS, BASELINE_SUSTAINABILITY } from '../_lib/venue-data';

type ZoneStatus = 'comfortable' | 'busy' | 'critical';

interface Zone {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  densityPct: number;
  status: ZoneStatus;
}

interface Incident {
  id: string;
  zoneId: string;
  category: string;
  severity: string;
  summary: string;
  status: string;
  reportedAt: string;
}

interface Sustainability {
  wasteDivertedPct: number;
  energyKwh: number;
  waterRefillCount: number;
  co2SavedKg: number;
}

function nudge(value: number, capacity: number): number {
  const change = Math.floor((Math.random() - 0.5) * 0.06 * capacity);
  const next = value + change;
  return Math.max(Math.floor(capacity * 0.1), Math.min(Math.floor(capacity * 0.97), next));
}

function toStatus(densityPct: number): ZoneStatus {
  if (densityPct >= 85) return 'critical';
  if (densityPct >= 65) return 'busy';
  return 'comfortable';
}

function buildLiveZones(): Zone[] {
  return BASELINE_ZONES.map((z) => {
    const occupancy = nudge(z.occupancy, z.capacity);
    const densityPct = Math.round((occupancy / z.capacity) * 100);
    return { ...z, occupancy, densityPct, status: toStatus(densityPct) };
  }).sort((a, b) => b.densityPct - a.densityPct);
}

function buildLiveSustainability(): Sustainability {
  const s = BASELINE_SUSTAINABILITY;
  return {
    wasteDivertedPct: Math.min(95, Math.max(50, s.wasteDivertedPct + Math.round((Math.random() - 0.5) * 4))),
    energyKwh: s.energyKwh + Math.floor(Math.random() * 300),
    waterRefillCount: s.waterRefillCount + Math.floor(Math.random() * 120),
    co2SavedKg: s.co2SavedKg + Math.floor(Math.random() * 20),
  };
}

function describeSnapshot(zones: Zone[], incidents: Incident[], sustainability: Sustainability): string {
  const zoneLines = zones.map(
    (z) => `- ${z.name}: ${String(z.densityPct)}% full (${String(z.occupancy)}/${String(z.capacity)}) — ${z.status}`,
  );
  const incidentLines = incidents.map(
    (i) => `- [${i.status}] ${i.severity} ${i.category} in ${i.zoneId}: ${i.summary}`,
  );
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

function buildBriefingPrompt(zones: Zone[], incidents: Incident[], sustainability: Sustainability): string {
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
    describeSnapshot(zones, incidents, sustainability),
    '--- END LIVE VENUE DATA ---',
  ].join('\n');
}

function buildLocalBriefing(zones: Zone[], incidents: Incident[], sustainability: Sustainability): string {
  const openIncidents = incidents.filter((i) => i.status === 'open');
  const criticalZones = [...zones].filter((z) => z.densityPct >= 85).sort((a, b) => b.densityPct - a.densityPct);
  const busyZones = [...zones].filter((z) => z.densityPct >= 65 && z.densityPct < 85).sort((a, b) => b.densityPct - a.densityPct);

  const topRisks: string[] = [];
  const crowdActions: string[] = [];

  if (criticalZones.length > 0) {
    const z = criticalZones[0];
    topRisks.push(`CRITICAL: ${z.name} at ${String(z.densityPct)}% capacity — immediate crowd management required.`);
    crowdActions.push(`Deploy additional marshals to ${z.name}. Open secondary exits and redirect arrivals via Gate 1 North or Gate 6 West.`);
  } else {
    if (busyZones.length > 0) {
      const z = busyZones[0];
      topRisks.push(`Elevated occupancy: ${z.name} at ${String(z.densityPct)}%.`);
      crowdActions.push(`Monitor entry rate into ${z.name}. Pre-position crowd stewards at choke points.`);
    } else {
      topRisks.push('All stands within comfortable occupancy limits.');
      crowdActions.push('Maintain standard gate staffing. Continue monitoring telemetry every 5 minutes.');
    }
  }

  const highInc = openIncidents.find((i) => i.severity === 'high');
  if (highInc) {
    topRisks.push(`High-severity open incident: ${highInc.summary}`);
  }
  if (openIncidents.length === 0) {
    topRisks.push('No active safety incidents.');
  }

  const incidentFollowUps = openIncidents.map((i) => {
    if (i.category === 'crowd') return `${i.id}: Dispatch crowd control unit to ${i.zoneId} to clear congestion.`;
    if (i.category === 'facility') return `${i.id}: Engineering team to ${i.zoneId} for repairs. Activate backup access route.`;
    return `${i.id}: Medical response logged at ${i.zoneId}. Monitor for escalation.`;
  });
  if (incidentFollowUps.length === 0) incidentFollowUps.push('No open incidents requiring follow-up.');

  const sustainLines = [
    `Waste diversion rate at ${String(sustainability.wasteDivertedPct)}% — ${sustainability.wasteDivertedPct >= 70 ? 'target met' : 'below 70% target'}.`,
    `${String(sustainability.waterRefillCount)} bottle refills have saved ~${String(sustainability.co2SavedKg)} kg CO2. Expand refill point signage at main concourses.`,
  ];

  return [
    'TOP RISKS',
    ...topRisks.map((r) => `- ${r}`),
    '',
    'CROWD ACTIONS',
    ...crowdActions.map((a) => `- ${a}`),
    '',
    'INCIDENT FOLLOW-UPS',
    ...incidentFollowUps.map((f) => `- ${f}`),
    '',
    'SUSTAINABILITY',
    ...sustainLines.map((s) => `- ${s}`),
    '',
    'Report compiled by operations director Kishan Nishad.',
  ].join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
    return;
  }

  const zones = buildLiveZones();
  const incidents = BASELINE_INCIDENTS as Incident[];
  const sustainability = buildLiveSustainability();

  // Try Gemini first
  const geminiAnswer = await generateText(buildBriefingPrompt(zones, incidents, sustainability));
  const briefing = geminiAnswer ?? buildLocalBriefing(zones, incidents, sustainability);

  res.setHeader('Cache-Control', 'no-store');
  res.json({ briefing, generatedAt: new Date().toISOString() });
}
