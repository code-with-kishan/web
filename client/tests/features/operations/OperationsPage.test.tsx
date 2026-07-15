import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OperationsPage } from '../../../src/features/operations/OperationsPage.js';
import * as api from '../../../src/lib/api.js';
import type { OpsSnapshot } from '../../../src/lib/api-types.js';

const SNAPSHOT: OpsSnapshot = {
  zones: [
    {
      id: 'south-concourse',
      name: 'South Concourse',
      capacity: 6000,
      occupancy: 5300,
      densityPct: 88,
      status: 'critical',
    },
    {
      id: 'north-stand',
      name: 'North Stand',
      capacity: 18000,
      occupancy: 9900,
      densityPct: 55,
      status: 'comfortable',
    },
  ],
  incidents: [
    {
      id: 'inc-001',
      zoneId: 'south-concourse',
      category: 'crowd',
      severity: 'high',
      summary: 'Congestion at the South Concourse food court.',
      status: 'open',
      reportedAt: '2026-07-06T17:05:00.000Z',
    },
  ],
  sustainability: {
    wasteDivertedPct: 68,
    energyKwh: 41200,
    waterRefillCount: 5230,
    co2SavedKg: 1840,
  },
  generatedAt: '2026-07-06T17:10:00.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OperationsPage', () => {
  it('renders live zones, incidents and sustainability from the snapshot', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);

    render(<OperationsPage />);

    expect(await screen.findByText('South Concourse')).toBeInTheDocument();
    expect(screen.getByText('Congestion at the South Concourse food court.')).toBeInTheDocument();
    expect(screen.getByText('Waste diverted from landfill')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('exposes zone density as an accessible meter', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);

    render(<OperationsPage />);

    const meters = await screen.findAllByRole('meter');
    expect(meters[0]).toHaveAttribute('aria-valuenow', '88');
  });

  it('shows an error state when the snapshot fails to load', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockRejectedValue(
      new api.ApiError('INTERNAL', 'Unable to load live operations data.'),
    );

    render(<OperationsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
  });

  it('generates an AI briefing on demand', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    vi.spyOn(api, 'requestBriefing').mockResolvedValue({
      briefing: 'TOP RISKS\n- South Concourse critical, redirect to North gates.',
      generatedAt: '2026-07-06T17:11:00.000Z',
    });
    const user = userEvent.setup();

    render(<OperationsPage />);
    await screen.findByText('South Concourse');
    await user.click(screen.getByRole('button', { name: 'Generate AI briefing' }));

    expect(await screen.findByText(/redirect to North gates/)).toBeInTheDocument();
  });
});
