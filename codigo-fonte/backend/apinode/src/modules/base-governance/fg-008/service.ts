import {
  buildEnvelope,
  FG008_ERROR_MESSAGES,
  FG008_PERMISSION_KEYS,
  firstValidationError,
  type ApiClient,
  type CreateApiClientRequest,
  type CreateWebhookSubscriptionRequest,
  type Envelope,
  type IntegrationAuditEvent,
  type IntegrationExportRequest,
  type IntegrationListQuery,
  type IntegrationListResponse,
  type TenantScope,
  type UpdateIntegrationStatusRequest,
  type WebhookSubscription,
  validateCreateApiClientRequest,
  validateCreateWebhookSubscriptionRequest,
  validateListQuery,
  validateReason,
  validateUpdateIntegrationStatusRequest
} from "../../../../../../packages/sharedcontracts/src";
import { buildAuditEvent } from "./audit";
import { withIdempotency } from "./idempotency";
import {
  assertCreate,
  assertExport,
  assertHistory,
  assertMfaForCriticalAction,
  assertModuleAllowed,
  assertRead,
  assertTenantScope,
  assertUpdate
} from "./policy";
import { redactSensitiveData } from "./redaction";
import { Fg008HttpError, notFound, validationError, type IntegrationServiceDeps, type RequestContext } from "./types";

const DEFAULT_RETRY_POLICY = {
  maxAttempts: 5,
  backoffSeconds: 60,
  deadLetterAfterAttempts: 5
};

function defaultId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function defaultSecretRef(kind: string, tenantId: string, code: string): string {
  return `projects/eixoone/secrets/${tenantId}-${kind}-${code}`;
}

function normalizeScope(input: TenantScope): TenantScope {
  return {
    tenantId: input.tenantId,
    empresaId: input.empresaId,
    filialId: input.filialId
  };
}

function validateExportRequest(input: unknown): IntegrationExportRequest {
  const payload = input && typeof input === "object" ? input as Record<string, unknown> : {};
  if (!validateReason(payload.reason)) {
    throw validationError({ code: "REASON_REQUIRED", message: FG008_ERROR_MESSAGES.REASON_REQUIRED });
  }
  if (typeof payload.tenantId !== "string" || payload.tenantId.length === 0) {
    throw validationError({ code: "TENANT_SCOPE_REQUIRED", message: FG008_ERROR_MESSAGES.TENANT_SCOPE_REQUIRED });
  }

  return {
    tenantId: String(payload.tenantId),
    empresaId: typeof payload.empresaId === "string" ? payload.empresaId : undefined,
    filialId: typeof payload.filialId === "string" ? payload.filialId : undefined,
    status: typeof payload.status === "string" ? payload.status as IntegrationExportRequest["status"] : undefined,
    includeArchived: payload.includeArchived === true,
    reason: String(payload.reason).trim()
  };
}

export class Fg008IntegrationService {
  private readonly deps: Required<IntegrationServiceDeps>;

  constructor(deps: IntegrationServiceDeps) {
    this.deps = {
      repository: deps.repository,
      generateId: deps.generateId ?? defaultId,
      secretRefFactory: deps.secretRefFactory ?? defaultSecretRef
    };
  }

  async list(context: RequestContext, rawQuery: unknown): Promise<Envelope<IntegrationListResponse>> {
    assertModuleAllowed(context.actor);
    assertRead(context.actor);

    const parsed = validateListQuery(rawQuery);
    if (!parsed.ok || !parsed.value) throw validationError(firstValidationError(parsed.errors));

    const scope = normalizeScope({
      tenantId: parsed.value.tenantId ?? context.actor.tenantId,
      empresaId: parsed.value.empresaId,
      filialId: parsed.value.filialId
    });
    assertTenantScope(context.actor, scope);

    const result = await this.deps.repository.list(scope, parsed.value);
    return buildEnvelope(context.requestId, result, {
      pagination: {
        limit: parsed.value.limit ?? 25,
        totalEstimated: result.apiClients.length + result.webhooks.length
      }
    });
  }

  async detail(context: RequestContext, scope: TenantScope, targetType: "api_client" | "webhook_subscription", targetId: string): Promise<Envelope<ApiClient | WebhookSubscription>> {
    assertModuleAllowed(context.actor);
    assertRead(context.actor);
    assertTenantScope(context.actor, scope);

    const record = targetType === "api_client"
      ? await this.deps.repository.findApiClient(scope, targetId)
      : await this.deps.repository.findWebhook(scope, targetId);

    if (!record) throw notFound();
    return buildEnvelope(context.requestId, redactSensitiveData(record));
  }

  async createApiClient(context: RequestContext, rawBody: unknown, idempotencyKey: string | undefined): Promise<Envelope<ApiClient>> {
    return withIdempotency({
      repository: this.deps.repository,
      context,
      key: idempotencyKey,
      method: "POST",
      path: "/v1/base-governance/integrations/api-clients",
      body: rawBody,
      run: async () => {
        assertModuleAllowed(context.actor);
        assertCreate(context.actor);

        const parsed = validateCreateApiClientRequest(rawBody);
        if (!parsed.ok || !parsed.value) throw validationError(firstValidationError(parsed.errors));

        const scope = normalizeScope(parsed.value);
        assertTenantScope(context.actor, scope);

        const record = this.buildApiClient(parsed.value, context);
        const created = await this.deps.repository.createApiClient(record);

        await this.deps.repository.appendAudit(buildAuditEvent({
          context,
          scope,
          action: "api_client.created",
          targetType: "api_client",
          targetId: created.id,
          after: created,
          reason: parsed.value.reason,
          idempotencyKey
        }, this.deps.generateId));

        return buildEnvelope(context.requestId, redactSensitiveData(created), { idempotencyKey });
      }
    });
  }

  async createWebhook(context: RequestContext, rawBody: unknown, idempotencyKey: string | undefined): Promise<Envelope<WebhookSubscription>> {
    return withIdempotency({
      repository: this.deps.repository,
      context,
      key: idempotencyKey,
      method: "POST",
      path: "/v1/base-governance/integrations/webhooks",
      body: rawBody,
      run: async () => {
        assertModuleAllowed(context.actor);
        assertCreate(context.actor);

        const parsed = validateCreateWebhookSubscriptionRequest(rawBody);
        if (!parsed.ok || !parsed.value) throw validationError(firstValidationError(parsed.errors));

        const scope = normalizeScope(parsed.value);
        assertTenantScope(context.actor, scope);

        const record = this.buildWebhook(parsed.value, context);
        const created = await this.deps.repository.createWebhook(record);

        await this.deps.repository.appendAudit(buildAuditEvent({
          context,
          scope,
          action: "webhook_subscription.created",
          targetType: "webhook_subscription",
          targetId: created.id,
          after: created,
          reason: parsed.value.reason,
          idempotencyKey
        }, this.deps.generateId));

        return buildEnvelope(context.requestId, redactSensitiveData(created), { idempotencyKey });
      }
    });
  }

  async changeStatus(context: RequestContext, rawBody: unknown, idempotencyKey: string | undefined): Promise<Envelope<ApiClient | WebhookSubscription>> {
    return withIdempotency({
      repository: this.deps.repository,
      context,
      key: idempotencyKey,
      method: "PATCH",
      path: "/v1/base-governance/integrations/status",
      body: rawBody,
      run: async () => {
        const parsed = validateUpdateIntegrationStatusRequest(rawBody);
        if (!parsed.ok || !parsed.value) throw validationError(firstValidationError(parsed.errors));

        assertModuleAllowed(context.actor);
        assertUpdate(context.actor, parsed.value.status);
        assertMfaForCriticalAction(context.actor);

        const scope = normalizeScope(parsed.value);
        assertTenantScope(context.actor, scope);

        const updated = await this.updateTargetStatus(context, scope, parsed.value, idempotencyKey);
        return buildEnvelope(context.requestId, redactSensitiveData(updated), { idempotencyKey });
      }
    });
  }

  async export(context: RequestContext, rawBody: unknown, idempotencyKey: string | undefined): Promise<Envelope<{ rows: unknown[]; exportedAt: string }>> {
    return withIdempotency({
      repository: this.deps.repository,
      context,
      key: idempotencyKey,
      method: "POST",
      path: "/v1/base-governance/integrations/export",
      body: rawBody,
      run: async () => {
        assertModuleAllowed(context.actor);
        assertExport(context.actor);
        assertMfaForCriticalAction(context.actor);

        const request = validateExportRequest(rawBody);
        const scope = normalizeScope(request);
        assertTenantScope(context.actor, scope);

        const records = await this.deps.repository.list(scope, {
          status: request.status,
          includeArchived: request.includeArchived,
          limit: 100
        });

        const rows = [...records.apiClients, ...records.webhooks].map((record) => redactSensitiveData(record));
        await this.deps.repository.appendAudit(buildAuditEvent({
          context,
          scope,
          action: "integration.exported",
          targetType: "integration_export",
          targetId: this.deps.generateId("export"),
          after: { rowCount: rows.length },
          reason: request.reason,
          idempotencyKey
        }, this.deps.generateId));

        return buildEnvelope(context.requestId, { rows, exportedAt: context.now }, { idempotencyKey });
      }
    });
  }

  async history(context: RequestContext, scope: TenantScope, targetId?: string): Promise<Envelope<IntegrationAuditEvent[]>> {
    assertModuleAllowed(context.actor);
    assertHistory(context.actor);
    assertTenantScope(context.actor, scope);

    const events = await this.deps.repository.listAudit(scope, targetId);
    return buildEnvelope(context.requestId, redactSensitiveData(events));
  }

  private buildApiClient(input: CreateApiClientRequest, context: RequestContext): ApiClient {
    const id = this.deps.generateId("api_client");
    return {
      id,
      tenantId: input.tenantId,
      empresaId: input.empresaId,
      filialId: input.filialId,
      code: input.code,
      name: input.name,
      description: input.description,
      direction: input.direction,
      allowedScopes: input.allowedScopes,
      allowedOrigins: input.allowedOrigins,
      endpointVersions: [{ ...input.endpointVersion, status: input.endpointVersion.status ?? "active" }],
      credential: {
        kind: input.credentialKind,
        providerKey: input.credentialProviderKey,
        secretRef: this.deps.secretRefFactory(input.credentialKind, input.tenantId, input.code),
        lastRotatedAt: context.now
      },
      status: "active",
      createdAt: context.now,
      updatedAt: context.now,
      createdBy: context.actor.uid
    };
  }

  private buildWebhook(input: CreateWebhookSubscriptionRequest, context: RequestContext): WebhookSubscription {
    const id = this.deps.generateId("webhook");
    return {
      id,
      tenantId: input.tenantId,
      empresaId: input.empresaId,
      filialId: input.filialId,
      code: input.code,
      name: input.name,
      targetUrl: input.targetUrl,
      events: input.events,
      secretRef: this.deps.secretRefFactory("webhook_secret", input.tenantId, input.code),
      retryPolicy: { ...DEFAULT_RETRY_POLICY, ...input.retryPolicy },
      status: "active",
      createdAt: context.now,
      updatedAt: context.now,
      createdBy: context.actor.uid
    };
  }

  private async updateTargetStatus(
    context: RequestContext,
    scope: TenantScope,
    input: UpdateIntegrationStatusRequest,
    idempotencyKey: string | undefined
  ): Promise<ApiClient | WebhookSubscription> {
    const before = input.targetType === "api_client"
      ? await this.deps.repository.findApiClient(scope, input.targetId)
      : await this.deps.repository.findWebhook(scope, input.targetId);

    if (!before) throw notFound();

    const after = {
      ...before,
      status: input.status,
      updatedAt: context.now,
      updatedBy: context.actor.uid
    };

    const updated = input.targetType === "api_client"
      ? await this.deps.repository.updateApiClient(after as ApiClient)
      : await this.deps.repository.updateWebhook(after as WebhookSubscription);

    await this.deps.repository.appendAudit(buildAuditEvent({
      context,
      scope,
      action: `${input.targetType}.${input.status}`,
      targetType: input.targetType,
      targetId: input.targetId,
      before,
      after: updated,
      reason: input.reason,
      idempotencyKey
    }, this.deps.generateId));

    return updated;
  }
}
