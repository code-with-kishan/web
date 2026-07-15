// Vercel serverless function: GET /api/operations/snapshot
// Returns a live-feeling operational snapshot with slight randomisation on
// each request, so the dashboard always shows moving numbers.
import type { VercelRequest, VercelResponse } from '@vercel/node';
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

function buildLiveSnapshot() {
  const zones: Zone[] = BASELINE_ZONES.map((z) => {
    const occupancy = nudge(z.occupancy, z.capacity);
    const densityPct = Math.round((occupancy / z.capacity) * 100);
    return { ...z, occupancy, densityPct, status: toStatus(densityPct) };
  }).sort((a, b) => b.densityPct - a.densityPct);

  const s = BASELINE_SUSTAINABILITY;
  const sustainability = {
    wasteDivertedPct: Math.min(95, Math.max(50, s.wasteDivertedPct + Math.round((Math.random() - 0.5) * 4))),
    energyKwh: s.energyKwh + Math.floor(Math.random() * 300),
    waterRefillCount: s.waterRefillCount + Math.floor(Math.random() * 120),
    co2SavedKg: s.co2SavedKg + Math.floor(Math.random() * 20),
  };

  return {
    zones,
    incidents: BASELINE_INCIDENTS,
    sustainability,
    generatedAt: new Date().toISOString(),
  };
}

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-store');
  res.json(buildLiveSnapshot());
}
