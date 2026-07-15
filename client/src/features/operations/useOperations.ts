// State and side effects for the operations command center: loads the live
// snapshot on mount, refreshes it on an interval, and generates AI briefings
// on demand.
import { useCallback, useEffect, useState } from 'react';

import { fetchSnapshot, requestBriefing, toErrorMessage } from '../../lib/api.js';
import type { OpsBriefing, OpsSnapshot } from '../../lib/api-types.js';

/** How often the dashboard re-fetches the live snapshot, in milliseconds. */
const SNAPSHOT_REFRESH_MS = 30_000;

interface UseOperationsResult {
  snapshot: OpsSnapshot | null;
  snapshotError: string | null;
  briefing: OpsBriefing | null;
  isBriefingLoading: boolean;
  briefingError: string | null;
  generateBriefing: () => Promise<void>;
}

/** Manages live snapshot polling and briefing generation for the dashboard. */
export function useOperations(): UseOperationsResult {
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<OpsBriefing | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const next = await fetchSnapshot();
        if (active) {
          setSnapshot(next);
          setSnapshotError(null);
        }
      } catch (caught) {
        if (active) {
          setSnapshotError(toErrorMessage(caught, 'Unable to load live operations data.'));
        }
      }
    };
    void load();
    const timer = setInterval(() => void load(), SNAPSHOT_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const generateBriefing = useCallback(async (): Promise<void> => {
    if (isBriefingLoading) {
      return;
    }
    setBriefingError(null);
    setIsBriefingLoading(true);
    try {
      setBriefing(await requestBriefing());
    } catch (caught) {
      setBriefingError(toErrorMessage(caught, 'Unable to generate a briefing right now.'));
    } finally {
      setIsBriefingLoading(false);
    }
  }, [isBriefingLoading]);

  return {
    snapshot,
    snapshotError,
    briefing,
    isBriefingLoading,
    briefingError,
    generateBriefing,
  };
}
