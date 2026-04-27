import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/empty_state.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/filter_bar.dart';
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

class CompaniesPage extends ConsumerStatefulWidget {
  const CompaniesPage({super.key});

  @override
  ConsumerState<CompaniesPage> createState() => _CompaniesPageState();
}

class _CompaniesPageState extends ConsumerState<CompaniesPage> {
  final _searchController = TextEditingController();
  CompanyFilters _filters = const CompanyFilters();
  Future<GovernanceListResult<Company>>? _future;

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
    final session = ref.read(authSessionProvider);
    if (session == null ||
        !session.user.hasPermission(GovernancePermissions.companyRead)) {
      return;
    }

    setState(() {
      _future = ref.read(governanceRepositoryProvider).listCompanies(
            session,
            _filters,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authSessionProvider);
    final canRead =
        session?.user.hasPermission(GovernancePermissions.companyRead) ?? false;
    final canCreate =
        session?.user.hasPermission(GovernancePermissions.companyCreate) ?? false;

    return ResponsivePage(
      title: 'Empresas',
      subtitle:
          'Consulta, navegacao e manutencao da estrutura legal do tenant atual.',
      actions: [
        if (canCreate)
          PrimaryButton(
            label: 'Nova empresa',
            icon: Icons.add_business,
            onPressed: () => context.go(GovernanceRoutes.companyNew),
          ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NetworkStatusBanner(),
          const SizedBox(height: 16),
          const GovernanceContextBar(),
          const SizedBox(height: 16),
          if (!canRead)
            const Expanded(
              child: EmptyState(
                title: 'Sem permissao para listar empresas',
                message:
                    'Seu perfil atual nao possui leitura deste recurso. Troque o contexto ou revise o grant.',
              ),
            )
          else ...[
            FilterBar(
              title: 'Filtros',
              filters: [
                SizedBox(
                  width: 260,
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      labelText: 'Busca por nome ou raiz cadastral',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.search),
                        onPressed: () {
                          _filters = _filters.copyWith(
                            search: _searchController.text,
                            page: 1,
                          );
                          _load();
                        },
                      ),
                    ),
                    onSubmitted: (value) {
                      _filters = _filters.copyWith(search: value, page: 1);
                      _load();
                    },
                  ),
                ),
                DropdownButton<GovernanceRecordStatus?>(
                  value: _filters.status,
                  hint: const Text('Status'),
                  onChanged: (value) {
                    _filters = _filters.copyWith(status: value, page: 1);
                    _load();
                  },
                  items: [
                    const DropdownMenuItem<GovernanceRecordStatus?>(
                      value: null,
                      child: Text('Todos os status'),
                    ),
                    for (final status in GovernanceRecordStatus.values)
                      DropdownMenuItem(
                        value: status,
                        child: Text(status.label),
                      ),
                  ],
                ),
                DropdownButton<String?>(
                  value: _filters.regimeTributario,
                  hint: const Text('Regime'),
                  onChanged: (value) {
                    _filters = _filters.copyWith(
                      regimeTributario: value,
                      page: 1,
                      clearRegimeTributario: value == null,
                    );
                    _load();
                  },
                  items: const [
                    DropdownMenuItem<String?>(
                      value: null,
                      child: Text('Todos os regimes'),
                    ),
                    DropdownMenuItem(
                      value: 'LUCRO_REAL',
                      child: Text('Lucro real'),
                    ),
                    DropdownMenuItem(
                      value: 'LUCRO_PRESUMIDO',
                      child: Text('Lucro presumido'),
                    ),
                    DropdownMenuItem(
                      value: 'SIMPLES_NACIONAL',
                      child: Text('Simples nacional'),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: () {
                    _searchController.clear();
                    _filters = const CompanyFilters();
                    _load();
                  },
                  icon: const Icon(Icons.filter_alt_off_outlined),
                  label: const Text('Limpar'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: FutureBuilder<GovernanceListResult<Company>>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const LoadingState(
                      message: 'Carregando empresas do escopo...',
                    );
                  }

                  if (snapshot.hasError) {
                    final error = snapshot.error;
                    return ErrorState(
                      failure: error is AppFailure
                          ? error
                          : const AppFailure(
                              title: 'Falha ao carregar empresas',
                              message:
                                  'Nao foi possivel carregar a listagem de empresas.',
                              retryable: true,
                            ),
                      onRetry: _load,
                    );
                  }

                  final result = snapshot.data;
                  if (result == null || result.items.isEmpty) {
                    return EmptyState(
                      title: 'Nenhuma empresa encontrada',
                      message: _filters.search?.isNotEmpty == true
                          ? 'Os filtros atuais nao retornaram empresas. Ajuste a busca e tente novamente.'
                          : 'Ainda nao existem empresas visiveis para este grant.',
                    );
                  }

                  return ListView.separated(
                    itemCount: result.items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final company = result.items[index];
                      return AppCard(
                        child: InkWell(
                          onTap: () => context.go(
                            GovernanceRoutes.companyDetails(company.companyId),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(4),
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
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleLarge,
                                    ),
                                    GovernanceStatusBadge(status: company.status),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 16,
                                  runSpacing: 8,
                                  children: [
                                    _InfoLine(
                                      label: 'Raiz cadastral',
                                      value: company.companyRootRegistration,
                                    ),
                                    _InfoLine(
                                      label: 'Regime',
                                      value: company.regimeTributario,
                                    ),
                                    _InfoLine(
                                      label: 'Calendario',
                                      value: company.fiscalCalendarId,
                                    ),
                                    _InfoLine(
                                      label: 'Consolidacao',
                                      value: company.consolidationMode,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    TextButton.icon(
                                      onPressed: () => context.go(
                                        GovernanceRoutes.companyDetails(
                                          company.companyId,
                                        ),
                                      ),
                                      icon: const Icon(Icons.visibility_outlined),
                                      label: const Text('Abrir detalhe'),
                                    ),
                                    if (session?.user.hasPermission(
                                          GovernancePermissions.companyUpdate,
                                        ) ??
                                        false)
                                      TextButton.icon(
                                        onPressed: () => context.go(
                                          GovernanceRoutes.companyEdit(
                                            company.companyId,
                                          ),
                                        ),
                                        icon: const Icon(Icons.edit_outlined),
                                        label: const Text('Editar'),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: '$label: ',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          TextSpan(
            text: value,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
