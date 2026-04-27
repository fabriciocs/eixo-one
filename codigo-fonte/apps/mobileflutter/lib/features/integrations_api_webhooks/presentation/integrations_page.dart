import 'package:flutter/material.dart';

import '../application/integrations_controller.dart';
import '../models/integration_models.dart';

class IntegrationsApiWebhooksPage extends StatefulWidget {
  const IntegrationsApiWebhooksPage({
    super.key,
    required this.controller,
  });

  final IntegrationsController controller;

  @override
  State<IntegrationsApiWebhooksPage> createState() => _IntegrationsApiWebhooksPageState();
}

class _IntegrationsApiWebhooksPageState extends State<IntegrationsApiWebhooksPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    widget.controller.load().then((_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    await widget.controller.load(search: _searchController.text);
    if (mounted) setState(() {});
  }

  Future<void> _confirmCriticalAction(IntegrationSummary item, IntegrationStatus nextStatus) async {
    final reasonController = TextEditingController();
    final confirmationController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(nextStatus == IntegrationStatus.suspended ? 'Suspender integração' : 'Reativar integração'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Informe a justificativa e digite o ID para confirmar: ${item.id}'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Justificativa',
                helperText: 'Obrigatória para auditoria',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: confirmationController,
              decoration: const InputDecoration(labelText: 'Confirmação textual'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Confirmar')),
        ],
      ),
    );

    if (confirmed != true) return;

    final reason = reasonController.text.trim();
    final confirmation = confirmationController.text.trim();
    if (reason.length < 10 || confirmation != item.id) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Justificativa ou confirmação inválida.')),
      );
      return;
    }

    final key = 'fg008-${DateTime.now().microsecondsSinceEpoch}-${item.id}';
    if (nextStatus == IntegrationStatus.suspended) {
      await widget.controller.suspend(item, reason, key);
    } else {
      await widget.controller.reactivate(item, reason, key);
    }

    if (!mounted) return;
    setState(() {});
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Ação registrada com auditoria.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.controller.state;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Integrações, API e webhooks'),
        actions: [
          IconButton(
            tooltip: 'Atualizar',
            onPressed: _reload,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 840;
            return Padding(
              padding: EdgeInsets.all(isWide ? 24 : 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ScopeBanner(scope: state.scope),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchController,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _reload(),
                    decoration: InputDecoration(
                      labelText: 'Buscar integração',
                      hintText: 'Código, nome ou descrição',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: IconButton(
                        tooltip: 'Buscar',
                        onPressed: _reload,
                        icon: const Icon(Icons.arrow_forward),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: _buildContent(state, isWide),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: state.canManage
          ? FloatingActionButton.extended(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Criação de integração deve abrir formulário versionado.')),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Nova integração'),
            )
          : null,
    );
  }

  Widget _buildContent(IntegrationsState state, bool isWide) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null) {
      return Center(
        child: Semantics(
          liveRegion: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(state.errorMessage!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton(onPressed: _reload, child: const Text('Tentar novamente')),
            ],
          ),
        ),
      );
    }

    if (state.isEmpty) {
      return const Center(
        child: Text('Nenhuma integração encontrada para o contexto selecionado.'),
      );
    }

    return GridView.builder(
      itemCount: state.items.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isWide ? 2 : 1,
        childAspectRatio: isWide ? 3.4 : 2.6,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemBuilder: (context, index) {
        final item = state.items[index];
        return _IntegrationCard(
          item: item,
          canManage: state.canManage,
          onSuspend: () => _confirmCriticalAction(item, IntegrationStatus.suspended),
          onReactivate: () => _confirmCriticalAction(item, IntegrationStatus.active),
        );
      },
    );
  }
}

class _ScopeBanner extends StatelessWidget {
  const _ScopeBanner({required this.scope});

  final IntegrationScope scope;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Contexto operacional ativo',
      child: Card(
        child: ListTile(
          leading: const Icon(Icons.business),
          title: Text('Tenant ${scope.tenantId}'),
          subtitle: Text('Empresa ${scope.empresaId ?? 'todas'} · Filial ${scope.filialId ?? 'todas'}'),
        ),
      ),
    );
  }
}

class _IntegrationCard extends StatelessWidget {
  const _IntegrationCard({
    required this.item,
    required this.canManage,
    required this.onSuspend,
    required this.onReactivate,
  });

  final IntegrationSummary item;
  final bool canManage;
  final VoidCallback onSuspend;
  final VoidCallback onReactivate;

  @override
  Widget build(BuildContext context) {
    final isSuspended = item.status == IntegrationStatus.suspended;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Semantics(
          button: true,
          label: '${item.name}, status ${statusLabel(item.status)}',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                children: [
                  Text(item.name, style: Theme.of(context).textTheme.titleMedium),
                  Chip(label: Text(statusLabel(item.status))),
                ],
              ),
              const SizedBox(height: 8),
              Text(item.code, style: Theme.of(context).textTheme.bodyMedium),
              if (item.description != null) ...[
                const SizedBox(height: 8),
                Text(item.description!, maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
              const Spacer(),
              Row(
                children: [
                  TextButton(onPressed: () {}, child: const Text('Detalhes')),
                  const Spacer(),
                  if (canManage && !isSuspended)
                    TextButton(onPressed: onSuspend, child: const Text('Suspender')),
                  if (canManage && isSuspended)
                    FilledButton(onPressed: onReactivate, child: const Text('Reativar')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
