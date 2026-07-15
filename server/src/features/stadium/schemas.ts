// Boundary validation for the stadium feature.
import { z } from 'zod';

/** Valid facility categories, mirrored from the domain type. */
export const facilityCategorySchema = z.enum([
  'food',
  'medical',
  'accessibility',
  'family',
  'prayer',
  'sustainability',
  'services',
]);

/** Query schema for GET /api/stadium/facilities. */
export const facilitiesQuerySchema = z
  .object({ category: facilityCategorySchema.optional() })
  .strict();

/** Parsed facilities query. */
export type FacilitiesQuery = z.infer<typeof facilitiesQuerySchema>;
