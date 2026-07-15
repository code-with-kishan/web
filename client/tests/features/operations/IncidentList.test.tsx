import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IncidentList } from '../../../src/features/operations/IncidentList.js';
import type { Incident } from '../../../src/lib/api-types.js';

const INCIDENT: Incident = {
  id: 'inc-1',
  zoneId: 'north-stand',
  category: 'security',
  severity: 'medium',
  summary: 'Bag check queue backing up.',
  status: 'open',
  reportedAt: '2026-07-06T17:00:00.000Z',
};

describe('IncidentList', () => {
  it('renders an empty state when there are no incidents', () => {
    render(<IncidentList incidents={[]} />);
    expect(screen.getByText('No incidents reported.')).toBeInTheDocument();
  });

  it('renders each incident with its zone, category and status', () => {
    render(<IncidentList incidents={[INCIDENT]} />);
    expect(screen.getByText('Bag check queue backing up.')).toBeInTheDocument();
    expect(screen.getByText(/security/)).toBeInTheDocument();
    expect(screen.getByText(/north-stand/)).toBeInTheDocument();
  });
});
