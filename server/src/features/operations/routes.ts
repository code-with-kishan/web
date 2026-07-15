// HTTP surface of the operations feature.
import { Router } from 'express';

import { asyncHandler } from '../../middleware/async-handler.js';
import { genAiLimiter } from '../../middleware/rate-limit.js';
import { generateBriefing } from './briefing.js';
import { getSnapshot } from './service.js';

/** Router mounted at /api/operations. */
export const operationsRoutes: Router = Router();

operationsRoutes.get(
  '/snapshot',
  asyncHandler(async (_req, res) => {
    res.json(await getSnapshot());
  }),
);

operationsRoutes.post(
  '/briefing',
  genAiLimiter,
  asyncHandler(async (_req, res) => {
    res.json(await generateBriefing());
  }),
);
