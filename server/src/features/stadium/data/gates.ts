// Entry gates at Estadio Azteca and the stands each one serves.
import type { Gate } from '../types.js';

/** Every entry gate, with the sections it serves and step-free availability. */
export const GATES: Gate[] = [
  {
    id: 'gate-1',
    name: 'Gate 1 — North',
    serves: 'North Stand, sections 101–128',
    accessible: true,
  },
  {
    id: 'gate-2',
    name: 'Gate 2 — Northeast',
    serves: 'East Stand upper, sections 201–224',
    accessible: false,
  },
  {
    id: 'gate-3',
    name: 'Gate 3 — East',
    serves: 'East Stand lower, sections 129–148',
    accessible: true,
  },
  {
    id: 'gate-4',
    name: 'Gate 4 — South',
    serves: 'South Stand, sections 149–176',
    accessible: true,
  },
  {
    id: 'gate-5',
    name: 'Gate 5 — Southwest',
    serves: 'West Stand upper, sections 225–248',
    accessible: false,
  },
  {
    id: 'gate-6',
    name: 'Gate 6 — West (VIP & accessibility priority)',
    serves: 'West Stand lower, hospitality, accessible seating',
    accessible: true,
  },
];
