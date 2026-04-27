import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/empty_state.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/filter_bar.dart';
import '../../../../design_system/components/form_section.dart';
import '../../../../design_system/components/loading_state.dart';
import '../../../../design_system/components/network_status_banner.dart';
import '../../../../design_system/components/primary_button.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';
import '../../domain/models/governance_commands.dart';
import '../../domain/models/governance_models.dart';
import '../../domain/models/governance_permissions.dart';
import '../controllers/governance_providers.dart';
import '../widgets/governance_context_bar.dart';

class ConsolidationPage extends ConsumerStatefulWidget {
  const ConsolidationPage({super.key});

  @override
  ConsumerState<ConsolidationPage> createState() => _ConsolidationPageState();
}

class _ConsolidationPageState extends ConsumerState<ConsolidationPage> {
  final TextEditingController _periodStartController = TextEditingController();
  final TextEditingController _periodEndController = TextEditingController();
  final TextEditingController _calendarController =
      TextEditingController(text: 'cal_br_default');
  final TextEditingController _currencyController =
      TextEditingController(text: 'BRL');
  final TextEditingController _notesController = TextEditingController();

  GovernanceListResult<ConsolidationRun>? _runsResult;
  AppFailure? _runsFailure;
  AppFailure? _saveFailure;
  bool _loadingRuns = false;
  bool _saving = false;
  bool _selectionInitialized = false;
  ConsolidationRunStatus? _statusFilter;
  final Set<String> _selectedCompanyIds = <String>{};
  final Set<String> _selectedEstablishmentIds = <String>{};
  String _eliminationMode = 'MANUAL_REVIEW';

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final firstDay = DateTime(now.year, now.month, 1);
    _periodStartController.text = _formatDate(firstDay);
    _periodEndController.text = _formatDate(now);
    _loadRuns();
  }

  @override
  void dispose() {
    _periodStartController.dispose();
    _periodEndController.dispose();
    _calendarController.dispose();
    _currencyController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadRuns() async {
    final session = ref.read(authSessionProvider);
    if (session == null ||
        !session.user.hasPermission(GovernancePermissions.consolidationRead)) {
      return;
    }

    setState(() {
      _loadingRuns = true;
      _runsFailure = null;
    });

    try {
      final result = await ref
          .read(governanceRepositoryProvider)
          .listConsolidationRuns(
            session,
            ConsolidationRunFilters(status: _statusFilter),
          );
      if (!mounted) {
        return;
      }
      setState(() {
        _runsResult = result;
      });
    } on AppFailure catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _runsFailure = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingRuns = false;
        });
      }
    }
  }

  Future<void> _submitRun(List<AccessibleCompanySummary> companies) async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    final validationError = _validateForm();
    if (validationError != null) {
      setState(() {
        _saveFailure = validationError;
      });
      return;
    }

    final selectedCompanyIds = _selectedCompanyIds.toList(growable: false)
      ..sort();
    final selectedEstablishmentIds = _selectedEstablishmentIds.toList(
      growable: false,
    )..sort();

    if (selectedCompanyIds.isEmpty) {
      setState(() {
        _saveFailure = const AppFailure(
          title: 'Selecione o escopo',
          message:
              'Escolha pelo menos uma empresa antes de disparar a consolidacao.',
          code: 'VALIDATION_ERROR',
        );
      });
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      final run = await ref.read(governanceRepositoryProvider).createConsolidationRun(
            session,
            CreateConsolidationRunInput(
              participantCompanyIds: selectedCompanyIds,
              participantEstablishmentIds: selectedEstablishmentIds,
              periodStart: _periodStartController.text,
              periodEnd: _periodEndController.text,
              fiscalCalendarId: _calendarController.text,
              currencyCode: _currencyController.text,
              fxPolicy: const <String, dynamic>{'type': 'FIXED'},
              percentagePolicy: const <String, dynamic>{'type': 'FULL'},
              eliminationMode: _eliminationMode,
              notes: _notesController.text,
            ),
          );

      await ref.read(governanceWorkspaceProvider.notifier).reload();
      await _loadRuns();

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            run.status == ConsolidationRunStatus.blocked
                ? 'Run criada com bloqueios. Revise as pendencias antes de prosseguir.'
                : 'Run de consolidacao criada com sucesso.',
          ),
        ),
      );
    } on AppFailure catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _saveFailure = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  AppFailure? _validateForm() {
    final datePattern = RegExp(r'^\d{4}-\d{2}-\d{2}$');
    if (!datePattern.hasMatch(_periodStartController.text.trim()) ||
        !datePattern.hasMatch(_periodEndController.text.trim())) {
      return const AppFailure(
        title: 'Periodo invalido',
        message: 'Use o formato YYYY-MM-DD para inicio e fim.',
        code: 'VALIDATION_ERROR',
      );
    }
    if (_calendarController.text.trim().isEmpty ||
        _currencyController.text.trim().isEmpty) {
      return const AppFailure(
        title: 'Campos obrigatorios pendentes',
        message:
            'Calendario fiscal e moeda funcional sao obrigatorios para a run.',
        code: 'VALIDATION_ERROR',
      );
    }
    return null;
  }

  String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  void _seedSelection(GovernanceWorkspace? workspace) {
    if (_selectionInitialized || workspace == null) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _selectionInitialized) {
        return;
      }
      setState(() {
        _selectedCompanyIds.addAll(workspace.overview.selectedReadCompanyIds);
        _selectedEstablishmentIds.addAll(
          workspace.overview.selectedReadEstablishmentIds,
        );
        _selectionInitialized = true;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authSessionProvider);
    final workspaceAsync = ref.watch(governanceWorkspaceProvider);
    final workspace = workspaceAsync.value;
    final companies = workspace?.accessibleScopes.companies ??
        const <AccessibleCompanySummary>[];
    final canReadOverview = session?.user.hasAnyPermission([
          GovernancePermissions.consolidatedRead,
          GovernancePermissions.consolidationRead,
        ]) ??
        false;
    final canReadRuns =
        session?.user.hasPermission(GovernancePermissions.consolidationRead) ??
            false;
    final canCreateRun =
        session?.user.hasPermission(GovernancePermissions.consolidationRun) ??
            false;

    _seedSelection(workspace);

    return ResponsivePage(
      title: 'Consolidacao',
      subtitle:
          'Leitura consolidada, validacao formal e disparo controlado de runs multiempresa.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NetworkStatusBanner(),
          const SizedBox(height: 16),
          const GovernanceContextBar(),
          const SizedBox(height: 16),
          Expanded(
            child: !canReadOverview
                ? const EmptyState(
                    title: 'Sem permissao para consolidacao',
                    message:
                        'Seu perfil atual nao possui acesso ao escopo consolidado deste modulo.',
                  )
                : ListView(
                    children: [
                      _buildOverviewSection(context, workspace, companies),
                      const SizedBox(height: 16),
                      if (canCreateRun)
                        _buildRunFormSection(context, companies)
                      else
                        const AppCard(
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(Icons.lock_outline),
                            title: Text('Seu perfil esta em leitura consolidada'),
                            subtitle: Text(
                              'Voce pode acompanhar o escopo consolidado, mas nao abrir novas runs formais.',
                            ),
                          ),
                        ),
                      const SizedBox(height: 16),
                      if (canReadRuns)
                        _buildRunsSection(context)
                      else
                        const EmptyState(
                          title: 'Runs formais indisponiveis',
                          message:
                              'A leitura consolidada do seu perfil nao inclui o historico operacional das runs.',
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewSection(
    BuildContext context,
    GovernanceWorkspace? workspace,
    List<AccessibleCompanySummary> companies,
  ) {
    if (workspace == null) {
      return const AppCard(
        child: LoadingState(
          message: 'Carregando panorama consolidado...',
        ),
      );
    }

    final companyNames = companies
        .where(
          (item) =>
              workspace.overview.selectedReadCompanyIds.contains(item.companyId),
        )
        .map((item) => item.legalName)
        .toList(growable: false);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Panorama do escopo atual',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricCard(
                label: 'Empresas no escopo',
                value: '${workspace.overview.selectedReadCompanyIds.length}',
              ),
              _MetricCard(
                label: 'Filiais no escopo',
                value:
                    '${workspace.overview.selectedReadEstablishmentIds.length}',
              ),
              _MetricCard(
                label: 'Ultima run',
                value: workspace.overview.latestRunStatus?.label ?? 'Sem run',
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Empresas de leitura consolidadas',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          if (companyNames.isEmpty)
            const Text(
              'Ainda nao existem empresas selecionadas para leitura consolidada.',
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final companyName in companyNames) Chip(label: Text(companyName)),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildRunFormSection(
    BuildContext context,
    List<AccessibleCompanySummary> companies,
  ) {
    return FormSection(
      title: 'Nova run formal',
      description:
          'Valide o escopo antes do envio. O backend continua sendo a fonte final da verdade para bloqueios e divergencias.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_saveFailure != null) ...[
            ErrorState(failure: _saveFailure!),
            const SizedBox(height: 16),
          ],
          FilterBar(
            filters: [
              SizedBox(
                width: 220,
                child: TextFormField(
                  controller: _periodStartController,
                  decoration: const InputDecoration(
                    labelText: 'Inicio do periodo',
                    hintText: 'YYYY-MM-DD',
                  ),
                ),
              ),
              SizedBox(
                width: 220,
                child: TextFormField(
                  controller: _periodEndController,
                  decoration: const InputDecoration(
                    labelText: 'Fim do periodo',
                    hintText: 'YYYY-MM-DD',
                  ),
                ),
              ),
              SizedBox(
                width: 220,
                child: TextFormField(
                  controller: _calendarController,
                  decoration: const InputDecoration(
                    labelText: 'Calendario fiscal',
                  ),
                ),
              ),
              SizedBox(
                width: 160,
                child: TextFormField(
                  controller: _currencyController,
                  decoration: const InputDecoration(
                    labelText: 'Moeda',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _eliminationMode,
            decoration: const InputDecoration(
              labelText: 'Modo de eliminacao',
            ),
            items: const [
              DropdownMenuItem(
                value: 'MANUAL_REVIEW',
                child: Text('Revisao manual'),
              ),
              DropdownMenuItem(
                value: 'BLOCK_ON_DIVERGENCE',
                child: Text('Bloquear com divergencia'),
              ),
            ],
            onChanged: (value) {
              setState(() {
                _eliminationMode = value ?? 'MANUAL_REVIEW';
              });
            },
          ),
          const SizedBox(height: 24),
          Text(
            'Empresas participantes',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          for (final company in companies) ...[
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _selectedCompanyIds.contains(company.companyId),
              title: Text(company.legalName),
              subtitle: Text(
                '${company.establishments.length} estabelecimentos disponiveis',
              ),
              onChanged: (value) {
                setState(() {
                  if (value ?? false) {
                    _selectedCompanyIds.add(company.companyId);
                  } else {
                    _selectedCompanyIds.remove(company.companyId);
                    _selectedEstablishmentIds.removeWhere(
                      (establishmentId) => company.establishments.any(
                        (item) => item.establishmentId == establishmentId,
                      ),
                    );
                  }
                });
              },
            ),
            if (_selectedCompanyIds.contains(company.companyId))
              Padding(
                padding: const EdgeInsets.only(left: 12, bottom: 12),
                child: Column(
                  children: [
                    for (final establishment in company.establishments)
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        value: _selectedEstablishmentIds.contains(
                          establishment.establishmentId,
                        ),
                        title: Text(establishment.legalNameAtEstablishment),
                        subtitle: Text(establishment.establishmentType.label),
                        onChanged: (value) {
                          setState(() {
                            if (value ?? false) {
                              _selectedEstablishmentIds
                                  .add(establishment.establishmentId);
                            } else {
                              _selectedEstablishmentIds
                                  .remove(establishment.establishmentId);
                            }
                          });
                        },
                      ),
                  ],
                ),
              ),
          ],
          const SizedBox(height: 16),
          TextFormField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Notas da run',
              hintText:
                  'Explique o objetivo desta consolidacao e eventuais ressalvas.',
            ),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: PrimaryButton(
              label: 'Criar run formal',
              icon: Icons.play_circle_outline,
              isLoading: _saving,
              onPressed: () => _submitRun(companies),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRunsSection(BuildContext context) {
    return FormSection(
      title: 'Historico de runs',
      description:
          'Acompanhe bloqueios, divergencias e execucoes recentes sem depender de modais.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilterBar(
            filters: [
              DropdownButton<ConsolidationRunStatus?>(
                value: _statusFilter,
                hint: const Text('Status'),
                onChanged: (value) {
                  setState(() {
                    _statusFilter = value;
                  });
                  _loadRuns();
                },
                items: [
                  const DropdownMenuItem<ConsolidationRunStatus?>(
                    value: null,
                    child: Text('Todos os status'),
                  ),
                  for (final status in ConsolidationRunStatus.values)
                    DropdownMenuItem(
                      value: status,
                      child: Text(status.label),
                    ),
                ],
              ),
              TextButton.icon(
                onPressed: _loadRuns,
                icon: const Icon(Icons.refresh),
                label: const Text('Atualizar'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 360,
            child: _loadingRuns
                ? const LoadingState(
                    message: 'Carregando runs de consolidacao...',
                  )
                : _runsFailure != null
                    ? ErrorState(
                        failure: _runsFailure!,
                        onRetry: _loadRuns,
                      )
                    : (_runsResult == null || _runsResult!.items.isEmpty)
                        ? const EmptyState(
                            title: 'Nenhuma run encontrada',
                            message:
                                'Ainda nao existem runs formais para os filtros atuais.',
                          )
                        : ListView.separated(
                            itemCount: _runsResult!.items.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final run = _runsResult!.items[index];
                              return AppCard(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Wrap(
                                      spacing: 12,
                                      runSpacing: 12,
                                      crossAxisAlignment:
                                          WrapCrossAlignment.center,
                                      children: [
                                        Text(
                                          'Run ${run.runId}',
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleLarge,
                                        ),
                                        Chip(label: Text(run.status.label)),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      '${run.periodStart} ate ${run.periodEnd}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      '${run.participantCompanyIds.length} empresas e ${run.participantEstablishmentIds.length} estabelecimentos',
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Bloqueios: ${run.validationSummary.blockingIssueCount} | Alertas: ${run.validationSummary.warningCount}',
                                    ),
                                    if (run.validationSummary.issues.isNotEmpty) ...[
                                      const SizedBox(height: 12),
                                      for (final issue in run.validationSummary.issues)
                                        Padding(
                                          padding:
                                              const EdgeInsets.only(bottom: 8),
                                          child: Text(
                                            issue.blocking
                                                ? 'Bloqueio: ${issue.message}'
                                                : 'Alerta: ${issue.message}',
                                          ),
                                        ),
                                    ],
                                  ],
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ],
        ),
      ),
    );
  }
}
