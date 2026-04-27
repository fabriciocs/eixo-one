import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/empty_state.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/filter_bar.dart';
import '../../../../design_system/components/loading_state.dart';
import '../../../../design_system/components/network_status_banner.dart';
import '../../../../design_system/components/status_badge.dart';
import '../../../../design_system/tokens/app_colors.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';
import '../../../base_governance/models/base_governance_models.dart';
import '../../../base_governance/repositories/base_governance_repository.dart';

class AuditPage extends ConsumerStatefulWidget {
  const AuditPage({super.key});

  @override
  ConsumerState<AuditPage> createState() => _AuditPageState();
}

class _AuditPageState extends ConsumerState<AuditPage> {
  final TextEditingController _entityIdController = TextEditingController();

  BaseGovernanceListResult<BaseGovernanceAuditEvent>? _auditResult;
  AppFailure? _failure;
  bool _loading = false;
  String _entityTypeFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadAudit();
  }

  @override
  void dispose() {
    _entityIdController.dispose();
    super.dispose();
  }

  String? get _entityType {
    return _entityTypeFilter == 'all' ? null : _entityTypeFilter;
  }

  String? get _entityId {
    final value = _entityIdController.text.trim();
    return value.isEmpty ? null : value;
  }

  Future<void> _loadAudit() async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _loading = true;
      _failure = null;
    });

    try {
      final result = await ref
          .read(baseGovernanceRepositoryProvider)
          .listAuditEvents(
            session,
            entityType: _entityType,
            entityId: _entityId,
            pageSize: 100,
          );

      if (!mounted) {
        return;
      }

      setState(() {
        _auditResult = result;
      });
    } on AppFailure catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _failure = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final events = _auditResult?.items ?? const <BaseGovernanceAuditEvent>[];
    final uniqueEntities = events
        .map((event) => '${event.entityType}:${event.entityId}')
        .toSet()
        .length;
    final latestEvent = events.isEmpty ? null : events.first;

    return ResponsivePage(
      title: 'Auditoria',
      subtitle:
          'Trilha append-only de alteracoes criticas com correlacao por entidade e request.',
      actions: [
        OutlinedButton.icon(
          onPressed: _loading ? null : _loadAudit,
          icon: const Icon(Icons.refresh),
          label: const Text('Atualizar'),
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NetworkStatusBanner(),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              AppCard(
                child: SizedBox(
                  width: 220,
                  child: _AuditMetric(
                    label: 'Eventos visiveis',
                    value: '${events.length}',
                  ),
                ),
              ),
              AppCard(
                child: SizedBox(
                  width: 220,
                  child: _AuditMetric(
                    label: 'Entidades unicas',
                    value: '$uniqueEntities',
                  ),
                ),
              ),
              AppCard(
                child: SizedBox(
                  width: 320,
                  child: _AuditMetric(
                    label: 'Ultimo evento',
                    value: latestEvent == null
                        ? 'Sem registros'
                        : _formatTimestamp(latestEvent.createdAt),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _loading && _auditResult == null
                ? const LoadingState(
                    message: 'Carregando trilha de auditoria...',
                  )
                : _failure != null && _auditResult == null
                ? _failure!.code == 'FORBIDDEN'
                      ? const EmptyState(
                          title: 'Sem permissao para auditoria',
                          message:
                              'Seu perfil atual nao pode consultar a trilha administrativa.',
                        )
                      : ErrorState(failure: _failure!, onRetry: _loadAudit)
                : ListView(
                    children: [
                      AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            FilterBar(
                              filters: [
                                SizedBox(
                                  width: 240,
                                  child: DropdownButtonFormField<String>(
                                    key: ValueKey(
                                      'audit-entity-type-$_entityTypeFilter',
                                    ),
                                    isExpanded: true,
                                    initialValue: _entityTypeFilter,
                                    decoration: const InputDecoration(
                                      labelText: 'Tipo de entidade',
                                    ),
                                    items: const [
                                      DropdownMenuItem(
                                        value: 'all',
                                        child: Text('Todos'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'role',
                                        child: Text('Perfil'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'user_scope_grant',
                                        child: Text('Grant de usuario'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'company',
                                        child: Text('Empresa'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'establishment',
                                        child: Text('Estabelecimento'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'sharing_policy',
                                        child: Text('Compartilhamento'),
                                      ),
                                      DropdownMenuItem(
                                        value: 'consolidation_run',
                                        child: Text('Consolidacao'),
                                      ),
                                    ],
                                    onChanged: (value) {
                                      setState(() {
                                        _entityTypeFilter = value ?? 'all';
                                      });
                                      _loadAudit();
                                    },
                                  ),
                                ),
                                SizedBox(
                                  width: 280,
                                  child: TextField(
                                    controller: _entityIdController,
                                    decoration: InputDecoration(
                                      labelText: 'Entity ID',
                                      suffixIcon: IconButton(
                                        icon: const Icon(Icons.search),
                                        onPressed: _loadAudit,
                                      ),
                                    ),
                                    onSubmitted: (_) => _loadAudit(),
                                  ),
                                ),
                                TextButton.icon(
                                  onPressed: () {
                                    _entityIdController.clear();
                                    setState(() {
                                      _entityTypeFilter = 'all';
                                    });
                                    _loadAudit();
                                  },
                                  icon: const Icon(
                                    Icons.filter_alt_off_outlined,
                                  ),
                                  label: const Text('Limpar'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (events.isEmpty)
                              const EmptyState(
                                title: 'Nenhum evento encontrado',
                                message:
                                    'Nao houve registros para os filtros aplicados neste momento.',
                              )
                            else
                              for (final event in events) ...[
                                _AuditEventCard(event: event),
                                const SizedBox(height: 12),
                              ],
                          ],
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  String _formatTimestamp(String rawValue) {
    final date = DateTime.tryParse(rawValue)?.toLocal();
    if (date == null) {
      return rawValue;
    }
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }
}

class _AuditMetric extends StatelessWidget {
  const _AuditMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        Text(value, style: Theme.of(context).textTheme.titleLarge),
      ],
    );
  }
}

class _AuditEventCard extends StatelessWidget {
  const _AuditEventCard({required this.event});

  final BaseGovernanceAuditEvent event;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.action,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_formatEntityType(event.entityType)} - ${event.entityId}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              StatusBadge(
                label: event.severity,
                color: switch (event.severity) {
                  'critical' => AppColors.error,
                  'warning' => AppColors.warning,
                  _ => AppColors.success,
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(label: Text('actor ${event.actorUserId}')),
              Chip(label: Text('corr ${event.correlationId}')),
              Chip(label: Text('req ${event.requestId}')),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _formatTimestamp(event.createdAt),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (event.after?.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            Text('After', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 4),
            Text(event.after.toString()),
          ],
          if (event.before?.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            Text('Before', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 4),
            Text(event.before.toString()),
          ],
        ],
      ),
    );
  }

  String _formatTimestamp(String rawValue) {
    final date = DateTime.tryParse(rawValue)?.toLocal();
    if (date == null) {
      return rawValue;
    }
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }

  String _formatEntityType(String entityType) {
    switch (entityType) {
      case 'role':
        return 'Perfil';
      case 'user_scope_grant':
        return 'Grant de usuario';
      case 'company':
        return 'Empresa';
      case 'establishment':
        return 'Estabelecimento';
      case 'sharing_policy':
        return 'Compartilhamento';
      case 'consolidation_run':
        return 'Consolidacao';
      default:
        return entityType;
    }
  }
}
