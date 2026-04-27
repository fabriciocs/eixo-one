import { FormEvent, useState } from "react";
import { createSupplier } from "../../services/suppliersApi";

export function SupplierForm() {
  const [corporateName, setCorporateName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFeedback("");

    try {
      await createSupplier({ corporateName, cnpj, email });
      setFeedback("Fornecedor cadastrado com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Erro inesperado.");
    }
  }

  return (
    <form onSubmit={onSubmit} aria-label="Cadastro de fornecedor">
      <h1>Cadastro de fornecedor</h1>

      <label htmlFor="corporateName">Razão social</label>
      <input
        id="corporateName"
        required
        value={corporateName}
        onChange={(event) => setCorporateName(event.target.value)}
      />

      <label htmlFor="cnpj">CNPJ</label>
      <input
        id="cnpj"
        required
        inputMode="numeric"
        aria-describedby="cnpj-help"
        value={cnpj}
        onChange={(event) => setCnpj(event.target.value)}
      />
      <small id="cnpj-help">Informe um CNPJ válido, sem necessidade de pontuação.</small>

      <label htmlFor="email">E-mail financeiro</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <button type="submit">Salvar fornecedor</button>
      {feedback && <p role="status">{feedback}</p>}
    </form>
  );
}
