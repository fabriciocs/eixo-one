import { render, screen, waitFor } from "@testing-library/react";
import { MasterDataPage } from "../MasterDataPage";

test("exibe estado vazio", async () => {
  render(<MasterDataPage kind="customer" canCreate canEdit service={{ list: async () => ({ items: [], total: 0 }) }} />);
  await waitFor(() => expect(screen.getByText("Nenhum registro encontrado para os filtros atuais.")).toBeInTheDocument());
});

test("oculta ação de criação sem permissão", () => {
  render(<MasterDataPage kind="product" canCreate={false} canEdit={false} service={{ list: async () => ({ items: [], total: 0 }) }} />);
  expect(screen.queryByText("Novo cadastro")).not.toBeInTheDocument();
});
