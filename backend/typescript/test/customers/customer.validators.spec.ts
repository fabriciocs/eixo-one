import { describe, expect, it } from "vitest";
import {
  isValidCnpj,
  isValidCpf,
  maskDocument,
  onlyDigits,
  validateCustomerInput,
} from "../../src/modules/customers/customer.validators";

describe("FG-010 customer validators", () => {
  it("normaliza documento", () => {
    expect(onlyDigits("123.456.789-09")).toBe("12345678909");
  });

  it("valida CPF verdadeiro", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("rejeita CPF inválido", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("valida CNPJ verdadeiro", () => {
    expect(isValidCnpj("04.252.011/0001-10")).toBe(true);
  });

  it("rejeita CNPJ inválido", () => {
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });

  it("mascara documento", () => {
    expect(maskDocument("52998224725")).toBe("529.***.***-25");
    expect(maskDocument("04252011000110")).toBe("04.***.***/****-10");
  });

  it("valida cliente PJ mínimo", () => {
    const result = validateCustomerInput({
      empresaId: "empresa-123",
      tipoPessoa: "PJ",
      nome: "Cliente Exemplo Ltda",
      cpfCnpj: "04.252.011/0001-10",
      limiteCreditoCentavos: 10000,
      addresses: [{ label: "Fiscal", city: "São Paulo", country: "BR", isPrimary: true }],
      contacts: [{ name: "Maria Cliente", email: "maria@example.com", isPrimary: true }],
    });

    expect(result.cpfCnpjNormalizado).toBe("04252011000110");
    expect(result.nomeNormalizado).toBe("cliente exemplo ltda");
  });

  it("rejeita duplicidade de endereço principal", () => {
    expect(() =>
      validateCustomerInput({
        empresaId: "empresa-123",
        tipoPessoa: "PF",
        nome: "João Cliente",
        cpfCnpj: "529.982.247-25",
        addresses: [
          { label: "Casa", city: "Curitiba", country: "BR", isPrimary: true },
          { label: "Entrega", city: "Curitiba", country: "BR", isPrimary: true },
        ],
      }),
    ).toThrow(/Somente um item principal/);
  });

  it("rejeita limite de crédito negativo", () => {
    expect(() =>
      validateCustomerInput({
        empresaId: "empresa-123",
        tipoPessoa: "PF",
        nome: "João Cliente",
        cpfCnpj: "529.982.247-25",
        limiteCreditoCentavos: -1,
      }),
    ).toThrow(/Limite de crédito/);
  });
});
