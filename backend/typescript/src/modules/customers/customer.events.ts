import { CustomerRecord } from "./customer.types";

export type CustomerDomainEventType =
  | "customer.created"
  | "customer.updated"
  | "customer.status_changed"
  | "customer.credit_limit_changed"
  | "customer.deleted";

export interface CustomerDomainEvent {
  eventId: string;
  type: CustomerDomainEventType;
  tenantId: string;
  empresaId: string;
  filialId?: string;
  entityId: string;
  actorId: string;
  correlationId: string;
  occurredAt: string;
  version: number;
  payload?: Record<string, unknown>;
}

export interface DomainEventPublisher {
  publish(event: CustomerDomainEvent): Promise<void>;
}

export function customerEvent(
  type: CustomerDomainEventType,
  customer: CustomerRecord,
  actorId: string,
  correlationId: string,
  payload?: Record<string, unknown>,
): CustomerDomainEvent {
  return {
    eventId: cryptoRandomId(),
    type,
    tenantId: customer.tenantId,
    empresaId: customer.empresaId,
    filialId: customer.filialId,
    entityId: customer.id,
    actorId,
    correlationId,
    occurredAt: new Date().toISOString(),
    version: customer.version,
    payload,
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
