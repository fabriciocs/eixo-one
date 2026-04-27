export const FG008_FEATURE_ID = "FG-008" as const;
export const FG008_MODULE_KEY = "base_governance" as const;
export const FG008_RESOURCE_KEY = "integrations_api_webhooks" as const;

export const FG008_PERMISSION_KEYS = {
  read: "base_governance.integrations_api_webhooks.read",
  create: "base_governance.integrations_api_webhooks.create",
  update: "base_governance.integrations_api_webhooks.update",
  suspend: "base_governance.integrations_api_webhooks.suspend",
  reactivate: "base_governance.integrations_api_webhooks.reactivate",
  archive: "base_governance.integrations_api_webhooks.archive",
  export: "base_governance.integrations_api_webhooks.export",
  history: "base_governance.integrations_api_webhooks.history"
} as const;

export type Fg008PermissionKey =
  (typeof FG008_PERMISSION_KEYS)[keyof typeof FG008_PERMISSION_KEYS];

export type IntegrationStatus = "active" | "suspended" | "archived" | "pending_review";
export type IntegrationDirection = "inbound" | "outbound" | "bidirectional";
export type CredentialKind = "oauth2" | "api_key" | "webhook_secret" | "oidc" | "saml";
export type WebhookDeliveryStatus = "pending" | "delivered" | "failed" | "retrying";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type WebhookEvent =
  | "integration.created"
  | "integration.updated"
  | "integration.suspended"
  | "integration.reactivated"
  | "integration.archived"
  | "payload.received"
  | "payload.delivered"
  | "payload.failed";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ResponseMeta {
  requestId: string;
  idempotencyKey?: string;
  pagination?: PaginationMeta;
}

export interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: ApiError;
  meta: ResponseMeta;
}

export interface PaginationRequest {
  limit?: number;
  cursor?: string;
}

export interface PaginationMeta {
  limit: number;
  nextCursor?: string;
  totalEstimated?: number;
}

export interface TenantScope {
  tenantId: string;
  empresaId?: string;
  filialId?: string;
}

export interface CredentialReference {
  kind: CredentialKind;
  providerKey: string;
  secretRef: string;
  expiresAt?: string;
  lastRotatedAt?: string;
}

export interface IntegrationEndpointVersion {
  version: string;
  baseUrl: string;
  openApiPath?: string;
  status: IntegrationStatus;
  publishedAt?: string;
  deprecatedAt?: string;
}

export interface ApiClient {
  id: string;
  tenantId: string;
  empresaId?: string;
  filialId?: string;
  code: string;
  name: string;
  description?: string;
  direction: IntegrationDirection;
  allowedScopes: string[];
  allowedOrigins: string[];
  endpointVersions: IntegrationEndpointVersion[];
  credential: CredentialReference;
  status: IntegrationStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  empresaId?: string;
  filialId?: string;
  code: string;
  name: string;
  targetUrl: string;
  events: WebhookEvent[];
  secretRef: string;
  retryPolicy: {
    maxAttempts: number;
    backoffSeconds: number;
    deadLetterAfterAttempts: number;
  };
  status: IntegrationStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface IntegrationAuditEvent {
  id: string;
  tenantId: string;
  empresaId?: string;
  filialId?: string;
  actorUid: string;
  action: string;
  targetType: "api_client" | "webhook_subscription" | "integration_export";
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  requestId: string;
  idempotencyKey?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface IntegrationEventLog {
  id: string;
  tenantId: string;
  empresaId?: string;
  filialId?: string;
  targetType: "api_client" | "webhook_subscription";
  targetId: string;
  event: WebhookEvent | string;
  deliveryStatus?: WebhookDeliveryStatus;
  payloadRef?: string;
  errorCode?: string;
  requestId: string;
  createdAt: string;
}

export interface IntegrationListQuery extends PaginationRequest {
  tenantId?: string;
  empresaId?: string;
  filialId?: string;
  status?: IntegrationStatus;
  search?: string;
  includeArchived?: boolean;
}

export interface IntegrationListResponse {
  apiClients: ApiClient[];
  webhooks: WebhookSubscription[];
}

export interface CreateApiClientRequest extends TenantScope {
  code: string;
  name: string;
  description?: string;
  direction: IntegrationDirection;
  allowedScopes: string[];
  allowedOrigins: string[];
  credentialKind: CredentialKind;
  credentialProviderKey: string;
  endpointVersion: IntegrationEndpointVersion;
  reason: string;
}

export interface CreateWebhookSubscriptionRequest extends TenantScope {
  code: string;
  name: string;
  targetUrl: string;
  events: WebhookEvent[];
  retryPolicy?: {
    maxAttempts?: number;
    backoffSeconds?: number;
    deadLetterAfterAttempts?: number;
  };
  reason: string;
}

export interface UpdateIntegrationStatusRequest extends TenantScope {
  targetType: "api_client" | "webhook_subscription";
  targetId: string;
  status: Exclude<IntegrationStatus, "pending_review">;
  reason: string;
  confirmationText: string;
}

export interface IntegrationExportRequest extends TenantScope {
  status?: IntegrationStatus;
  includeArchived?: boolean;
  reason: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors?: ApiError[];
}

export const FG008_ERROR_MESSAGES = {
  AUTH_REQUIRED: "Autenticação obrigatória.",
  PERMISSION_DENIED: "Você não tem permissão para executar esta ação.",
  TENANT_SCOPE_REQUIRED: "Contexto de tenant é obrigatório.",
  EMPRESA_FORBIDDEN: "Empresa fora do escopo autorizado.",
  FILIAL_FORBIDDEN: "Filial fora do escopo autorizado.",
  MODULE_NOT_ALLOWED: "Módulo não autorizado para o usuário.",
  INVALID_CODE: "Código deve ter 2 a 30 caracteres, usando letras, números, ponto, hífen ou underline.",
  INVALID_NAME: "Nome deve ter 2 a 150 caracteres.",
  INVALID_URL: "Informe uma URL HTTPS válida.",
  INVALID_ORIGIN: "Origem permitida deve ser HTTPS.",
  INVALID_STATUS: "Status informado não é permitido.",
  INVALID_PAGINATION: "Paginação inválida. Use limit entre 1 e 100.",
  REASON_REQUIRED: "Justificativa é obrigatória e deve ter entre 10 e 500 caracteres.",
  CONFIRMATION_MISMATCH: "Texto de confirmação não corresponde ao alvo informado.",
  IDEMPOTENCY_KEY_REQUIRED: "Header x-idempotency-key é obrigatório em mutações críticas.",
  IDEMPOTENCY_REPLAY_MISMATCH: "Chave de idempotência já usada com payload diferente.",
  TIMESTAMP_CLIENT_FORBIDDEN: "Timestamps devem ser gerados somente no backend.",
  SECRET_CLIENT_FORBIDDEN: "Segredos devem ser gravados somente em Secret Manager ou cofre equivalente.",
  VALIDATION_ERROR: "Dados inválidos.",
  NOT_FOUND: "Recurso não encontrado."
} as const;

const statusSet = new Set<IntegrationStatus>(["active", "suspended", "archived", "pending_review"]);
const directionSet = new Set<IntegrationDirection>(["inbound", "outbound", "bidirectional"]);
const credentialKindSet = new Set<CredentialKind>(["oauth2", "api_key", "webhook_secret", "oidc", "saml"]);
const eventSet = new Set<WebhookEvent>([
  "integration.created",
  "integration.updated",
  "integration.suspended",
  "integration.reactivated",
  "integration.archived",
  "payload.received",
  "payload.delivered",
  "payload.failed"
]);

function error(code: keyof typeof FG008_ERROR_MESSAGES, details?: unknown): ApiError {
  return { code, message: FG008_ERROR_MESSAGES[code], details };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown, maxLength = 50): value is string[] {
  return Array.isArray(value)
    && value.length <= maxLength
    && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

export function validateCode(value: unknown): boolean {
  return typeof value === "string" && /^[A-Za-z0-9._-]{2,30}$/.test(value);
}

export function validateName(value: unknown): boolean {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 150 && !/[<>]/.test(value);
}

export function validateReason(value: unknown): boolean {
  return typeof value === "string" && value.trim().length >= 10 && value.trim().length <= 500 && !/[<>]/.test(value);
}

export function validateHttpsUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export function validateIdempotencyKey(value: unknown): boolean {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{16,128}$/.test(value);
}

export function validateTenantScope(payload: Record<string, unknown>): ApiError[] {
  const errors: ApiError[] = [];
  if (!isNonEmptyString(payload.tenantId)) errors.push(error("TENANT_SCOPE_REQUIRED"));
  if (payload.empresaId !== undefined && !isNonEmptyString(payload.empresaId)) errors.push(error("EMPRESA_FORBIDDEN"));
  if (payload.filialId !== undefined && !isNonEmptyString(payload.filialId)) errors.push(error("FILIAL_FORBIDDEN"));
  return errors;
}

export function rejectClientControlledFields(payload: Record<string, unknown>): ApiError[] {
  const forbidden = ["id", "createdAt", "updatedAt", "deletedAt", "createdBy", "updatedBy", "credential", "secretRef", "actorUid"];
  const found = forbidden.filter((key) => Object.prototype.hasOwnProperty.call(payload, key));
  const errors: ApiError[] = [];
  if (found.some((key) => key.endsWith("At"))) errors.push(error("TIMESTAMP_CLIENT_FORBIDDEN", { fields: found }));
  if (found.includes("credential") || found.includes("secretRef")) errors.push(error("SECRET_CLIENT_FORBIDDEN", { fields: found }));
  return errors;
}

export function validateListQuery(input: unknown): ValidationResult<IntegrationListQuery> {
  const payload = isRecord(input) ? input : {};
  const errors: ApiError[] = [];

  const limit = payload.limit === undefined ? 25 : Number(payload.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push(error("INVALID_PAGINATION"));

  const status = payload.status;
  if (status !== undefined && !statusSet.has(status as IntegrationStatus)) errors.push(error("INVALID_STATUS"));

  const value: IntegrationListQuery = {
    limit,
    cursor: typeof payload.cursor === "string" ? payload.cursor : undefined,
    tenantId: typeof payload.tenantId === "string" ? payload.tenantId : undefined,
    empresaId: typeof payload.empresaId === "string" ? payload.empresaId : undefined,
    filialId: typeof payload.filialId === "string" ? payload.filialId : undefined,
    status: statusSet.has(status as IntegrationStatus) ? status as IntegrationStatus : undefined,
    search: typeof payload.search === "string" ? payload.search.trim().slice(0, 120) : undefined,
    includeArchived: payload.includeArchived === true || payload.includeArchived === "true"
  };

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

export function validateCreateApiClientRequest(input: unknown): ValidationResult<CreateApiClientRequest> {
  if (!isRecord(input)) return { ok: false, errors: [error("VALIDATION_ERROR")] };
  const errors: ApiError[] = [...validateTenantScope(input), ...rejectClientControlledFields(input)];

  if (!validateCode(input.code)) errors.push(error("INVALID_CODE"));
  if (!validateName(input.name)) errors.push(error("INVALID_NAME"));
  if (!directionSet.has(input.direction as IntegrationDirection)) errors.push(error("VALIDATION_ERROR", { field: "direction" }));
  if (!isStringArray(input.allowedScopes, 100)) errors.push(error("VALIDATION_ERROR", { field: "allowedScopes" }));
  if (!isStringArray(input.allowedOrigins, 50) || !input.allowedOrigins.every(validateHttpsUrl)) errors.push(error("INVALID_ORIGIN"));
  if (!credentialKindSet.has(input.credentialKind as CredentialKind)) errors.push(error("VALIDATION_ERROR", { field: "credentialKind" }));
  if (!isNonEmptyString(input.credentialProviderKey)) errors.push(error("VALIDATION_ERROR", { field: "credentialProviderKey" }));
  if (!validateReason(input.reason)) errors.push(error("REASON_REQUIRED"));

  const endpoint = isRecord(input.endpointVersion) ? input.endpointVersion : undefined;
  if (!endpoint || !isNonEmptyString(endpoint.version) || !validateHttpsUrl(endpoint.baseUrl)) {
    errors.push(error("VALIDATION_ERROR", { field: "endpointVersion" }));
  }
  if (endpoint && endpoint.status !== undefined && !statusSet.has(endpoint.status as IntegrationStatus)) {
    errors.push(error("INVALID_STATUS"));
  }

  if (errors.length > 0) return { ok: false, errors };

  const value: CreateApiClientRequest = {
    tenantId: String(input.tenantId),
    empresaId: typeof input.empresaId === "string" ? input.empresaId : undefined,
    filialId: typeof input.filialId === "string" ? input.filialId : undefined,
    code: String(input.code).trim(),
    name: String(input.name).trim(),
    description: typeof input.description === "string" ? input.description.trim().slice(0, 500) : undefined,
    direction: input.direction as IntegrationDirection,
    allowedScopes: (input.allowedScopes as string[]).map((item) => item.trim()),
    allowedOrigins: (input.allowedOrigins as string[]).map((item) => item.trim()),
    credentialKind: input.credentialKind as CredentialKind,
    credentialProviderKey: String(input.credentialProviderKey).trim(),
    endpointVersion: {
      version: String(endpoint!.version).trim(),
      baseUrl: String(endpoint!.baseUrl).trim(),
      openApiPath: typeof endpoint!.openApiPath === "string" ? endpoint!.openApiPath : undefined,
      status: endpoint!.status as IntegrationStatus || "active",
      publishedAt: typeof endpoint!.publishedAt === "string" ? endpoint!.publishedAt : undefined,
      deprecatedAt: typeof endpoint!.deprecatedAt === "string" ? endpoint!.deprecatedAt : undefined
    },
    reason: String(input.reason).trim()
  };

  return { ok: true, value };
}

export function validateCreateWebhookSubscriptionRequest(input: unknown): ValidationResult<CreateWebhookSubscriptionRequest> {
  if (!isRecord(input)) return { ok: false, errors: [error("VALIDATION_ERROR")] };
  const errors: ApiError[] = [...validateTenantScope(input), ...rejectClientControlledFields(input)];

  if (!validateCode(input.code)) errors.push(error("INVALID_CODE"));
  if (!validateName(input.name)) errors.push(error("INVALID_NAME"));
  if (!validateHttpsUrl(input.targetUrl)) errors.push(error("INVALID_URL"));
  if (!Array.isArray(input.events) || input.events.length === 0 || input.events.some((eventName) => !eventSet.has(eventName as WebhookEvent))) {
    errors.push(error("VALIDATION_ERROR", { field: "events" }));
  }
  if (!validateReason(input.reason)) errors.push(error("REASON_REQUIRED"));

  const retryPolicy = isRecord(input.retryPolicy) ? input.retryPolicy : {};
  const maxAttempts = retryPolicy.maxAttempts === undefined ? 5 : Number(retryPolicy.maxAttempts);
  const backoffSeconds = retryPolicy.backoffSeconds === undefined ? 60 : Number(retryPolicy.backoffSeconds);
  const deadLetterAfterAttempts = retryPolicy.deadLetterAfterAttempts === undefined ? 5 : Number(retryPolicy.deadLetterAfterAttempts);
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) errors.push(error("VALIDATION_ERROR", { field: "retryPolicy.maxAttempts" }));
  if (!Number.isInteger(backoffSeconds) || backoffSeconds < 5 || backoffSeconds > 3600) errors.push(error("VALIDATION_ERROR", { field: "retryPolicy.backoffSeconds" }));
  if (!Number.isInteger(deadLetterAfterAttempts) || deadLetterAfterAttempts < 1 || deadLetterAfterAttempts > 20) errors.push(error("VALIDATION_ERROR", { field: "retryPolicy.deadLetterAfterAttempts" }));

  if (errors.length > 0) return { ok: false, errors };

  const value: CreateWebhookSubscriptionRequest = {
    tenantId: String(input.tenantId),
    empresaId: typeof input.empresaId === "string" ? input.empresaId : undefined,
    filialId: typeof input.filialId === "string" ? input.filialId : undefined,
    code: String(input.code).trim(),
    name: String(input.name).trim(),
    targetUrl: String(input.targetUrl).trim(),
    events: input.events as WebhookEvent[],
    retryPolicy: { maxAttempts, backoffSeconds, deadLetterAfterAttempts },
    reason: String(input.reason).trim()
  };

  return { ok: true, value };
}

export function validateUpdateIntegrationStatusRequest(input: unknown): ValidationResult<UpdateIntegrationStatusRequest> {
  if (!isRecord(input)) return { ok: false, errors: [error("VALIDATION_ERROR")] };
  const errors: ApiError[] = [...validateTenantScope(input), ...rejectClientControlledFields(input)];

  if (input.targetType !== "api_client" && input.targetType !== "webhook_subscription") errors.push(error("VALIDATION_ERROR", { field: "targetType" }));
  if (!isNonEmptyString(input.targetId)) errors.push(error("VALIDATION_ERROR", { field: "targetId" }));
  if (input.status !== "active" && input.status !== "suspended" && input.status !== "archived") errors.push(error("INVALID_STATUS"));
  if (!validateReason(input.reason)) errors.push(error("REASON_REQUIRED"));
  if (input.confirmationText !== input.targetId) errors.push(error("CONFIRMATION_MISMATCH"));

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      tenantId: String(input.tenantId),
      empresaId: typeof input.empresaId === "string" ? input.empresaId : undefined,
      filialId: typeof input.filialId === "string" ? input.filialId : undefined,
      targetType: input.targetType as "api_client" | "webhook_subscription",
      targetId: String(input.targetId),
      status: input.status as Exclude<IntegrationStatus, "pending_review">,
      reason: String(input.reason).trim(),
      confirmationText: String(input.confirmationText)
    }
  };
}

export function buildEnvelope<T>(requestId: string, data: T, meta?: Partial<ResponseMeta>): Envelope<T> {
  return { ok: true, data, meta: { requestId, ...meta } };
}

export function buildErrorEnvelope(requestId: string, apiError: ApiError, meta?: Partial<ResponseMeta>): Envelope<never> {
  return { ok: false, error: apiError, meta: { requestId, ...meta } };
}

export function firstValidationError(errors: ApiError[] | undefined): ApiError {
  return errors && errors.length > 0 ? errors[0] : error("VALIDATION_ERROR");
}
