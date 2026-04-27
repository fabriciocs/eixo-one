import crypto from 'node:crypto';

import { FieldPath, type Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

import { sanitizeFirestoreData } from '../../integrations/firebase/firestore-sanitize.js';
import type { IdempotencyRecord, IdempotencyStore } from './idempotency-store.js';

const persistedIdempotencyRecordSchema = z.object({
  scope: z.string().trim().min(1),
  fingerprint: z.string().trim().min(1),
  statusCode: z.number().int().min(100).max(599),
  responseBody: z.unknown(),
  createdAt: z.string().trim().min(10),
});

type PersistedIdempotencyRecord = z.infer<
  typeof persistedIdempotencyRecordSchema
>;

export class FirestoreIdempotencyStore implements IdempotencyStore {
  constructor(private readonly firestore: Firestore) {}

  private collection() {
    return this.firestore.collection('idempotency_records');
  }

  private documentId(scope: string) {
    return crypto.createHash('sha256').update(scope).digest('hex');
  }

  async get<T = unknown>(scope: string) {
    const snapshot = await this.collection().doc(this.documentId(scope)).get();

    if (!snapshot.exists) {
      return null;
    }

    const parsed = persistedIdempotencyRecordSchema.parse(snapshot.data());

    if (parsed.scope !== scope) {
      return null;
    }

    return parsed as IdempotencyRecord<T>;
  }

  async set<T = unknown>(record: IdempotencyRecord<T>) {
    const parsed = persistedIdempotencyRecordSchema.parse(
      record,
    ) as PersistedIdempotencyRecord;

    await this.collection()
      .doc(this.documentId(parsed.scope))
      .set(sanitizeFirestoreData(parsed), { merge: false });
  }

  async isReady() {
    try {
      await this.collection().limit(1).select(FieldPath.documentId()).get();
      return true;
    } catch {
      return false;
    }
  }
}
