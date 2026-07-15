// Domain types for the venue: the physical stadium layout, guest facilities,
// and transportation options the fan assistant grounds its answers in.

/** Category used to filter facilities and to tag quick actions. */
export type FacilityCategory =
  'food' | 'medical' | 'accessibility' | 'family' | 'prayer' | 'sustainability' | 'services';

/** A named entry gate with the stands it serves. */
export interface Gate {
  id: string;
  name: string;
  serves: string;
  accessible: boolean;
}

/** A guest-facing facility inside the stadium. */
export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  location: string;
  accessible: boolean;
  details: string;
}

/** A way to reach or leave the stadium. */
export interface TransitRoute {
  id: string;
  mode: 'metro' | 'shuttle' | 'bus' | 'parking' | 'rideshare';
  name: string;
  guidance: string;
  accessible: boolean;
}

/** The full static venue description used for assistant grounding. */
export interface VenueProfile {
  name: string;
  city: string;
  tournament: string;
  capacity: number;
  gates: Gate[];
  facilities: Facility[];
  transit: TransitRoute[];
}
