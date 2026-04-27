export interface SupplierPayload {
  corporateName: string;
  tradeName?: string;
  cnpj: string;
  email?: string;
  phone?: string;
}

export async function createSupplier(payload: SupplierPayload) {
  const response = await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro ao cadastrar fornecedor." }));
    throw new Error(error.message);
  }

  return response.json();
}

export async function listSuppliers() {
  const response = await fetch("/api/suppliers", { credentials: "include" });
  if (!response.ok) throw new Error("Erro ao listar fornecedores.");
  return response.json();
}
