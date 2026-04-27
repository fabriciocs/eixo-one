import 'package:flutter/material.dart';

import '../data/customers_repository.dart';
import '../domain/customer.dart';
import 'customer_form_page.dart';

class CustomersListPage extends StatefulWidget {
  const CustomersListPage({
    super.key,
    required this.repository,
    required this.empresaId,
    this.filialId,
    this.canCreate = false,
    this.canUpdate = false,
    this.canDelete = false,
  });

  final CustomersRepository repository;
  final String empresaId;
  final String? filialId;
  final bool canCreate;
  final bool canUpdate;
  final bool canDelete;

  @override
  State<CustomersListPage> createState() => _CustomersListPageState();
}

class _CustomersListPageState extends State<CustomersListPage> {
  final TextEditingController _searchController = TextEditingController();
  CustomerStatus? _status;
  CustomerPersonType? _tipoPessoa;
  Future<CustomerPage>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _load() {
    setState(() {
      _future = widget.repository.list(
        CustomerFilters(
          empresaId: widget.empresaId,
          filialId: widget.filialId,
          query: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
          status: _status,
          tipoPessoa: _tipoPessoa,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes'),
        actions: [
          if (widget.canCreate)
            FilledButton.icon(
              onPressed: () async {
                final saved = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => CustomerFormPage(
                      repository: widget.repository,
                      empresaId: widget.empresaId,
                      filialId: widget.filialId,
                    ),
                  ),
                );
                if (saved == true) _load();
              },
              icon: const Icon(Icons.add),
              label: const Text('Novo cliente'),
            ),
          const SizedBox(width: 12),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _load(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _ContextBanner(empresaId: widget.empresaId, filialId: widget.filialId),
            const SizedBox(height: 12),
            _buildFilters(context),
            const SizedBox(height: 12),
            FutureBuilder<CustomerPage>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const _CustomerSkeletonList();
                }

                if (snapshot.hasError) {
                  return _ErrorState(
                    message: 'Não foi possível carregar clientes.',
                    onRetry: _load,
                  );
                }

                final items = snapshot.data?.items ?? const <Customer>[];
                if (items.isEmpty) {
                  return _EmptyState(canCreate: widget.canCreate);
                }

                return Column(
                  children: [
                    for (final customer in items)
                      _CustomerCard(
                        customer: customer,
                        canUpdate: widget.canUpdate,
                        canDelete: widget.canDelete,
                        onChanged: _load,
                        repository: widget.repository,
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth > 720;
            final children = [
              TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  labelText: 'Buscar',
                  hintText: 'Nome, documento, e-mail, telefone, código ou tag',
                  prefixIcon: Icon(Icons.search),
                ),
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _load(),
              ),
              DropdownButtonFormField<CustomerStatus?>(
                value: _status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: const [
                  DropdownMenuItem(value: null, child: Text('Todos')),
                  DropdownMenuItem(value: CustomerStatus.rascunho, child: Text('Rascunho')),
                  DropdownMenuItem(value: CustomerStatus.ativo, child: Text('Ativo')),
                  DropdownMenuItem(value: CustomerStatus.bloqueado, child: Text('Bloqueado')),
                  DropdownMenuItem(value: CustomerStatus.inativo, child: Text('Inativo')),
                ],
                onChanged: (value) {
                  _status = value;
                  _load();
                },
              ),
              DropdownButtonFormField<CustomerPersonType?>(
                value: _tipoPessoa,
                decoration: const InputDecoration(labelText: 'Tipo'),
                items: const [
                  DropdownMenuItem(value: null, child: Text('Todos')),
                  DropdownMenuItem(value: CustomerPersonType.pf, child: Text('PF')),
                  DropdownMenuItem(value: CustomerPersonType.pj, child: Text('PJ')),
                  DropdownMenuItem(value: CustomerPersonType.estrangeiro, child: Text('Estrangeiro')),
                ],
                onChanged: (value) {
                  _tipoPessoa = value;
                  _load();
                },
              ),
              OutlinedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.tune),
                label: const Text('Aplicar'),
              ),
            ];

            if (wide) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: children.map((child) => Expanded(child: Padding(padding: const EdgeInsets.all(4), child: child))).toList(),
              );
            }

            return Column(
              children: children.map((child) => Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: child)).toList(),
            );
          },
        ),
      ),
    );
  }
}

class _ContextBanner extends StatelessWidget {
  const _ContextBanner({required this.empresaId, this.filialId});

  final String empresaId;
  final String? filialId;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Contexto operacional ativo',
      child: Card(
        child: ListTile(
          leading: const Icon(Icons.business),
          title: const Text('Contexto ativo'),
          subtitle: Text('Empresa: $empresaId${filialId == null ? '' : ' • Filial: $filialId'}'),
        ),
      ),
    );
  }
}

class _CustomerCard extends StatelessWidget {
  const _CustomerCard({
    required this.customer,
    required this.repository,
    required this.canUpdate,
    required this.canDelete,
    required this.onChanged,
  });

  final Customer customer;
  final CustomersRepository repository;
  final bool canUpdate;
  final bool canDelete;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final statusColor = customer.status == CustomerStatus.ativo
        ? Theme.of(context).colorScheme.primary
        : customer.status == CustomerStatus.bloqueado
            ? Theme.of(context).colorScheme.error
            : Theme.of(context).colorScheme.secondary;

    return Card(
      child: ListTile(
        title: Text(customer.nome),
        subtitle: Text([
          personTypeToApi(customer.tipoPessoa),
          if (customer.cpfCnpj != null) customer.cpfCnpj!,
          'Crédito: ${(customer.limiteCreditoCentavos / 100).toStringAsFixed(2)}',
        ].join(' • ')),
        leading: CircleAvatar(child: Text(customer.nome.characters.first.toUpperCase())),
        trailing: Wrap(
          spacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Chip(
              label: Text(statusToApi(customer.status)),
              side: BorderSide(color: statusColor),
            ),
            if (canUpdate)
              IconButton(
                tooltip: 'Editar cliente',
                icon: const Icon(Icons.edit),
                onPressed: () async {
                  final saved = await Navigator.of(context).push<bool>(
                    MaterialPageRoute(
                      builder: (_) => CustomerFormPage(
                        repository: repository,
                        empresaId: customer.empresaId,
                        filialId: customer.filialId,
                        existingCustomer: customer,
                      ),
                    ),
                  );
                  if (saved == true) onChanged();
                },
              ),
            if (canDelete)
              IconButton(
                tooltip: 'Excluir cliente',
                icon: const Icon(Icons.delete_outline),
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Excluir cliente?'),
                      content: const Text('A exclusão é lógica e preserva histórico/auditoria.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
                        FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Excluir')),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await repository.softDelete(customer.id, customer.version);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cliente excluído.')));
                    }
                    onChanged();
                  }
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _CustomerSkeletonList extends StatelessWidget {
  const _CustomerSkeletonList();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        5,
        (_) => const Card(
          child: ListTile(
            leading: CircleAvatar(),
            title: LinearProgressIndicator(),
            subtitle: Padding(
              padding: EdgeInsets.only(top: 12),
              child: LinearProgressIndicator(),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.canCreate});

  final bool canCreate;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            const Icon(Icons.people_outline, size: 48),
            const SizedBox(height: 12),
            const Text('Nenhum cliente encontrado.'),
            if (canCreate) const Text('Crie um cliente para iniciar vendas, financeiro e CRM.'),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.error_outline),
        title: Text(message),
        subtitle: const Text('Verifique a conexão ou tente novamente.'),
        trailing: OutlinedButton(onPressed: onRetry, child: const Text('Tentar novamente')),
      ),
    );
  }
}
