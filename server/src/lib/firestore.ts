// Firestore access. The client is created once at module scope and reused
// across requests; on Cloud Run it authenticates via the service account.
import { Firestore } from '@google-cloud/firestore';

/** Firestore collection names used by the operations feature. */
export const COLLECTIONS = {
  zones: 'zones',
  incidents: 'incidents',
  sustainability: 'sustainability',
} as const;

/** Document id of the single sustainability metrics document. */
export const SUSTAINABILITY_DOC_ID = 'current';

let client: Firestore | undefined;

/** Returns the shared Firestore client, creating it on first use. */
export function getFirestore(): Firestore {
  client ??= new Firestore();
  return client;
}
