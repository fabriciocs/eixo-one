import type { AuditEvent } from '@eixoone/shared-contracts';

export interface AuditLogWriter {
  write(event: AuditEvent): Promise<void>;
  isReady(): Promise<boolean>;
}

export class InMemoryAuditLogWriter implements AuditLogWriter {
  readonly events: AuditEvent[] = [];

  async write(event: AuditEvent) {
    this.events.push(event);
  }

  async isReady() {
    return true;
  }
}

