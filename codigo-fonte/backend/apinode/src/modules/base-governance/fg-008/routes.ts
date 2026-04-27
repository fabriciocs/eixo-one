import {
  type TenantScope
} from "../../../../../../packages/sharedcontracts/src";
import { assertAuthenticated } from "./policy";
import { Fg008IntegrationService } from "./service";
import { toEnvelopeError, type IntegrationServiceDeps, type RequestContext, type RouteRegistry, type RouteRequest, type RouteReply } from "./types";

function requestIdFrom(headers: Record<string, string | undefined>): string {
  return headers["x-request-id"] || `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildContext(request: RouteRequest): RequestContext {
  assertAuthenticated(request.auth);
  return {
    requestId: requestIdFrom(request.headers),
    actor: request.auth,
    ip: request.ip,
    userAgent: request.headers["user-agent"],
    now: new Date().toISOString()
  };
}

async function send<T>(reply: RouteReply, operation: () => Promise<T>, requestId: string): Promise<void> {
  try {
    const payload = await operation();
    reply.status(200).send(payload as never);
  } catch (error) {
    const result = toEnvelopeError(requestId, error);
    reply.status(result.statusCode).send(result.envelope);
  }
}

function scopeFrom(query: unknown, actorTenantId: string): TenantScope {
  const record = query && typeof query === "object" ? query as Record<string, unknown> : {};
  return {
    tenantId: typeof record.tenantId === "string" ? record.tenantId : actorTenantId,
    empresaId: typeof record.empresaId === "string" ? record.empresaId : undefined,
    filialId: typeof record.filialId === "string" ? record.filialId : undefined
  };
}

function targetTypeParam(params: unknown): "api_client" | "webhook_subscription" {
  const record = params && typeof params === "object" ? params as Record<string, unknown> : {};
  return record.targetType === "webhook_subscription" ? "webhook_subscription" : "api_client";
}

function targetIdParam(params: unknown): string {
  const record = params && typeof params === "object" ? params as Record<string, unknown> : {};
  return typeof record.targetId === "string" ? record.targetId : "";
}

export function registerFg008IntegrationRoutes(app: RouteRegistry, deps: IntegrationServiceDeps): void {
  const service = new Fg008IntegrationService(deps);

  app.get("/v1/base-governance/integrations", async (request, reply) => {
    const context = buildContext(request);
    await send(reply, () => service.list(context, request.query), context.requestId);
  });

  app.get("/v1/base-governance/integrations/:targetType/:targetId", async (request, reply) => {
    const context = buildContext(request);
    const scope = scopeFrom(request.query, context.actor.tenantId);
    await send(reply, () => service.detail(context, scope, targetTypeParam(request.params), targetIdParam(request.params)), context.requestId);
  });

  app.post("/v1/base-governance/integrations/api-clients", async (request, reply) => {
    const context = buildContext(request);
    await send(reply, () => service.createApiClient(context, request.body, request.headers["x-idempotency-key"]), context.requestId);
  });

  app.post("/v1/base-governance/integrations/webhooks", async (request, reply) => {
    const context = buildContext(request);
    await send(reply, () => service.createWebhook(context, request.body, request.headers["x-idempotency-key"]), context.requestId);
  });

  app.patch("/v1/base-governance/integrations/status", async (request, reply) => {
    const context = buildContext(request);
    await send(reply, () => service.changeStatus(context, request.body, request.headers["x-idempotency-key"]), context.requestId);
  });

  app.post("/v1/base-governance/integrations/export", async (request, reply) => {
    const context = buildContext(request);
    await send(reply, () => service.export(context, request.body, request.headers["x-idempotency-key"]), context.requestId);
  });

  app.get("/v1/base-governance/integrations/history", async (request, reply) => {
    const context = buildContext(request);
    const scope = scopeFrom(request.query, context.actor.tenantId);
    const targetId = typeof (request.query as Record<string, unknown> | undefined)?.targetId === "string"
      ? (request.query as Record<string, string>).targetId
      : undefined;
    await send(reply, () => service.history(context, scope, targetId), context.requestId);
  });
}
