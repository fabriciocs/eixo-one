import type {
  ApiClient,
  ApiError,
  Envelope,
  IntegrationAuditEvent,
  IntegrationListQuery,
  IntegrationListResponse,
  ResponseMeta,
  TenantScope,
  WebhookSubscription
} from "../../../../../../packages/sharedcontracts/src";

export interface AuthContext {
  uid: string;
  tenantId: string;
  empresaIds?: string[];
  filialIds?: string[];
  roleKeys: string[];
  permissionKeys: string[];
  moduleKeys: string[];
  authTime?: number;
  mfaVerified?: boolean;
}

export interface RequestContext {
  requestId: string;
  actor: AuthContext;
  ip?: string;
  userAgent?: string;
  now: string;
}

export interface RouteRequest<TBody = unknown, TQuery = unknown, TParams = unknown> {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  headers: Record<string, string | undefined>;
  auth?: AuthContext;
  ip?: string;
}

export interface RouteReply {
  status(code: number): RouteReply;
  send(payload: Envelope<unknown>): void;
}

export type RouteHandler<TBody = unknown, TQuery = unknown, TParams = unknown> =
  (request: RouteRequest<TBody, TQuery, TParams>, reply: RouteReply) => Promise<void>;

export interface RouteRegistry {
  get(path: string, handler: RouteHandler): void;
  post(path: string, handler: RouteHandler): void;
  patch(path: string, handler: RouteHandler): void;
}

export interface IntegrationRepository {
  list(scope: TenantScope, query: IntegrationListQuery): Promise<IntegrationListResponse>;
  findApiClient(scope: TenantScope, id: string): Promise<ApiClient | undefined>;
  findWebhook(scope: TenantScope, id: string): Promise<WebhookSubscription | undefined>;
  createApiClient(record: ApiClient): Promise<ApiClient>;
  createWebhook(record: WebhookSubscription): Promise<WebhookSubscription>;
  updateApiClient(record: ApiClient): Promise<ApiClient>;
  updateWebhook(record: WebhookSubscription): Promise<WebhookSubscription>;
  appendAudit(event: IntegrationAuditEvent): Promise<void>;
  listAudit(scope: TenantScope, targetId?: string): Promise<IntegrationAuditEvent[]>;
  getIdempotency(key: string): Promise<IdempotencyRecord | undefined>;
  putIdempotency(record: IdempotencyRecord): Promise<void>;
}

export interface IdempotencyRecord {
  key: string;
  tenantId: string;
  method: string;
  path: string;
  bodyHash: string;
  response: Envelope<unknown>;
  expiresAt: string;
  createdAt: string;
}

export interface IntegrationServiceDeps {
  repository: IntegrationRepository;
  generateId?: (prefix: string) => string;
  secretRefFactory?: (kind: string, tenantId: string, code: string) => string;
}

export class Fg008HttpError extends Error {
  statusCode: number;
  apiError: ApiError;

  constructor(statusCode: number, apiError: ApiError) {
    super(apiError.message);
    this.name = "Fg008HttpError";
    this.statusCode = statusCode;
    this.apiError = apiError;
  }
}

export function forbidden(code: string, message: string): Fg008HttpError {
  return new Fg008HttpError(403, { code, message });
}

export function validationError(error: ApiError): Fg008HttpError {
  return new Fg008HttpError(400, error);
}

export function notFound(message = "Recurso não encontrado."): Fg008HttpError {
  return new Fg008HttpError(404, { code: "NOT_FOUND", message });
}

export function conflict(message: string, details?: unknown): Fg008HttpError {
  return new Fg008HttpError(409, { code: "CONFLICT", message, details });
}

export function toEnvelopeError(requestId: string, error: unknown, meta?: Partial<ResponseMeta>): { statusCode: number; envelope: Envelope<never> } {
  if (error instanceof Fg008HttpError) {
    return {
      statusCode: error.statusCode,
      envelope: { ok: false, error: error.apiError, meta: { requestId, ...meta } }
    };
  }

  return {
    statusCode: 500,
    envelope: {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Não foi possível concluir a operação." },
      meta: { requestId, ...meta }
    }
  };
}
