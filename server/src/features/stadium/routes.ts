// HTTP surface of the stadium feature. Routes dispatch; the service holds
// the logic.
import { Router } from 'express';

import { validateQuery, validatedQuery } from '../../middleware/validate.js';
import { facilitiesQuerySchema } from './schemas.js';
import { getFacilities } from './service.js';
import { VENUE } from './venue-data.js';

/** Router mounted at /api/stadium. */
export const stadiumRoutes: Router = Router();

stadiumRoutes.get('/facilities', validateQuery(facilitiesQuerySchema), (req, res) => {
  const query = validatedQuery(facilitiesQuerySchema, req);
  res.json({ facilities: getFacilities(query.category) });
});

stadiumRoutes.get('/venue', (_req, res) => {
  const { name, city, tournament, capacity } = VENUE;
  res.json({ venue: { name, city, tournament, capacity } });
});
