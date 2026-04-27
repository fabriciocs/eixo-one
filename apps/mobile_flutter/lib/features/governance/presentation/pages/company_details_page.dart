import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/empty_state.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/loading_state.dart';
import '../../../../design_system/components/network_status_banner.dart';
import '../../../../design_system/components/primary_button.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';
import '../../domain/models/governance_commands.dart';
import '../../domain/models/governance_models.dart';
import '../../domain/models/governance_permissions.dart';
import '../../presentation/governance_routes.dart';
import '../controllers/governance_providers.dart';
import '../widgets/governance_context_bar.dart';
import '../widgets/governance_status_badge.dart';

class CompanyDetailsPage extends ConsumerStatefulWidget {
  const CompanyDetailsPage({
    super.key,
    required this.companyId,
  });

  final String companyId;

  @override
  ConsumerState<CompanyDetailsPage> createState() => _CompanyDetailsPageState();
}

class _CompanyDetailsPageState extends ConsumerState<CompanyDetailsPage> {
  Future<_CompanyDetailsData>? _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }
    final repository = ref.read(governanceRepositoryProvider);
    setState(() {
      _future = Future.wait<Object>([
        repository.getCompany(session, widget.companyId),
        repository.listEstablishments(
          session,
          EstablishmentFilters(companyId: widget.companyId, pageSize: 40),
        ),
        if (session.user.hasPermission(GovernancePermissions.consolidationRead))
          repository.listConsolidationRuns(
            session,
            const ConsolidationRunFilters(pageSize: 20),
          )
        else
          Future<Object>.value(
            const GovernanceListResult<ConsolidationRun>(
              items: [],
              pagination: PaginationInfo(
                page: 1,
                pageSize: 0,
                totalItems: 0,
                hasNextPage: false,
              ),
            ),
          ),
      ]).then(
        (results) => _CompanyDetailsData(
          company: results[0] as Company,
          establishments:
              (results[1] as GovernanceListResult<Establishment>).items,
          runs: (results[2] as GovernanceListResult<ConsolidationRun>)
              .items
              .where(
                (run) => run.participantCompanyIds.contains(widget.companyId),
              )
              .toList(growable: false),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authSessionProvider);
    final canUpdate =
        session?.user.hasPermission(GovernancePermissions.companyUpdate) ?? false;
    final canCreateEstablishment = session?.user.hasPermission(
          GovernancePermissions.establishmentCreate,
        ) ??
        false;
    final canUpdateEstablishment = session?.user.hasPermission(
          GovernancePermissions.establishmentUpdate,
        ) ??
        false;
    final canManageGrants =
        session?.user.hasPermission(GovernancePermissions.userScopeManage) ?? false;

    return ResponsivePage(
      title: 'Detalhe da empresa',
      subtitle: widget.companyId,
      actions: [
        if (canUpdate)
          PrimaryButton(
            label: 'Editar empresa',
            icon: Icons.edit_outlined,
            onPressed: () => context.go(
              GovernanceRoutes.companyEdit(widget.companyId),
            ),
          ),
        if (canCreateEstablishment)
          PrimaryButton(
            label: 'Nova matriz/filial',
            icon: Icons.store_mall_directory_outlined,
            onPressed: () => context.go(
              '${GovernanceRoutes.establishmentNew}?companyId=${widget.companyId}',
            ),
          ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NetworkStatusBanner(),
          const SizedBox(height: 16),
          const GovernanceContextBar(),
          const SizedBox(height: 16),
          Expanded(
            child: FutureBuilder<_CompanyDetailsData>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const LoadingState(
                    message: 'Carregando detalhe da empresa...',
                  );
                }

                if (snapshot.hasError) {
                  final error = snapshot.error;
                  return ErrorState(
                    failure: error is AppFailure
                        ? error
                        : const AppFailure(
                            title: 'Falha ao carregar detalhe',
                            message:
                                'Nao foi possivel carregar os dados desta empresa.',
                            retryable: true,
                          ),
                    onRetry: _load,
                  );
                }

                final data = snapshot.data;
                if (data == null) {
                  return const EmptyState(
                    title: 'Empresa indisponivel',
                    message:
                        'Nao foi possivel montar o detalhe da empresa neste momento.',
                  );
                }

                final company = data.company;
                return DefaultTabController(
                  length: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            company.displayName,
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          GovernanceStatusBadge(status: company.status),
                          if (canManageGrants)
                            TextButton.icon(
                              onPressed: () => context.go(GovernanceRoutes.grants),
                              icon: const Icon(Icons.admin_panel_settings_outlined),
                              label: const Text('Gerenciar grants'),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const TabBar(
                        isScrollable: true,
                        tabs: [
                          Tab(text: 'Resumo'),
                          Tab(text: 'Estabelecimentos'),
                          Tab(text: 'Consolidacao'),
                          Tab(text: 'Historico'),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: TabBarView(
                          children: [
                            _SummaryTab(company: company),
                            _EstablishmentsTab(
                              establishments: data.establishments,
                              canEdit: canUpdateEstablishment,
                            ),
                            _ConsolidationTab(runs: data.runs),
                            const EmptyState(
                              title: 'Historico aguardando endpoint',
                              message:
                                  'A trilha de auditoria detalhada desta empresa depende da exposicao dedicada do backend nesta fase.',
                            ),
                          ],
                        ),
                      ),
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

class _CompanyDetailsData {
  const _CompanyDetailsData({
    required this.company,
    required this.establishments,
    required this.runs,
  });

  final Company company;
  final List<Establishment> establishments;
  final List<ConsolidationRun> runs;
}

class _SummaryTab extends StatelessWidget {
  const _SummaryTab({
    required this.company,
  });

  final Company company;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Dados juridicos e tributarios',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              _DetailRow(label: 'Razao social', value: company.legalName),
              _DetailRow(
                label: 'Raiz cadastral',
                value: company.companyRootRegistration,
              ),
              _DetailRow(label: 'Pais', value: company.countryCode),
              _DetailRow(label: 'Natureza juridica', value: company.legalNatureCode),
              _DetailRow(label: 'Abertura', value: company.openingDate),
              _DetailRow(label: 'Regime', value: company.regimeTributario),
              _DetailRow(label: 'Moeda', value: company.defaultCurrency),
              _DetailRow(
                label: 'Calendario fiscal',
                value: company.fiscalCalendarId,
              ),
              _DetailRow(
                label: 'Modo de consolidacao',
                value: company.consolidationMode,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _EstablishmentsTab extends StatelessWidget {
  const _EstablishmentsTab({
    required this.establishments,
    required this.canEdit,
  });

  final List<Establishment> establishments;
  final bool canEdit;

  @override
  Widget build(BuildContext context) {
    if (establishments.isEmpty) {
      return const EmptyState(
        title: 'Nenhum estabelecimento cadastrado',
        message:
            'Cadastre matriz ou filial para completar a estrutura operacional desta empresa.',
      );
    }

    return ListView.separated(
      itemCount: establishments.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final establishment = establishments[index];
        return AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  Text(
                    establishment.displayName,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  GovernanceStatusBadge(status: establishment.status),
                  Chip(label: Text(establishment.establishmentType.label)),
                ],
              ),
              const SizedBox(height: 12),
              _DetailRow(
                label: 'Registro',
                value: establishment.registrationNumber,
              ),
              _DetailRow(
                label: 'CNAE principal',
                value: establishment.cnaePrincipal,
              ),
              _DetailRow(
                label: 'Endereco',
                value:
                    '${establishment.address.line1} - ${establishment.address.cityName}/${establishment.address.stateCode ?? '--'}',
              ),
              if (canEdit) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: () => context.go(
                      GovernanceRoutes.establishmentEdit(
                        establishment.establishmentId,
                      ),
                    ),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Editar estabelecimento'),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _ConsolidationTab extends StatelessWidget {
  const _ConsolidationTab({
    required this.runs,
  });

  final List<ConsolidationRun> runs;

  @override
  Widget build(BuildContext context) {
    if (runs.isEmpty) {
      return const EmptyState(
        title: 'Sem consolidacao para esta empresa',
        message:
            'Ainda nao existem runs envolvendo esta empresa no escopo atual.',
      );
    }

    return ListView.separated(
      itemCount: runs.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final run = runs[index];
        return AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  Text(
                    'Run ${run.runId}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Chip(label: Text(run.status.label)),
                ],
              ),
              const SizedBox(height: 12),
              _DetailRow(
                label: 'Periodo',
                value: '${run.periodStart} ate ${run.periodEnd}',
              ),
              _DetailRow(label: 'Moeda', value: run.currencyCode),
              _DetailRow(
                label: 'Empresas participantes',
                value: '${run.participantCompanyIds.length}',
              ),
              _DetailRow(
                label: 'Pendencias bloqueantes',
                value: '${run.validationSummary.blockingIssueCount}',
              ),
            ],
          ),
        );
      },
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 160,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
