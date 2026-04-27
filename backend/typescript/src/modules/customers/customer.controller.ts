import { CustomerService } from "./customer.service";
import { CustomerContext, DomainError } from "./customer.types";
import { assertAllowedKeys } from "./customer.validators";

const MUTABLE_KEYS = [
  "empresaId",
  "filialId",
  "codigo",
  "tipoPessoa",
  "nome",
  "nomeFantasia",
  "cpfCnpj",
  "documentoEstrangeiro",
  "email",
  "telefone",
  "limiteCreditoCentavos",
  "vendedorResponsavelId",
  "status",
  "tags",
  "addresses",
  "contacts",
  "observacao",
];

export interface HttpRequestLike {
  params: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  headers: Record<string, string | undefined>;
  body?: unknown;
  context: CustomerContext;
}

export interface HttpResponseLike {
  status(code: number): HttpResponseLike;
  json(value: unknown): void;
  send(value?: unknown): void;
}

export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  list = async (req: HttpRequestLike, res: HttpResponseLike): Promise<void> => {
    const result = await this.service.list(req.context, {
      empresaId: String(req.query.empresaId),
      filialId: req.query.filialId,
      q: req.query.q,
      status: req.query.status as never,
      tipoPessoa: req.query.tipoPessoa as never,
      tag: req.query.tag,
      vendedorResponsavelId: req.query.vendedorResponsavelId,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      cursor: req.query.cursor,
    });
    res.status(200).json(result);
  };

  get = async (req: HttpRequestLike, res: HttpResponseLike): Promise<void> => {
    const customer = await this.service.get(req.context, String(req.params.customerId));
    res.status(200).json(customer);
  };

  create = async (req: HttpRequestLike, res: HttpResponseLike): Promise<void> => {
    const body = asRecord(req.body);
    assertAllowedKeys(body, MUTABLE_KEYS);
    const customer = await this.service.create(req.context, body as never);
    res.status(201).json(customer);
  };

  update = async (req: HttpRequestLike, res: HttpResponseLike): Promise<void> => {
    const body = asRecord(req.body);
    assertAllowedKeys(body, MUTABLE_KEYS);
    const expectedVersion = parseVersion(req.headers["if-match"]);
    const customer = await this.service.update(req.context, String(req.params.customerId), expectedVersion, body as never);
    res.status(200).json(customer);
  };

  changeStatus = async (req: HttpRequestLike, res: HttpResponseLike): Promise<void> => {
    const body = asRecord(req.body);
    assertAllowedKeys(body, ["status", "reason"]);
    const expectedVersion = parseVersion(req.headers["if-match"]);
    const customer = await this.service.changeStatus(
      req.context,
      String(req.params.customerId),
      expectedVersion,
      String(body.status) as never,
      String(body.reason),
    );
    res.status(200).json(customer);
  };

  softDelete = async (req: HttpRequestLike, res: HttpResponseLike): Promise<void> => {
    const expectedVersion = parseVersion(req.headers["if-match"]);
    await this.service.softDelete(req.context, String(req.params.customerId), expectedVersion);
    res.status(204).send();
  };
}

export function handleDomainError(error: unknown, res: HttpResponseLike, correlationId?: string): void {
  if (error instanceof DomainError) {
    res.status(error.status).json({
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
      correlationId,
    });
    return;
  }

  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Erro interno ao processar a solicitação.",
    correlationId,
  });
}

function parseVersion(value?: string): number {
  const cleaned = String(value ?? "").replace(/^W\//, "").replaceAll('"', "");
  const version = Number(cleaned);
  if (!Number.isInteger(version) || version < 1) {
    throw new DomainError("VALIDATION_ERROR", "Header If-Match inválido.", 422, [
      { field: "If-Match", message: "Informe a versão atual do registro." },
    ]);
  }
  return version;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DomainError("VALIDATION_ERROR", "Payload inválido.", 422);
  }
  return value as Record<string, unknown>;
}
