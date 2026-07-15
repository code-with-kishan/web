// Stadium feature logic: facility lookup for the client's quick actions and
// the grounding context injected into every Gemini prompt.
import type { Facility, FacilityCategory } from './types.js';
import { VENUE } from './venue-data.js';

/**
 * Returns venue facilities, optionally filtered by category.
 *
 * @param category - When provided, only facilities of this category.
 */
export function getFacilities(category?: FacilityCategory): Facility[] {
  if (category === undefined) {
    return VENUE.facilities;
  }
  return VENUE.facilities.filter((facility) => facility.category === category);
}

function describeGates(): string {
  return VENUE.gates
    .map((gate) => `- ${gate.name}: serves ${gate.serves}${gate.accessible ? ' (step-free)' : ''}`)
    .join('\n');
}

function describeFacilities(): string {
  return VENUE.facilities
    .map(
      (facility) =>
        `- ${facility.name} [${facility.category}] — ${facility.location}. ${facility.details}`,
    )
    .join('\n');
}

function describeTransit(): string {
  return VENUE.transit
    .map((route) => `- ${route.name} (${route.mode}): ${route.guidance}`)
    .join('\n');
}

/**
 * Builds the compact venue description that grounds assistant answers,
 * so the model answers from real venue data instead of inventing it.
 */
export function buildGroundingContext(): string {
  return [
    `Venue: ${VENUE.name}, ${VENUE.city} — ${VENUE.tournament}. Capacity ${String(VENUE.capacity)}.`,
    'GATES:',
    describeGates(),
    'FACILITIES:',
    describeFacilities(),
    'TRANSPORT:',
    describeTransit(),
  ].join('\n');
}
