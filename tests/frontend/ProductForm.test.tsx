import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductForm } from '../../frontend/src/pages/products/components/ProductForm';

describe('FG-012 ProductForm', () => {
  it('renders accessible product form', () => {
    render(<ProductForm empresaId="empresa-1" canCreate />);
    expect(screen.getByRole('form', { name: /cadastro de produto/i })).toBeInTheDocument();
    expect(screen.getByText('Dados principais')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar produto/i })).toBeEnabled();
  });

  it('disables submit when user cannot create', () => {
    render(<ProductForm empresaId="empresa-1" canCreate={false} />);
    expect(screen.getByRole('button', { name: /salvar produto/i })).toBeDisabled();
  });
});
