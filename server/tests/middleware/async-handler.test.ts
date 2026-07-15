import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { asyncHandler } from '../../src/middleware/async-handler.js';

const req = {} as unknown as Request;
const res = {} as unknown as Response;

/** Lets pending microtasks (the handler's promise settling) run. */
function flush(): Promise<void> {
  return new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

describe('asyncHandler', () => {
  it('does not call next when the handler resolves', async () => {
    const next = vi.fn();
    asyncHandler(() => Promise.resolve('ok'))(req, res, next);
    await flush();
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards a rejected promise to next', async () => {
    const next = vi.fn();
    const boom = new Error('boom');
    asyncHandler(() => Promise.reject(boom))(req, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(boom);
  });
});
