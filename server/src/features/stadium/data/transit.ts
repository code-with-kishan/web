// Ways to reach and leave Estadio Azteca on matchday.
import type { TransitRoute } from '../types.js';

/** Every transport option, including accessibility notes, for the assistant. */
export const TRANSIT: TransitRoute[] = [
  {
    id: 'metro',
    mode: 'metro',
    name: 'Tren Ligero — Estadio Azteca station',
    guidance:
      'Light rail from Tasqueña metro; trains every 5 minutes until 2 hours after the match. Step-free access at the stadium station.',
    accessible: true,
  },
  {
    id: 'shuttle',
    mode: 'shuttle',
    name: 'FIFA Fan Shuttle',
    guidance:
      'Free shuttles loop between the stadium, Zócalo fan festival and major hotel zones; board at the South Plaza.',
    accessible: true,
  },
  {
    id: 'bus',
    mode: 'bus',
    name: 'City bus corridors',
    guidance:
      'Routes on Calzada de Tlalpan stop 400 m from the North gates; expect diversions for 90 minutes post-match.',
    accessible: false,
  },
  {
    id: 'parking',
    mode: 'parking',
    name: 'Official parking (pre-booked only)',
    guidance:
      'Lots E and S require a pre-booked permit; accessible bays are beside Gate 6 with a drop-off lane.',
    accessible: true,
  },
  {
    id: 'rideshare',
    mode: 'rideshare',
    name: 'Rideshare pick-up zone',
    guidance:
      'Designated pick-up on Avenida del Imán, a signposted 10-minute walk from the West gates.',
    accessible: true,
  },
];
