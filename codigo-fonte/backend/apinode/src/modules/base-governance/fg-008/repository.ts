import type {
  ApiClient,
  IntegrationAuditEvent,
  IntegrationListQuery,
  IntegrationListResponse,
  TenantScope,
  WebhookSubscription
} from "../../../../../../packages/sharedcontracts/src";
import type { IdempotencyRecord, IntegrationRepository } from "./types";

function inScope(record: TenantScope, scope: TenantScope): boolean {
  return record.tenantId === scope.tenantId
    && (scope.empresaId === undefined || record.empresaId === scope.empresaId)
    && (scope.filialId === undefined || record.filialId === scope.filialId);
}

function matchesSearch(record: { code: string; name: string; description?: string }, search?: string): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return [record.code, record.name, record.description ?? ""].some((value) => value.toLowerCase().includes(needle));
}

function applyQuery<T extends TenantScope & { status: string; code: string; name: string; description?: string }>(records: T[], scope: TenantScope, query: IntegrationListQuery): T[] {
  const limit = query.limit ?? 25;
  return records
    .filter((record) => inScope(record, scope))
    .filter((record) => query.includeArchived === true || record.status !== "archived")
    .filter((record) => !query.status || record.status === query.status)
    .filter((record) => matchesSearch(record, query.search))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Adaptador em memória para validação local.
 *
 * No repositório real, substituir por uma implementação Firestore que use:
 * /tenants/{tenantId}/integrationApiClients/{id}
 * /tenants/{tenantId}/webhookSubscriptions/{id}
 * /tenants/{tenantId}/auditLogs/{id}
 * /tenants/{tenantId}/idempotencyKeys/{key}
 */
export class InMemoryIntegrationRepository implements IntegrationRepository {
  private readonly apiClients = new Map<string, ApiClient>();
  private readonly webhooks = new Map<string, WebhookSubscription>();
  private readonly audits: IntegrationAuditEvent[] = [];
  private readonly idempotency = new Map<string, IdempotencyRecord>();

  async list(scope: TenantScope, query: IntegrationListQuery): Promise<IntegrationListResponse> {
    return {
      apiClients: applyQuery([...this.apiClients.values()], scope, query),
      webhooks: applyQuery([...this.webhooks.values()], scope, query)
    };
  }

  async findApiClient(scope: TenantScope, id: string): Promise<ApiClient | undefined> {
    const record = this.apiClients.get(id);
    return record && inScope(record, scope) ? record : undefined;
  }

  async findWebhook(scope: TenantScope, id: string): Promise<WebhookSubscription | undefined> {
    const record = this.webhooks.get(id);
    return record && inScope(record, scope) ? record : undefined;
  }

  async createApiClient(record: ApiClient): Promise<ApiClient> {
    this.apiClients.set(record.id, record);
    return record;
  }

  async createWebhook(record: WebhookSubscription): Promise<WebhookSubscription> {
    this.webhooks.set(record.id, record);
    return record;
  }

  async updateApiClient(record: ApiClient): Promise<ApiClient> {
    this.apiClients.set(record.id, record);
    return record;
  }

  async updateWebhook(record: WebhookSubscription): Promise<WebhookSubscription> {
    this.webhooks.set(record.id, record);
    return record;
  }

  async appendAudit(event: IntegrationAuditEvent): Promise<void> {
    this.audits.push(event);
  }

  async listAudit(scope: TenantScope, targetId?: string): Promise<IntegrationAuditEvent[]> {
    return this.audits
      .filter((event) => inScope(event, scope))
      .filter((event) => targetId === undefined || event.targetId === targetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getIdempotency(key: string): Promise<IdempotencyRecord | undefined> {
    return this.idempotency.get(key);
  }

  async putIdempotency(record: IdempotencyRecord): Promise<void> {
    this.idempotency.set(record.key, record);
  }
}
