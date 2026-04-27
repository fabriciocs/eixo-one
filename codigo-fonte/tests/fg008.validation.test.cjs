const assert = require("node:assert/strict");
const {
  FG008_PERMISSION_KEYS,
  validateCreateApiClientRequest,
  validateCreateWebhookSubscriptionRequest,
  validateIdempotencyKey
} = require("../dist/packages/sharedcontracts/src/index.js");
const { InMemoryIntegrationRepository } = require("../dist/backend/apinode/src/modules/base-governance/fg-008/repository.js");
const { Fg008IntegrationService } = require("../dist/backend/apinode/src/modules/base-governance/fg-008/service.js");

const actor = {
  uid: "user_001",
  tenantId: "tenant_a",
  empresaIds: ["empresa_1"],
  filialIds: ["filial_1"],
  roleKeys: ["integration_admin"],
  permissionKeys: [
    FG008_PERMISSION_KEYS.read,
    FG008_PERMISSION_KEYS.create,
    FG008_PERMISSION_KEYS.suspend,
    FG008_PERMISSION_KEYS.reactivate,
    FG008_PERMISSION_KEYS.export,
    FG008_PERMISSION_KEYS.history
  ],
  moduleKeys: ["base_governance"],
  mfaVerified: true
};

const context = {
  requestId: "req_test_001",
  actor,
  ip: "127.0.0.1",
  userAgent: "node-test",
  now: "2026-04-27T12:00:00.000Z"
};

const apiClientPayload = {
  tenantId: "tenant_a",
  empresaId: "empresa_1",
  filialId: "filial_1",
  code: "erp-prod",
  name: "ERP Produção",
  description: "Cliente de API para ERP principal.",
  direction: "bidirectional",
  allowedScopes: ["orders:read", "orders:write"],
  allowedOrigins: ["https://erp.example.com"],
  credentialKind: "oauth2",
  credentialProviderKey: "oauth-main",
  endpointVersion: {
    version: "v1",
    baseUrl: "https://api.example.com/v1",
    status: "active",
    openApiPath: "/openapi/fg-008-integrations.openapi.yaml"
  },
  reason: "Criação inicial homologada pela governança."
};

const webhookPayload = {
  tenantId: "tenant_a",
  empresaId: "empresa_1",
  filialId: "filial_1",
  code: "marketplace-orders",
  name: "Pedidos do Marketplace",
  targetUrl: "https://hooks.example.com/orders",
  events: ["payload.received", "payload.delivered"],
  reason: "Sincronizar pedidos aprovados do marketplace."
};

assert.equal(validateIdempotencyKey("fg008-test-key-0001"), true, "idempotency key valid");

const parsedClient = validateCreateApiClientRequest(apiClientPayload);
assert.equal(parsedClient.ok, true, "valid API client payload accepted");

const invalidClient = validateCreateApiClientRequest({ ...apiClientPayload, targetUrl: "http://unsafe.example.com", allowedOrigins: ["http://unsafe.example.com"] });
assert.equal(invalidClient.ok, false, "non-HTTPS origin rejected");

const parsedWebhook = validateCreateWebhookSubscriptionRequest(webhookPayload);
assert.equal(parsedWebhook.ok, true, "valid webhook payload accepted");

(async () => {
const repository = new InMemoryIntegrationRepository();
const service = new Fg008IntegrationService({
  repository,
  generateId: (prefix) => `${prefix}_fixed_${Math.random().toString(36).slice(2, 7)}`,
  secretRefFactory: (kind, tenantId, code) => `projects/test/secrets/${tenantId}-${kind}-${code}`
});

const firstCreate = await service.createApiClient(context, apiClientPayload, "fg008-test-key-0001");
assert.equal(firstCreate.ok, true, "create API client returns envelope ok");
assert.equal(firstCreate.data.credential, "***REDACTED***", "credential block is redacted in response");

const replayCreate = await service.createApiClient(context, apiClientPayload, "fg008-test-key-0001");
assert.deepEqual(replayCreate.data.id, firstCreate.data.id, "same idempotency key replays cached response");

let mismatchThrown = false;
try {
  await service.createApiClient(context, { ...apiClientPayload, name: "Payload diferente" }, "fg008-test-key-0001");
} catch (error) {
  mismatchThrown = error?.apiError?.code === "IDEMPOTENCY_REPLAY_MISMATCH";
}
assert.equal(mismatchThrown, true, "same idempotency key with different payload is rejected");

const webhookCreate = await service.createWebhook(context, webhookPayload, "fg008-test-key-0002");
assert.equal(webhookCreate.ok, true, "create webhook returns envelope ok");

const list = await service.list(context, { tenantId: "tenant_a", empresaId: "empresa_1", filialId: "filial_1", limit: 25 });
assert.equal(list.data.apiClients.length, 1, "list includes one API client");
assert.equal(list.data.webhooks.length, 1, "list includes one webhook");

const noAccessActor = { ...actor, permissionKeys: [] };
let forbidden = false;
try {
  await service.list({ ...context, actor: noAccessActor, requestId: "req_no_access" }, { tenantId: "tenant_a" });
} catch (error) {
  forbidden = error?.apiError?.code === "PERMISSION_DENIED";
}
assert.equal(forbidden, true, "missing permission receives 403-style domain error");

const statusChange = await service.changeStatus(context, {
  tenantId: "tenant_a",
  empresaId: "empresa_1",
  filialId: "filial_1",
  targetType: "api_client",
  targetId: firstCreate.data.id,
  status: "suspended",
  reason: "Suspensão preventiva solicitada pela segurança.",
  confirmationText: firstCreate.data.id
}, "fg008-test-key-0003");
assert.equal(statusChange.data.status, "suspended", "critical status change persisted");

const history = await service.history(context, { tenantId: "tenant_a", empresaId: "empresa_1", filialId: "filial_1" });
assert.ok(history.data.length >= 3, "audit history generated for critical actions");

console.log("FG-008 validation tests passed");
})();
