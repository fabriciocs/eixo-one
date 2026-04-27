import { SuppliersService } from "../backend/src/modules/suppliers/suppliers.service";

describe("SuppliersService", () => {
  it("creates supplier and audit log", () => {
    const service = new SuppliersService();
    const supplier = service.create(
      {
        corporateName: "Fornecedor Teste LTDA",
        cnpj: "11222333000181",
        email: "contato@fornecedor.com",
        address: {
          zipCode: "01001000",
          street: "Praça da Sé",
          number: "100",
          city: "São Paulo",
          state: "SP"
        }
      },
      "00000000-0000-0000-0000-000000000001"
    );

    expect(supplier.status).toBe("pending");
    expect(service.getAuditLogs(supplier.id)).toHaveLength(1);
  });

  it("blocks duplicated CNPJ", () => {
    const service = new SuppliersService();
    const dto = {
      corporateName: "Fornecedor Teste LTDA",
      cnpj: "11222333000181",
      address: {
        zipCode: "01001000",
        street: "Praça da Sé",
        number: "100",
        city: "São Paulo",
        state: "SP"
      }
    };

    service.create(dto, "user-1");
    expect(() => service.create(dto, "user-1")).toThrow("Já existe fornecedor cadastrado com este CNPJ.");
  });
});
