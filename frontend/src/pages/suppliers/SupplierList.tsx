import { useEffect, useState } from "react";
import { listSuppliers } from "../../services/suppliersApi";

interface Supplier {
  id: string;
  corporateName: string;
  cnpj: string;
  status: string;
}

export function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listSuppliers().then(setSuppliers).catch(() => setSuppliers([]));
  }, []);

  const filtered = suppliers.filter((supplier) =>
    `${supplier.corporateName} ${supplier.cnpj} ${supplier.status}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section aria-label="Fornecedores">
      <h1>Fornecedores</h1>
      <label htmlFor="supplier-search">Buscar fornecedor</label>
      <input
        id="supplier-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Razão social, CNPJ ou status"
      />

      <table>
        <caption>Lista de fornecedores cadastrados</caption>
        <thead>
          <tr>
            <th>Razão social</th>
            <th>CNPJ</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((supplier) => (
            <tr key={supplier.id}>
              <td>{supplier.corporateName}</td>
              <td>{supplier.cnpj}</td>
              <td>{supplier.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
