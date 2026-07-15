import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../src/lib/api.js';
import { useOperations } from '../../../src/features/operations/useOperations.js';
import type { OpsSnapshot } from '../../../src/lib/api-types.js';

const SNAPSHOT: OpsSnapshot = {
  zones: [],
  incidents: [],
  sustainability: { wasteDivertedPct: 60, energyKwh: 1, waterRefillCount: 2, co2SavedKg: 3 },
  generatedAt: '2026-07-06T17:00:00.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useOperations', () => {
  it('surfaces a generic message when the briefing fails without an ApiError', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    vi.spyOn(api, 'requestBriefing').mockRejectedValue(new Error('unexpected'));

    const { result } = renderHook(() => useOperations());
    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    await act(async () => {
      await result.current.generateBriefing();
    });

    expect(result.current.briefingError).toBe('Unable to generate a briefing right now.');
  });

  it('ignores a second briefing request while one is already in flight', async () => {
    vi.spyOn(api, 'fetchSnapshot').mockResolvedValue(SNAPSHOT);
    let resolveBriefing!: (value: { briefing: string; generatedAt: string }) => void;
    const briefingSpy = vi.spyOn(api, 'requestBriefing').mockReturnValue(
      new Promise((resolve) => {
        resolveBriefing = resolve;
      }),
    );

    const { result } = renderHook(() => useOperations());
    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    act(() => {
      void result.current.generateBriefing();
    });
    expect(result.current.isBriefingLoading).toBe(true);

    // A double-click must not fire a second (billable) Gemini request.
    await act(async () => {
      await result.current.generateBriefing();
    });
    expect(briefingSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveBriefing({ briefing: 'TOP RISKS', generatedAt: 'now' });
      await Promise.resolve();
    });
    expect(result.current.briefing?.briefing).toBe('TOP RISKS');
    expect(result.current.isBriefingLoading).toBe(false);
  });
});
