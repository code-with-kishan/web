// HTTP surface of the assistant feature.
import { Router } from 'express';

import { asyncHandler } from '../../middleware/async-handler.js';
import { genAiLimiter } from '../../middleware/rate-limit.js';
import { validateBody, validatedBody } from '../../middleware/validate.js';
import { askRequestSchema } from './schemas.js';
import { askAssistant } from './service.js';

/** Router mounted at /api/assistant. */
export const assistantRoutes: Router = Router();

assistantRoutes.post(
  '/ask',
  genAiLimiter,
  validateBody(askRequestSchema),
  asyncHandler(async (req, res) => {
    res.json(await askAssistant(validatedBody(askRequestSchema, req)));
  }),
);
