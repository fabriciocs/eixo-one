import { isValidCnpj, normalizeCnpj } from "../backend/src/common/security/cnpj";

describe("CNPJ validation", () => {
  it("normalizes punctuation", () => {
    expect(normalizeCnpj("11.222.333/0001-81")).toBe("11222333000181");
  });

  it("accepts valid CNPJ", () => {
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("rejects invalid CNPJ", () => {
    expect(isValidCnpj("11222333000180")).toBe(false);
  });
});
