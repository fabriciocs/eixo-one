import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { BaseGovernanceService } from "../../application/base-governance.service";
import { InMemoryBaseGovernanceRepository } from "../../infrastructure/in-memory-base-governance.repository";

const repository = new InMemoryBaseGovernanceRepository();
const service = new BaseGovernanceService(repository);

const roleBodySchema = z.object({
  key: z.string().regex(/^[a-z0-9_.-]+$/),
  name: z.string().min(3).max(120),
  permissionKeys: z.array(z.string().min(1)).min(1),
  companyIds: z.array(z.string()).default([]),
  establishmentIds: z.array(z.string()).default([]),
  status: z.enum(["draft", "active", "inactive"]).default("draft"),
});

const customerBodySchema = z.object({
  companyId: z.string().min(1),
  type: z.enum(["person", "company"]),
  document: z.string().min(11).max(18),
  legalName: z.string().min(2).max(160),
  status: z.enum(["draft", "active", "blocked", "inactive"]).default("draft"),
  creditLimit: z.number().nonnegative().default(0),
});

function subjectFromRequest(request: FastifyRequest) {
  const auth = (request as any).auth;
  if (!auth) throw new Error("UNAUTHENTICATED");
  return {
    userId: auth.userId,
    tenantId: auth.tenantId,
    roleKeys: auth.roleKeys ?? [],
    permissionKeys: auth.permissionKeys ?? [],
    mfaVerified: auth.mfaVerified ?? false,
  };
}

function correlationId(request: FastifyRequest): string {
  return String(request.headers["x-correlation-id"] ?? crypto.randomUUID());
}

export async function registerBaseGovernanceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/base-governance/roles", async (request, reply) => {
    const roles = await service.listRoles(subjectFromRequest(request));
    return reply.send({ ok: true, data: roles });
  });

  app.post("/v1/base-governance/roles", async (request, reply) => {
    const input = roleBodySchema.parse(request.body);
    const role = await service.createRole(subjectFromRequest(request), input, correlationId(request));
    return reply.code(201).send({ ok: true, data: role });
  });

  app.patch("/v1/base-governance/roles/:roleId", async (request, reply) => {
    const params = z.object({ roleId: z.string().min(1) }).parse(request.params);
    const body = roleBodySchema.partial().extend({ expectedVersion: z.number().int().nonnegative() }).parse(request.body);
    const { expectedVersion, ...patch } = body;
    const role = await service.updateRole(subjectFromRequest(request), params.roleId, expectedVersion, patch, correlationId(request));
    return reply.send({ ok: true, data: role });
  });

  app.get("/v1/customers", async (request, reply) => {
    const query = z.object({ companyId: z.string().optional() }).parse(request.query);
    const customers = await service.listCustomers(subjectFromRequest(request), query.companyId);
    return reply.send({ ok: true, data: customers });
  });

  app.post("/v1/customers", async (request, reply) => {
    const input = customerBodySchema.parse(request.body);
    const customer = await service.createCustomer(subjectFromRequest(request), input, correlationId(request));
    return reply.code(201).send({ ok: true, data: customer });
  });

  app.patch("/v1/customers/:customerId", async (request, reply) => {
    const params = z.object({ customerId: z.string().min(1) }).parse(request.params);
    const body = customerBodySchema.partial().extend({ expectedVersion: z.number().int().nonnegative() }).parse(request.body);
    const { expectedVersion, ...patch } = body;
    const customer = await service.updateCustomer(subjectFromRequest(request), params.customerId, expectedVersion, patch, correlationId(request));
    return reply.send({ ok: true, data: customer });
  });

  app.get("/v1/audit-trail", async (request, reply) => {
    const query = z.object({ resourceType: z.string().optional(), resourceId: z.string().optional() }).parse(request.query);
    const events = await service.listAudit(subjectFromRequest(request), query.resourceType, query.resourceId);
    return reply.send({ ok: true, data: events });
  });
}
