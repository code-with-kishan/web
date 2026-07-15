// Canonical venue profile: Estadio Azteca (Mexico City), the FIFA World Cup
// 2026 opening-match venue. Static reference data lives in code (typed and
// reviewable); dynamic operational state lives in Firestore. The gate,
// facility and transit datasets are composed from focused modules in ./data.
import { FACILITIES } from './data/facilities.js';
import { GATES } from './data/gates.js';
import { TRANSIT } from './data/transit.js';
import type { VenueProfile } from './types.js';

/** Static profile of the venue used to ground every assistant answer. */
export const VENUE: VenueProfile = {
  name: 'Estadio Azteca',
  city: 'Mexico City',
  tournament: 'FIFA World Cup 2026',
  capacity: 83264,
  gates: GATES,
  facilities: FACILITIES,
  transit: TRANSIT,
};
