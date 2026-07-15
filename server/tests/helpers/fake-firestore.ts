// In-memory stand-in for the narrow Firestore surface the operations
// feature uses, so unit tests are hermetic (no emulator, no network).
import type { Firestore } from '@google-cloud/firestore';

type DocData = Record<string, unknown>;

interface FakeDocRef {
  id: string;
  collectionName: string;
  get(): Promise<{ data(): DocData | undefined; exists: boolean }>;
  set(data: DocData): Promise<void>;
}

interface FakeQuerySnapshot {
  empty: boolean;
  docs: { data(): DocData; ref: FakeDocRef }[];
}

/** Minimal in-memory Firestore double supporting the calls the app makes. */
export class FakeFirestore {
  private readonly store = new Map<string, Map<string, DocData>>();

  private col(name: string): Map<string, DocData> {
    let collection = this.store.get(name);
    if (!collection) {
      collection = new Map<string, DocData>();
      this.store.set(name, collection);
    }
    return collection;
  }

  /** Empties every collection (fresh state between tests). */
  reset(): void {
    this.store.clear();
  }

  /** Reads a document directly (test assertions). */
  read(collectionName: string, id: string): DocData | undefined {
    return this.col(collectionName).get(id);
  }

  private makeDocRef(collectionName: string, id: string): FakeDocRef {
    const collection = this.col(collectionName);
    return {
      id,
      collectionName,
      get: () => Promise.resolve({ data: () => collection.get(id), exists: collection.has(id) }),
      set: (data: DocData) => {
        collection.set(id, data);
        return Promise.resolve();
      },
    };
  }

  private makeSnapshot(collectionName: string, limit?: number): FakeQuerySnapshot {
    const entries = [...this.col(collectionName).entries()].slice(0, limit);
    return {
      empty: entries.length === 0,
      docs: entries.map(([id, data]) => ({
        data: () => data,
        ref: this.makeDocRef(collectionName, id),
      })),
    };
  }

  collection(name: string): {
    get(): Promise<FakeQuerySnapshot>;
    limit(n: number): { get(): Promise<FakeQuerySnapshot> };
    doc(id: string): FakeDocRef;
  } {
    return {
      get: () => Promise.resolve(this.makeSnapshot(name)),
      limit: (n: number) => ({ get: () => Promise.resolve(this.makeSnapshot(name, n)) }),
      doc: (id: string) => this.makeDocRef(name, id),
    };
  }

  batch(): {
    set(ref: FakeDocRef, data: DocData, options?: { merge?: boolean }): void;
    update(ref: FakeDocRef, data: DocData): void;
    commit(): Promise<void>;
  } {
    const operations: (() => void)[] = [];
    return {
      set: (ref, data, options) => {
        operations.push(() => {
          const collection = this.col(ref.collectionName);
          const existing = options?.merge === true ? (collection.get(ref.id) ?? {}) : {};
          collection.set(ref.id, { ...existing, ...data });
        });
      },
      update: (ref, data) => {
        operations.push(() => {
          const collection = this.col(ref.collectionName);
          collection.set(ref.id, { ...(collection.get(ref.id) ?? {}), ...data });
        });
      },
      commit: () => {
        operations.forEach((apply) => {
          apply();
        });
        return Promise.resolve();
      },
    };
  }

  /** Casts this fake to the real Firestore type at the mock boundary. */
  asFirestore(): Firestore {
    return this as unknown as Firestore;
  }
}
