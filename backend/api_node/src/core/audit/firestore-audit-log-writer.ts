import crypto from 'node:crypto';

import type { AuditEvent } from '@eixoone/shared-contracts';
import { FieldPath, type Firestore } from 'firebase-admin/firestore';

import { sanitizeFirestoreData } from '../../integrations/firebase/firestore-sanitize.js';
import type { AuditLogWriter } from './audit-log-writer.js';

export class FirestoreAuditLogWriter implements AuditLogWriter {
  constructor(private readonly firestore: Firestore) {}

  private collection() {
    return this.firestore.collection('audit_logs');
  }

  async write(event: AuditEvent) {
    await this.collection()
      .doc(`audit_${crypto.randomUUID().replace(/-/g, '')}`)
      .create(sanitizeFirestoreData(event));
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
