import { InMemoryMasterDataRepository } from "../repository";
import { MasterDataService, AuditWriter } from "../service";
import { MasterDataContext } from "../domain";

const auditEvents: unknown[] = [];
const audit: AuditWriter = { append: async (event) => { auditEvents.push(event); } };

const ctx: MasterDataContext = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  empresaId: "22222222-2222-4222-8222-222222222222",
  actorId: "33333333-3333-4333-8333-333333333333",
  roles: [],
  permissions: ["master-data.read","master-data.customer.create","master-data.product.create","master-data.customer.update","master-data.customer.block"],
  correlationId: "test-correlation"
};

test("cria cliente normalizado com auditoria", async () => {
  const service = new MasterDataService(new InMemoryMasterDataRepository(), audit);
  const saved = await service.create(ctx, {
    kind: "customer",
    codigo: " cli-001 ",
    nome: " Cliente Exemplo ",
    status: "active",
    tipoPessoa: "PJ",
    documento: "12.345.678/0001-90",
    tags: ["VIP"],
    enderecos: [],
    contatos: [],
    consentimentos: { marketing: false, compartilhamento: false }
  } as any);
  expect(saved.codigo).toBe("CLI-001");
  expect(saved.documento).toBe("12345678000190");
  expect(auditEvents.length).toBeGreaterThan(0);
});

test("nega produto com NCM inválido", async () => {
  const service = new MasterDataService(new InMemoryMasterDataRepository(), audit);
  await expect(service.create(ctx, {
    kind: "product",
    codigo: "P1",
    nome: "Produto",
    status: "active",
    sku: "sku-1",
    descricao: "Produto",
    unidade: "UN",
    precoVenda: 10,
    ncm: "123",
    controlaEstoque: true,
    controlaLote: false,
    controlaValidade: false,
    imagens: [],
    composto: false,
    tags: []
  } as any)).rejects.toThrow("Payload inválido");
});

test("bloqueia vazamento entre tenants pela listagem contextual", async () => {
  const repo = new InMemoryMasterDataRepository();
  const service = new MasterDataService(repo, audit);
  await service.create(ctx, {
    kind: "customer", codigo: "C1", nome: "Cliente 1", status: "active", tipoPessoa: "PF", documento: "12345678901", tags: [], enderecos: [], contatos: [], consentimentos: { marketing: false, compartilhamento: false }
  } as any);
  const other = { ...ctx, tenantId: "44444444-4444-4444-8444-444444444444" };
  await expect(service.list(other, { kind: "customer" })).resolves.toMatchObject({ total: 0 });
});
