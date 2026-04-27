import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/loading_state.dart';
import '../../../../design_system/components/primary_button.dart';
import '../../../../design_system/components/status_badge.dart';
import '../../../../design_system/tokens/app_colors.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';
import '../../domain/models/governance_commands.dart';
import '../../domain/models/governance_models.dart';
import '../../domain/models/governance_permissions.dart';
import '../controllers/governance_providers.dart';

class GovernanceContextBar extends ConsumerWidget {
  const GovernanceContextBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaceState = ref.watch(governanceWorkspaceProvider);
    final session = ref.watch(authSessionProvider);

    if (session == null) {
      return const SizedBox.shrink();
    }

    return AppCard(
      padding: const EdgeInsets.all(0),
      child: workspaceState.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: LoadingState(message: 'Carregando contexto operacional...'),
        ),
        error: (error, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: ErrorState(
            failure: error is AppFailure
                ? error
                : const AppFailure(
                    title: 'Falha ao carregar contexto',
                    message:
                        'Nao foi possivel carregar o contexto multiempresa agora.',
                    retryable: true,
                  ),
            onRetry: () {
              ref.read(governanceWorkspaceProvider.notifier).reload();
            },
          ),
        ),
        data: (workspace) {
          if (workspace == null) {
            return const SizedBox.shrink();
          }

          if (workspace.accessibleScopes.companies.isEmpty) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Sem contexto disponivel. O grant atual ainda nao recebeu empresas ou filiais visiveis.',
              ),
            );
          }

          final currentContext = workspace.context;
          final canSwitchContext =
              session.user.hasPermission(GovernancePermissions.contextSwitch);
          final writeCompany = workspace.accessibleScopes.companies.firstWhere(
            (company) => company.companyId == currentContext?.activeCompanyId,
            orElse: () => workspace.accessibleScopes.companies.first,
          );
          final writeEstablishment = writeCompany.establishments
              .where(
                (item) => item.establishmentId == currentContext?.activeEstablishmentId,
              )
              .cast<AccessibleEstablishmentSummary?>()
              .firstOrNull;

          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    const StatusBadge(
                      label: 'Contexto de escrita',
                      color: AppColors.primary,
                    ),
                    Text(
                      currentContext?.writeEnabled == true
                          ? '${writeCompany.legalName}${writeEstablishment != null ? ' - ${writeEstablishment.legalNameAtEstablishment}' : ''}'
                          : 'Somente leitura',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if (canSwitchContext)
                      PrimaryButton(
                        label: 'Trocar contexto',
                        icon: Icons.swap_horiz,
                        onPressed: () =>
                            _openContextSelector(context, ref, workspace),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Escopo de leitura',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final company in workspace.accessibleScopes.companies.where(
                      (item) => workspace.overview.selectedReadCompanyIds.contains(item.companyId),
                    ))
                      Chip(
                        label: Text(company.legalName),
                        avatar: const Icon(Icons.domain_outlined, size: 18),
                      ),
                    if (workspace.overview.selectedReadCompanyIds.isEmpty)
                      const Chip(
                        label: Text('Sem filtros adicionais'),
                        avatar: Icon(Icons.visibility_outlined, size: 18),
                      ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _openContextSelector(
    BuildContext context,
    WidgetRef ref,
    GovernanceWorkspace workspace,
  ) async {
    final currentContext = workspace.context;
    final companies = workspace.accessibleScopes.companies;
    String? activeCompanyId = currentContext?.activeCompanyId;
    String? activeEstablishmentId = currentContext?.activeEstablishmentId;
    var writeEnabled = currentContext?.writeEnabled ?? false;
    final selectedReadCompanyIds = currentContext == null
        ? <String>{}
        : currentContext.selectedReadCompanyIds.toSet();
    final selectedReadEstablishmentIds = currentContext == null
        ? <String>{}
        : currentContext.selectedReadEstablishmentIds.toSet();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final activeCompany = companies
                .where((item) => item.companyId == activeCompanyId)
                .cast<AccessibleCompanySummary?>()
                .firstOrNull;
            final establishments = activeCompany?.establishments ?? const [];

            return SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Trocar contexto operacional',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'A leitura pode abranger varios escopos autorizados, mas a escrita sempre fica em um unico contexto explicito.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                    SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Habilitar contexto de escrita'),
                      subtitle: const Text(
                        'Desative para continuar apenas com leitura consolidada.',
                      ),
                      value: writeEnabled,
                      onChanged: (value) {
                        setModalState(() {
                          writeEnabled = value;
                          if (!value) {
                            activeCompanyId = null;
                            activeEstablishmentId = null;
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: activeCompanyId,
                      decoration: const InputDecoration(
                        labelText: 'Empresa ativa',
                      ),
                      items: [
                        for (final company in companies)
                          DropdownMenuItem(
                            value: company.companyId,
                            child: Text(company.legalName),
                          ),
                      ],
                      onChanged: writeEnabled
                          ? (value) {
                              setModalState(() {
                                activeCompanyId = value;
                                final firstEstablishment = companies
                                    .firstWhere((item) => item.companyId == value)
                                    .establishments
                                    .firstOrNull;
                                activeEstablishmentId =
                                    firstEstablishment?.establishmentId;
                              });
                            }
                          : null,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: activeEstablishmentId,
                      decoration: const InputDecoration(
                        labelText: 'Estabelecimento ativo',
                      ),
                      items: [
                        for (final establishment in establishments)
                          DropdownMenuItem(
                            value: establishment.establishmentId,
                            child: Text(
                              '${establishment.legalNameAtEstablishment} - ${establishment.establishmentType.label}',
                            ),
                          ),
                      ],
                      onChanged: writeEnabled
                          ? (value) {
                              setModalState(() {
                                activeEstablishmentId = value;
                              });
                            }
                          : null,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Empresas de leitura',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    for (final company in companies)
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        value: selectedReadCompanyIds.contains(company.companyId),
                        title: Text(company.legalName),
                        subtitle: Text(
                          '${company.establishments.length} estabelecimentos visiveis',
                        ),
                        onChanged: (value) {
                          setModalState(() {
                            if (value ?? false) {
                              selectedReadCompanyIds.add(company.companyId);
                            } else {
                              selectedReadCompanyIds.remove(company.companyId);
                              selectedReadEstablishmentIds.removeWhere(
                                (establishmentId) => company.establishments.any(
                                  (item) =>
                                      item.establishmentId == establishmentId,
                                ),
                              );
                            }
                          });
                        },
                      ),
                    const SizedBox(height: 16),
                    Text(
                      'Estabelecimentos de leitura',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    for (final company in companies.where(
                      (item) => selectedReadCompanyIds.contains(item.companyId),
                    )) ...[
                      Text(
                        company.legalName,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      for (final establishment in company.establishments)
                        CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          value: selectedReadEstablishmentIds.contains(
                            establishment.establishmentId,
                          ),
                          title: Text(establishment.legalNameAtEstablishment),
                          subtitle: Text(establishment.establishmentType.label),
                          onChanged: (value) {
                            setModalState(() {
                              if (value ?? false) {
                                selectedReadEstablishmentIds
                                    .add(establishment.establishmentId);
                              } else {
                                selectedReadEstablishmentIds
                                    .remove(establishment.establishmentId);
                              }
                            });
                          },
                        ),
                    ],
                    const SizedBox(height: 24),
                    PrimaryButton(
                      label: 'Aplicar contexto',
                      icon: Icons.check_circle_outline,
                      onPressed: () async {
                        try {
                          await ref
                              .read(governanceWorkspaceProvider.notifier)
                              .switchContext(
                                SwitchOperationalContextInput(
                                  activeCompanyId: activeCompanyId,
                                  activeEstablishmentId: activeEstablishmentId,
                                  selectedReadCompanyIds:
                                      selectedReadCompanyIds.toList(),
                                  selectedReadEstablishmentIds:
                                      selectedReadEstablishmentIds.toList(),
                                  writeEnabled: writeEnabled,
                                ),
                              );
                          if (context.mounted) {
                            Navigator.of(context).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Seu contexto operacional foi atualizado.',
                                ),
                              ),
                            );
                          }
                        } on AppFailure catch (error) {
                          if (!context.mounted) {
                            return;
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(error.message)),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    if (iterator.moveNext()) {
      return iterator.current;
    }

    return null;
  }
}
