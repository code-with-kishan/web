import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../src/lib/api.js';
import { useAssistant } from '../../../src/features/assistant/useAssistant.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAssistant', () => {
  it('ignores empty questions without calling the API', async () => {
    const ask = vi.spyOn(api, 'askAssistant');
    const { result } = renderHook(() => useAssistant());

    await act(async () => {
      await result.current.ask('   ');
    });

    expect(ask).not.toHaveBeenCalled();
    expect(result.current.turns).toHaveLength(0);
  });

  it('falls back to a generic message when a non-ApiError is thrown', async () => {
    vi.spyOn(api, 'askAssistant').mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAssistant());

    await act(async () => {
      await result.current.ask('Where is Gate 1?');
    });

    expect(result.current.error).toBe('The assistant is unavailable right now. Please try again.');
  });
});
