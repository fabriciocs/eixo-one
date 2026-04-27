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
import '../../domain/models/governance_permissions.dart';
import '../../presentation/governance_routes.dart';
import '../controllers/governance_providers.dart';
import '../widgets/governance_context_bar.dart';
import '../widgets/governance_metric_card.dart';
import '../widgets/governance_status_badge.dart';

class GovernanceOverviewPage extends ConsumerWidget {
  const GovernanceOverviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaceState = ref.watch(governanceWorkspaceProvider);
    final session = ref.watch(authSessionProvider);
    final user = session?.user;

    return ResponsivePage(
      title: 'Multiempresa e multifilial',
      subtitle:
          'Governanca estrutural, grants, contexto operacional e leitura consolidada.',
      actions: [
        if (user?.hasPermission(GovernancePermissions.companyCreate) ?? false)
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
          Expanded(
            child: workspaceState.when(
              loading: () => const LoadingState(
                message: 'Carregando visao geral de governanca...',
              ),
              error: (error, _) => ErrorState(
                failure: error is AppFailure
                    ? error
                    : const AppFailure(
                        title: 'Falha ao carregar modulo',
                        message:
                            'Nao foi possivel montar a visao geral de governanca.',
                        retryable: true,
                      ),
                onRetry: () =>
                    ref.read(governanceWorkspaceProvider.notifier).reload(),
              ),
              data: (workspace) {
                if (workspace == null ||
                    workspace.accessibleScopes.companies.isEmpty) {
                  return const EmptyState(
                    title: 'Nenhuma empresa disponivel',
                    message:
                        'Ainda nao existem empresas visiveis neste contexto ou o grant atual nao recebeu escopo.',
                  );
                }

                final accessibleCompanies = workspace.accessibleScopes.companies;
                final establishments = accessibleCompanies
                    .expand((item) => item.establishments)
                    .toList(growable: false);

                return ListView(
                  children: [
                    Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: [
                        SizedBox(
                          width: 260,
                          child: GovernanceMetricCard(
                            title: 'Empresas ativas',
                            value: '${workspace.overview.activeCompanyCount}',
                            description:
                                'Empresas prontas para operacao no escopo atual.',
                            icon: Icons.domain_outlined,
                          ),
                        ),
                        SizedBox(
                          width: 260,
                          child: GovernanceMetricCard(
                            title: 'Estabelecimentos ativos',
                            value: '${workspace.overview.activeEstablishmentCount}',
                            description:
                                'Matriz e filiais visiveis para leitura ou escrita.',
                            icon: Icons.store_outlined,
                          ),
                        ),
                        SizedBox(
                          width: 260,
                          child: GovernanceMetricCard(
                            title: 'Escopos de leitura',
                            value:
                                '${workspace.overview.selectedReadCompanyIds.length}',
                            description:
                                'Empresas selecionadas para consultas consolidadas.',
                            icon: Icons.visibility_outlined,
                          ),
                        ),
                        SizedBox(
                          width: 260,
                          child: GovernanceMetricCard(
                            title: 'Ultima run',
                            value:
                                workspace.overview.latestRunStatus?.label ?? 'Sem run',
                            description:
                                'Estado mais recente do processo formal de consolidacao.',
                            icon: Icons.account_tree_outlined,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: [
                        SizedBox(
                          width: 360,
                          child: AppCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Acoes principais',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 16),
                                Wrap(
                                  spacing: 12,
                                  runSpacing: 12,
                                  children: [
                                    PrimaryButton(
                                      label: 'Empresas',
                                      icon: Icons.business_outlined,
                                      onPressed: () =>
                                          context.go(GovernanceRoutes.companies),
                                    ),
                                    if (user?.hasPermission(
                                          GovernancePermissions.userScopeManage,
                                        ) ??
                                        false)
                                      PrimaryButton(
                                        label: 'Grants',
                                        icon: Icons.admin_panel_settings_outlined,
                                        onPressed: () =>
                                            context.go(GovernanceRoutes.grants),
                                      ),
                                    if (user?.hasAnyPermission([
                                          GovernancePermissions.consolidatedRead,
                                          GovernancePermissions.consolidationRead,
                                        ]) ??
                                        false)
                                      PrimaryButton(
                                        label: 'Consolidacao',
                                        icon: Icons.analytics_outlined,
                                        onPressed: () => context.go(
                                          GovernanceRoutes.consolidation,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'A escrita sempre depende do contexto ativo. A leitura consolidada pode atravessar varios escopos autorizados sem mudar esse contexto.',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 420,
                          child: AppCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Empresas recentes no seu escopo',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 16),
                                for (final company in accessibleCompanies.take(4)) ...[
                                  ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    leading: const Icon(Icons.domain_outlined),
                                    title: Text(company.legalName),
                                    subtitle: Text(
                                      '${company.establishments.length} estabelecimentos',
                                    ),
                                    trailing: GovernanceStatusBadge(
                                      status: company.status,
                                    ),
                                    onTap: () => context.go(
                                      GovernanceRoutes.companyDetails(
                                        company.companyId,
                                      ),
                                    ),
                                  ),
                                  const Divider(height: 1),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Guardrails operacionais',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          _GuardrailRow(
                            icon: Icons.lock_outline,
                            text:
                                'Acesso cross-company indevido continua bloqueado pelo grant e pelo contexto ativo.',
                          ),
                          const SizedBox(height: 12),
                          _GuardrailRow(
                            icon: Icons.rule_folder_outlined,
                            text:
                                'O tipo do estabelecimento permanece explicito. Nenhuma tela infere matriz ou filial apenas pelo CNPJ.',
                          ),
                          const SizedBox(height: 12),
                          _GuardrailRow(
                            icon: Icons.history_toggle_off_outlined,
                            text:
                                'Historico/auditoria detalhados ainda dependem de endpoint dedicado no backend desta fase.',
                          ),
                          const SizedBox(height: 12),
                          _GuardrailRow(
                            icon: Icons.storefront_outlined,
                            text:
                                'Seu escopo atual cobre ${accessibleCompanies.length} empresas e ${establishments.length} estabelecimentos.',
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _GuardrailRow extends StatelessWidget {
  const _GuardrailRow({
    required this.icon,
    required this.text,
  });

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Icon(icon, size: 18),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ],
    );
  }
}
