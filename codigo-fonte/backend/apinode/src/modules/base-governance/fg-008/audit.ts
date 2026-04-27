import type { IntegrationAuditEvent, TenantScope } from "../../../../../../packages/sharedcontracts/src";
import type { RequestContext } from "./types";
import { redactSensitiveData } from "./redaction";

export interface BuildAuditInput {
  context: RequestContext;
  scope: TenantScope;
  action: string;
  targetType: IntegrationAuditEvent["targetType"];
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  idempotencyKey?: string;
}

export function buildAuditEvent(input: BuildAuditInput, generateId: (prefix: string) => string): IntegrationAuditEvent {
  return {
    id: generateId("audit"),
    tenantId: input.scope.tenantId,
    empresaId: input.scope.empresaId,
    filialId: input.scope.filialId,
    actorUid: input.context.actor.uid,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    before: input.before === undefined ? undefined : redactSensitiveData(input.before),
    after: input.after === undefined ? undefined : redactSensitiveData(input.after),
    reason: input.reason,
    requestId: input.context.requestId,
    idempotencyKey: input.idempotencyKey,
    ip: input.context.ip,
    userAgent: input.context.userAgent,
    createdAt: input.context.now
  };
}
