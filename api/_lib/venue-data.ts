// Shared venue data for Vercel serverless functions.
// Self-contained — no imports from the server workspace.

export const GATES = [
  { id: 'gate-1', name: 'Gate 1 — North', serves: 'North Stand, sections 101–128', accessible: true },
  { id: 'gate-2', name: 'Gate 2 — Northeast', serves: 'East Stand upper, sections 201–224', accessible: false },
  { id: 'gate-3', name: 'Gate 3 — East', serves: 'East Stand lower, sections 129–148', accessible: true },
  { id: 'gate-4', name: 'Gate 4 — South', serves: 'South Stand, sections 149–176', accessible: true },
  { id: 'gate-5', name: 'Gate 5 — Southwest', serves: 'West Stand upper, sections 225–248', accessible: false },
  { id: 'gate-6', name: 'Gate 6 — West (VIP & accessibility priority)', serves: 'West Stand lower, hospitality, accessible seating', accessible: true },
];

export const FACILITIES = [
  { id: 'food-north', name: 'North Concourse Food Court', category: 'food', location: 'Level 1, behind sections 110–118', accessible: true, details: 'Tacos, tortas, vegetarian and halal options; card and cash.' },
  { id: 'food-south', name: 'South Concourse Food Court', category: 'food', location: 'Level 1, behind sections 156–164', accessible: true, details: 'Local street-food stalls and family combos.' },
  { id: 'water-refill', name: 'Free Water Refill Stations', category: 'sustainability', location: 'Every concourse, next to each food court', accessible: true, details: 'Bring a reusable bottle — refills are free and cut single-use plastic.' },
  { id: 'recycling-points', name: 'Recycling & Compost Points', category: 'sustainability', location: 'All concourse exits', accessible: true, details: 'Three-stream bins: recycling, compost, landfill.' },
  { id: 'first-aid-east', name: 'First Aid — East', category: 'medical', location: 'Level 1, next to Gate 3', accessible: true, details: 'Staffed by paramedics for the full event window.' },
  { id: 'first-aid-west', name: 'First Aid — West', category: 'medical', location: 'Level 1, next to Gate 6', accessible: true, details: 'Includes a quiet recovery room.' },
  { id: 'accessible-seating', name: 'Accessible Seating Platforms', category: 'accessibility', location: 'West Stand lower, via Gate 6', accessible: true, details: 'Wheelchair platforms with companion seats; book through Guest Services.' },
  { id: 'elevators-west', name: 'Elevators & Step-Free Route', category: 'accessibility', location: 'Gates 1, 3, 4 and 6', accessible: true, details: 'Step-free route runs the full concourse loop; elevators at each corner.' },
  { id: 'sensory-room', name: 'Sensory Room', category: 'accessibility', location: 'Level 2, West Stand near section 230', accessible: true, details: 'Low-stimulation space with trained staff; ear defenders available.' },
  { id: 'prayer-room', name: 'Multi-Faith Prayer Room', category: 'prayer', location: 'Level 2, North Stand near section 205', accessible: true, details: 'Open from gates-open to one hour after the final whistle; ablution facilities adjacent.' },
  { id: 'family-room', name: 'Family & Baby Care Room', category: 'family', location: 'Level 1, South Stand near section 160', accessible: true, details: 'Nursing space, changing tables, bottle warming.' },
  { id: 'guest-services', name: 'Guest Services Desks', category: 'services', location: 'Inside Gates 1, 4 and 6', accessible: true, details: 'Lost & found, accessibility bookings, volunteer support, lost-child point.' },
];

export const TRANSIT = [
  { id: 'metro', mode: 'metro', name: 'Tren Ligero — Estadio Azteca station', guidance: 'Light rail from Tasqueña metro; trains every 5 minutes until 2 hours after the match. Step-free access at the stadium station.', accessible: true },
  { id: 'shuttle', mode: 'shuttle', name: 'FIFA Fan Shuttle', guidance: 'Free shuttles loop between the stadium, Zócalo fan festival and major hotel zones; board at the South Plaza.', accessible: true },
  { id: 'bus', mode: 'bus', name: 'City bus corridors', guidance: 'Routes on Calzada de Tlalpan stop 400 m from the North gates; expect diversions for 90 minutes post-match.', accessible: false },
  { id: 'parking', mode: 'parking', name: 'Official parking (pre-booked only)', guidance: 'Lots E and S require a pre-booked permit; accessible bays are beside Gate 6 with a drop-off lane.', accessible: true },
  { id: 'rideshare', mode: 'rideshare', name: 'Rideshare pick-up zone', guidance: 'Designated pick-up on Avenida del Imán, a signposted 10-minute walk from the West gates.', accessible: true },
];

export const VENUE = {
  name: 'Estadio Azteca',
  city: 'Mexico City',
  tournament: 'FIFA World Cup 2026',
  capacity: 83264,
  gates: GATES,
  facilities: FACILITIES,
  transit: TRANSIT,
};

/** Builds the grounding context string for the assistant prompt. */
export function buildGroundingContext(): string {
  const gateLines = GATES.map(
    (g) => `- ${g.name}: serves ${g.serves}${g.accessible ? ' (step-free)' : ''}`,
  ).join('\n');
  const facilityLines = FACILITIES.map(
    (f) => `- ${f.name} [${f.category}] — ${f.location}. ${f.details}`,
  ).join('\n');
  const transitLines = TRANSIT.map(
    (t) => `- ${t.name} (${t.mode}): ${t.guidance}`,
  ).join('\n');
  return [
    `Venue: ${VENUE.name}, ${VENUE.city} — ${VENUE.tournament}. Capacity ${String(VENUE.capacity)}.`,
    'GATES:',
    gateLines,
    'FACILITIES:',
    facilityLines,
    'TRANSPORT:',
    transitLines,
  ].join('\n');
}

/** Baseline zone occupancy data for the snapshot. */
export const BASELINE_ZONES = [
  { id: 'north-stand', name: 'North Stand', capacity: 18000, occupancy: 9900, densityPct: 55, status: 'comfortable' },
  { id: 'south-stand', name: 'South Stand', capacity: 18000, occupancy: 12600, densityPct: 70, status: 'busy' },
  { id: 'east-stand', name: 'East Stand', capacity: 16000, occupancy: 8800, densityPct: 55, status: 'comfortable' },
  { id: 'west-stand', name: 'West Stand', capacity: 16000, occupancy: 11200, densityPct: 70, status: 'busy' },
  { id: 'north-concourse', name: 'North Concourse', capacity: 6000, occupancy: 4400, densityPct: 73, status: 'busy' },
  { id: 'south-concourse', name: 'South Concourse', capacity: 6000, occupancy: 5300, densityPct: 88, status: 'critical' },
  { id: 'fan-plaza', name: 'Fan Festival Plaza', capacity: 12000, occupancy: 7300, densityPct: 60, status: 'comfortable' },
  { id: 'transit-hub', name: 'Transit Hub (Tren Ligero)', capacity: 5000, occupancy: 2100, densityPct: 42, status: 'comfortable' },
];

export const BASELINE_INCIDENTS = [
  { id: 'inc-001', zoneId: 'south-concourse', category: 'crowd', severity: 'high', summary: 'Congestion building at South Concourse food court queue lanes.', status: 'open', reportedAt: '2026-07-06T17:05:00.000Z' },
  { id: 'inc-002', zoneId: 'transit-hub', category: 'facility', severity: 'medium', summary: 'One ticket barrier out of service at the Tren Ligero entrance.', status: 'open', reportedAt: '2026-07-06T16:40:00.000Z' },
  { id: 'inc-003', zoneId: 'east-stand', category: 'medical', severity: 'low', summary: 'Minor first-aid case treated at First Aid East; no follow-up needed.', status: 'resolved', reportedAt: '2026-07-06T15:55:00.000Z' },
];

export const BASELINE_SUSTAINABILITY = {
  wasteDivertedPct: 68,
  energyKwh: 41200,
  waterRefillCount: 5230,
  co2SavedKg: 1840,
};
