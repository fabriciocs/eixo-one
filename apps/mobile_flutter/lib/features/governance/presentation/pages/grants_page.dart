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
import '../widgets/governance_status_badge.dart';

class GrantsPage extends ConsumerStatefulWidget {
  const GrantsPage({super.key});

  @override
  ConsumerState<GrantsPage> createState() => _GrantsPageState();
}

class _GrantsPageState extends ConsumerState<GrantsPage> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _justificationController =
      TextEditingController();

  GovernanceListResult<GovernanceUserSummary>? _usersResult;
  UserScopeGrant? _grant;
  AppFailure? _usersFailure;
  AppFailure? _grantFailure;
  AppFailure? _saveFailure;
  bool _loadingUsers = false;
  bool _loadingGrant = false;
  bool _saving = false;
  String? _selectedUserId;
  bool _readOnlyAllowed = false;
  String? _defaultCompanyId;
  String? _defaultEstablishmentId;
  final Set<String> _selectedCompanyIds = <String>{};
  final Set<String> _selectedEstablishmentIds = <String>{};
  List<String> _roleKeys = const <String>[];
  List<String> _permissionOverrides = const <String>[];

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _justificationController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _loadingUsers = true;
      _usersFailure = null;
    });

    try {
      final result = await ref.read(governanceRepositoryProvider).listUsers(
            session,
            GovernanceUserFilters(search: _normalizedSearch),
          );
      if (!mounted) {
        return;
      }

      final nextSelectedUserId = result.items.any(
        (item) => item.id == _selectedUserId,
      )
          ? _selectedUserId
          : result.items.firstOrNull?.id;

      setState(() {
        _usersResult = result;
        _selectedUserId = nextSelectedUserId;
      });

      if (nextSelectedUserId == null) {
        setState(() {
          _grant = null;
          _grantFailure = null;
          _clearGrantDraft();
        });
        return;
      }

      await _loadGrant(nextSelectedUserId);
    } on AppFailure catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _usersFailure = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingUsers = false;
        });
      }
    }
  }

  Future<void> _loadGrant(String userId) async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _loadingGrant = true;
      _grantFailure = null;
      _saveFailure = null;
      _selectedUserId = userId;
    });

    try {
      final grant = await ref
          .read(governanceRepositoryProvider)
          .getUserScopeGrant(session, userId);
      if (!mounted) {
        return;
      }

      setState(() {
        _grant = grant;
        _hydrateGrantDraft(grant);
      });
    } on AppFailure catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _grantFailure = error;
        _grant = null;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loadingGrant = false;
        });
      }
    }
  }

  Future<void> _saveGrant(List<AccessibleCompanySummary> companies) async {
    final session = ref.read(authSessionProvider);
    if (session == null || _selectedUserId == null) {
      return;
    }

    final payloadCompanies = _buildSelectedScopes(companies);
    if (payloadCompanies.isEmpty) {
      setState(() {
        _saveFailure = const AppFailure(
          title: 'Escopo obrigatorio',
          message:
              'Selecione pelo menos uma empresa para salvar o grant deste usuario.',
          code: 'VALIDATION_ERROR',
        );
      });
      return;
    }

    _ensureDefaults(companies);

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      final repository = ref.read(governanceRepositoryProvider);
      final savedGrant = await repository.upsertUserScopeGrant(
        session,
        _selectedUserId!,
        UpsertUserScopeGrantInput(
          companies: payloadCompanies,
          defaultCompanyId: _defaultCompanyId,
          defaultEstablishmentId: _defaultEstablishmentId,
          readOnlyAllowed: _readOnlyAllowed,
          roleKeys: _roleKeys,
          permissionOverrides: _permissionOverrides,
          justification: _justificationController.text,
        ),
      );

      if (_selectedUserId == session.user.id) {
        await ref.read(governanceWorkspaceProvider.notifier).reload();
      }

      if (!mounted) {
        return;
      }

      setState(() {
        _grant = savedGrant;
        _hydrateGrantDraft(savedGrant);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Grant salvo com sucesso.'),
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

  void _hydrateGrantDraft(UserScopeGrant grant) {
    _selectedCompanyIds
      ..clear()
      ..addAll(grant.companyScopes.map((item) => item.companyId));
    _selectedEstablishmentIds
      ..clear()
      ..addAll(
        grant.companyScopes.expand((item) => item.establishmentIds).toSet(),
      );
    _readOnlyAllowed = grant.readOnlyAllowed;
    _defaultCompanyId = grant.defaultCompanyId;
    _defaultEstablishmentId = grant.defaultEstablishmentId;
    _roleKeys = grant.roleKeys;
    _permissionOverrides = grant.permissionOverrides;
    _justificationController.clear();
  }

  void _clearGrantDraft() {
    _selectedCompanyIds.clear();
    _selectedEstablishmentIds.clear();
    _readOnlyAllowed = false;
    _defaultCompanyId = null;
    _defaultEstablishmentId = null;
    _roleKeys = const <String>[];
    _permissionOverrides = const <String>[];
    _justificationController.clear();
  }

  String? get _normalizedSearch {
    final search = _searchController.text.trim();
    return search.isEmpty ? null : search;
  }

  List<UserScopeGrantCompany> _buildSelectedScopes(
    List<AccessibleCompanySummary> companies,
  ) {
    final selectedCompanies = companies
        .where((item) => _selectedCompanyIds.contains(item.companyId))
        .toList(growable: false)
      ..sort((left, right) => left.legalName.compareTo(right.legalName));

    return selectedCompanies
        .map(
          (company) => UserScopeGrantCompany(
            companyId: company.companyId,
            establishmentIds: company.establishments
                .where(
                  (item) => _selectedEstablishmentIds.contains(
                    item.establishmentId,
                  ),
                )
                .map((item) => item.establishmentId)
                .toList(growable: false),
          ),
        )
        .toList(growable: false);
  }

  void _toggleCompany(
    AccessibleCompanySummary company,
    bool value,
    List<AccessibleCompanySummary> companies,
  ) {
    setState(() {
      if (value) {
        _selectedCompanyIds.add(company.companyId);
      } else {
        _selectedCompanyIds.remove(company.companyId);
        _selectedEstablishmentIds.removeWhere(
          (establishmentId) => company.establishments.any(
            (item) => item.establishmentId == establishmentId,
          ),
        );
      }
      _ensureDefaults(companies);
    });
  }

  void _toggleEstablishment(
    AccessibleCompanySummary company,
    AccessibleEstablishmentSummary establishment,
    bool value,
    List<AccessibleCompanySummary> companies,
  ) {
    setState(() {
      _selectedCompanyIds.add(company.companyId);
      if (value) {
        _selectedEstablishmentIds.add(establishment.establishmentId);
      } else {
        _selectedEstablishmentIds.remove(establishment.establishmentId);
      }
      _ensureDefaults(companies);
    });
  }

  void _ensureDefaults(List<AccessibleCompanySummary> companies) {
    final selectedCompanies = companies
        .where((item) => _selectedCompanyIds.contains(item.companyId))
        .toList(growable: false);

    if (selectedCompanies.isEmpty) {
      _defaultCompanyId = null;
      _defaultEstablishmentId = null;
      return;
    }

    if (_defaultCompanyId == null ||
        !selectedCompanies.any((item) => item.companyId == _defaultCompanyId)) {
      _defaultCompanyId = selectedCompanies.first.companyId;
    }

    final defaultCompany = selectedCompanies.firstWhere(
      (item) => item.companyId == _defaultCompanyId,
    );
    final selectedDefaultEstablishments = defaultCompany.establishments
        .where(
          (item) => _selectedEstablishmentIds.contains(item.establishmentId),
        )
        .toList(growable: false);
    final availableDefaultEstablishments = selectedDefaultEstablishments.isEmpty
        ? defaultCompany.establishments
        : selectedDefaultEstablishments;

    if (availableDefaultEstablishments.isEmpty) {
      _defaultEstablishmentId = null;
      return;
    }

    if (_defaultEstablishmentId == null ||
        !availableDefaultEstablishments.any(
          (item) => item.establishmentId == _defaultEstablishmentId,
        )) {
      _defaultEstablishmentId =
          availableDefaultEstablishments.first.establishmentId;
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authSessionProvider);
    final workspace = ref.watch(governanceWorkspaceProvider);
    final companies = workspace.value?.accessibleScopes.companies ??
        const <AccessibleCompanySummary>[];
    final canManage =
        session?.user.hasPermission(GovernancePermissions.userScopeManage) ??
            false;

    return ResponsivePage(
      title: 'Grants e escopos',
      subtitle:
          'Gerencie leitura, escrita, empresa padrao e filial padrao por usuario.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NetworkStatusBanner(),
          const SizedBox(height: 16),
          const GovernanceContextBar(),
          const SizedBox(height: 16),
          Expanded(
            child: !canManage
                ? const EmptyState(
                    title: 'Sem permissao para grants',
                    message:
                        'Seu perfil atual nao pode editar escopos de outros usuarios.',
                  )
                : ListView(
                    children: [
                      AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Operacao segura',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'O escopo de leitura pode abranger varias empresas, mas o contexto padrao de escrita continua unico e explicito.',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildUsersSection(context),
                      const SizedBox(height: 16),
                      _buildGrantSection(context, companies, session?.user.id),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildUsersSection(BuildContext context) {
    return FormSection(
      title: 'Usuarios do tenant',
      description:
          'Escolha o usuario alvo antes de revisar grant, empresa padrao e escopo de leitura.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilterBar(
            filters: [
              SizedBox(
                width: 320,
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    labelText: 'Buscar por nome ou e-mail',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: _loadUsers,
                    ),
                  ),
                  onSubmitted: (_) => _loadUsers(),
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  _searchController.clear();
                  _loadUsers();
                },
                icon: const Icon(Icons.filter_alt_off_outlined),
                label: const Text('Limpar'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 320,
            child: _loadingUsers
                ? const LoadingState(
                    message: 'Carregando usuarios para grants...',
                  )
                : _usersFailure != null
                    ? ErrorState(
                        failure: _usersFailure!,
                        onRetry: _loadUsers,
                      )
                    : (_usersResult == null || _usersResult!.items.isEmpty)
                        ? const EmptyState(
                            title: 'Nenhum usuario encontrado',
                            message:
                                'A busca atual nao retornou usuarios elegiveis para grant.',
                          )
                        : ListView.separated(
                            itemCount: _usersResult!.items.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final user = _usersResult!.items[index];
                              final selected = user.id == _selectedUserId;
                              return Material(
                                color: selected
                                    ? Theme.of(context)
                                        .colorScheme
                                        .primaryContainer
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                                child: ListTile(
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  selected: selected,
                                  leading: CircleAvatar(
                                    child: Text(
                                      user.displayName.characters.first,
                                    ),
                                  ),
                                  title: Text(user.displayName),
                                  subtitle: Text(user.email),
                                  trailing: GovernanceStatusBadge(
                                    status: user.status == 'active'
                                        ? GovernanceRecordStatus.active
                                        : GovernanceRecordStatus.inactive,
                                  ),
                                  onTap: () => _loadGrant(user.id),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildGrantSection(
    BuildContext context,
    List<AccessibleCompanySummary> companies,
    String? currentUserId,
  ) {
    if (_selectedUserId == null) {
      return const EmptyState(
        title: 'Selecione um usuario',
        message:
            'A edicao do grant so aparece depois que um usuario do tenant for escolhido.',
      );
    }

    if (_loadingGrant) {
      return const AppCard(
        child: LoadingState(message: 'Carregando grant do usuario...'),
      );
    }

    if (_grantFailure != null) {
      return AppCard(
        child: ErrorState(
          failure: _grantFailure!,
          onRetry: () => _loadGrant(_selectedUserId!),
        ),
      );
    }

    if (_grant == null) {
      return const EmptyState(
        title: 'Grant indisponivel',
        message:
            'Nao foi possivel carregar o escopo deste usuario no momento.',
      );
    }

    _ensureDefaults(companies);
    final selectedCompanies = companies
        .where((item) => _selectedCompanyIds.contains(item.companyId))
        .toList(growable: false);
    final defaultCompany = selectedCompanies.firstWhereOrNull(
      (item) => item.companyId == _defaultCompanyId,
    );
    final defaultEstablishments = defaultCompany == null
        ? const <AccessibleEstablishmentSummary>[]
        : defaultCompany.establishments
            .where(
              (item) =>
                  _selectedEstablishmentIds.isEmpty ||
                  _selectedEstablishmentIds.contains(item.establishmentId),
            )
            .toList(growable: false);

    return FormSection(
      title: 'Grant de $_selectedUserId',
      description:
          'Ajuste escopo, empresa padrao e filial padrao sem quebrar o contexto de escrita.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_saveFailure != null) ...[
            ErrorState(failure: _saveFailure!),
            const SizedBox(height: 16),
          ],
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              AppCard(
                child: SizedBox(
                  width: 240,
                  child: _SummaryMetric(
                    label: 'Empresas concedidas',
                    value: '${selectedCompanies.length}',
                  ),
                ),
              ),
              AppCard(
                child: SizedBox(
                  width: 240,
                  child: _SummaryMetric(
                    label: 'Estabelecimentos marcados',
                    value: '${_selectedEstablishmentIds.length}',
                  ),
                ),
              ),
              AppCard(
                child: SizedBox(
                  width: 240,
                  child: _SummaryMetric(
                    label: 'Tipo de acesso',
                    value: _readOnlyAllowed ? 'Somente leitura' : 'Leitura e escrita',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Somente leitura'),
            subtitle: const Text(
              'Ative quando o usuario puder consultar varias empresas, mas nao escrever em nenhuma delas.',
            ),
            value: _readOnlyAllowed,
            onChanged: (value) {
              setState(() {
                _readOnlyAllowed = value;
              });
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _defaultCompanyId,
            decoration: const InputDecoration(
              labelText: 'Empresa padrao',
            ),
            items: [
              for (final company in selectedCompanies)
                DropdownMenuItem(
                  value: company.companyId,
                  child: Text(company.legalName),
                ),
            ],
            onChanged: selectedCompanies.isEmpty
                ? null
                : (value) {
                    setState(() {
                      _defaultCompanyId = value;
                      _ensureDefaults(companies);
                    });
                  },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _defaultEstablishmentId,
            decoration: const InputDecoration(
              labelText: 'Estabelecimento padrao',
            ),
            items: [
              for (final establishment in defaultEstablishments)
                DropdownMenuItem(
                  value: establishment.establishmentId,
                  child: Text(
                    '${establishment.legalNameAtEstablishment} - ${establishment.establishmentType.label}',
                  ),
                ),
            ],
            onChanged: defaultEstablishments.isEmpty
                ? null
                : (value) {
                    setState(() {
                      _defaultEstablishmentId = value;
                    });
                  },
          ),
          const SizedBox(height: 24),
          Text(
            'Empresas e filiais visiveis',
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
              onChanged: (value) =>
                  _toggleCompany(company, value ?? false, companies),
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
                        onChanged: (value) => _toggleEstablishment(
                          company,
                          establishment,
                          value ?? false,
                          companies,
                        ),
                      ),
                  ],
                ),
              ),
          ],
          const SizedBox(height: 16),
          if (_roleKeys.isNotEmpty) ...[
            Text(
              'Papeis atuais',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final roleKey in _roleKeys) Chip(label: Text(roleKey)),
              ],
            ),
            const SizedBox(height: 16),
          ],
          if (_permissionOverrides.isNotEmpty) ...[
            Text(
              'Overrides ativos',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final permission in _permissionOverrides)
                  Chip(label: Text(permission)),
              ],
            ),
            const SizedBox(height: 16),
          ],
          TextFormField(
            controller: _justificationController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Justificativa da alteracao',
              hintText:
                  'Explique por que este grant esta sendo ajustado neste momento.',
            ),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: PrimaryButton(
              label: currentUserId == _selectedUserId
                  ? 'Salvar grant e recarregar contexto'
                  : 'Salvar grant',
              icon: Icons.save_outlined,
              isLoading: _saving,
              onPressed: () => _saveGrant(companies),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryMetric extends StatelessWidget {
  const _SummaryMetric({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
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
    );
  }
}

extension on List<GovernanceUserSummary> {
  GovernanceUserSummary? get firstOrNull {
    if (isEmpty) {
      return null;
    }
    return first;
  }
}

extension on Iterable<AccessibleCompanySummary> {
  AccessibleCompanySummary? firstWhereOrNull(
    bool Function(AccessibleCompanySummary item) test,
  ) {
    for (final item in this) {
      if (test(item)) {
        return item;
      }
    }
    return null;
  }
}
