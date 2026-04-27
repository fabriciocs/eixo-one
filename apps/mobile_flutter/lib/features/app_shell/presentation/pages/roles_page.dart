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
import '../../../../features/auth/presentation/controllers/auth_providers.dart';
import '../../../../features/base_governance/domain/base_governance_permissions.dart';
import '../../../../features/base_governance/models/base_governance_models.dart';
import '../../../../features/base_governance/repositories/base_governance_repository.dart';
import '../../../../features/governance/domain/models/governance_models.dart';
import '../../../../features/governance/presentation/controllers/governance_providers.dart';
import '../../../../features/governance/presentation/widgets/governance_status_badge.dart';
import '../../../../shared/models/auth_session.dart';

class RolesPage extends ConsumerStatefulWidget {
  const RolesPage({super.key});

  @override
  ConsumerState<RolesPage> createState() => _RolesPageState();
}

class _RolesPageState extends ConsumerState<RolesPage> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _catalogSearchController =
      TextEditingController();
  final TextEditingController _keyController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _costCenterController = TextEditingController();

  BaseGovernanceListResult<BaseGovernanceRole>? _rolesResult;
  List<PermissionCatalogEntry> _permissionCatalog =
      const <PermissionCatalogEntry>[];
  AccessibleScopesSummary? _accessibleScopes;
  AppFailure? _loadFailure;
  AppFailure? _saveFailure;
  bool _loading = false;
  bool _saving = false;
  String _statusFilterKey = 'all';
  String? _selectedRoleId;
  bool _formSubmitted = false;
  _RoleEditorDraft? _draft;

  @override
  void initState() {
    super.initState();
    _loadPage();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _catalogSearchController.dispose();
    _keyController.dispose();
    _nameController.dispose();
    _descriptionController.dispose();
    _costCenterController.dispose();
    super.dispose();
  }

  GovernanceRecordStatus? get _statusFilter {
    return _statusFilterKey == 'all'
        ? null
        : GovernanceRecordStatus.fromWire(_statusFilterKey);
  }

  String? get _normalizedSearch {
    final value = _searchController.text.trim();
    return value.isEmpty ? null : value;
  }

  String? get _normalizedCatalogSearch {
    final value = _catalogSearchController.text.trim().toLowerCase();
    return value.isEmpty ? null : value;
  }

  Future<void> _loadPage({String? keepRoleId}) async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _loading = true;
      _loadFailure = null;
    });

    try {
      final repository = ref.read(baseGovernanceRepositoryProvider);
      final governanceRepository = ref.read(governanceRepositoryProvider);
      final results = await Future.wait<Object>([
        repository.listRoles(
          session,
          search: _normalizedSearch,
          status: _statusFilter,
          pageSize: 100,
        ),
        repository.listPermissionCatalog(session),
        governanceRepository.fetchAccessibleScopes(session),
      ]);

      if (!mounted) {
        return;
      }

      final rolesResult =
          results[0] as BaseGovernanceListResult<BaseGovernanceRole>;
      final permissionCatalog = results[1] as List<PermissionCatalogEntry>;
      final accessibleScopes = results[2] as AccessibleScopesSummary;

      final nextSelectedRoleId =
          rolesResult.items.any((item) => item.roleId == keepRoleId)
          ? keepRoleId
          : rolesResult.items.any((item) => item.roleId == _selectedRoleId)
          ? _selectedRoleId
          : rolesResult.items.firstOrNull?.roleId;

      setState(() {
        _rolesResult = rolesResult;
        _permissionCatalog = permissionCatalog;
        _accessibleScopes = accessibleScopes;
        _selectedRoleId = nextSelectedRoleId;
        _saveFailure = null;
      });

      if (nextSelectedRoleId != null) {
        final selectedRole = rolesResult.items.firstWhere(
          (item) => item.roleId == nextSelectedRoleId,
        );
        _applyDraft(_RoleEditorDraft.fromRole(selectedRole));
      } else if (_canManageWith(session, accessibleScopes, rolesResult.items)) {
        _startNewDraft();
      } else {
        _clearDraft();
      }
    } on AppFailure catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _loadFailure = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  void _applyDraft(_RoleEditorDraft draft) {
    setState(() {
      _draft = draft;
      _saveFailure = null;
      _formSubmitted = false;
    });
    _keyController.text = draft.key;
    _nameController.text = draft.name;
    _descriptionController.text = draft.description;
    _costCenterController.text = draft.costCenterIds.join(', ');
  }

  void _clearDraft() {
    setState(() {
      _draft = null;
      _saveFailure = null;
      _formSubmitted = false;
      _selectedRoleId = null;
    });
    _keyController.clear();
    _nameController.clear();
    _descriptionController.clear();
    _costCenterController.clear();
  }

  void _startNewDraft() {
    _selectedRoleId = null;
    _applyDraft(_RoleEditorDraft.empty());
  }

  void _selectRole(BaseGovernanceRole role) {
    _selectedRoleId = role.roleId;
    _applyDraft(_RoleEditorDraft.fromRole(role));
  }

  Set<String> _resolveEffectivePermissions(AuthSession session) {
    final effective = <String>{...session.user.permissionKeys};
    final accessibleScopes = _accessibleScopes;
    if (accessibleScopes == null) {
      return effective;
    }

    effective.addAll(accessibleScopes.grant.permissionOverrides);
    for (final roleKey in accessibleScopes.grant.roleKeys) {
      final role = _rolesResult?.items.firstWhereOrNull(
        (item) => item.key == roleKey && item.isActive,
      );
      if (role == null) {
        continue;
      }
      effective.addAll(role.permissionKeys);
    }
    return effective;
  }

  bool _canManageWith(
    AuthSession session,
    AccessibleScopesSummary? accessibleScopes,
    List<BaseGovernanceRole> roles,
  ) {
    final effective = <String>{...session.user.permissionKeys};
    if (accessibleScopes != null) {
      effective.addAll(accessibleScopes.grant.permissionOverrides);
      for (final roleKey in accessibleScopes.grant.roleKeys) {
        final role = roles.firstWhereOrNull(
          (item) => item.key == roleKey && item.isActive,
        );
        if (role == null) {
          continue;
        }
        effective.addAll(role.permissionKeys);
      }
    }

    return effective.contains(BaseGovernancePermissions.rolesManage);
  }

  bool _validateDraft(_RoleEditorDraft draft) {
    final normalizedKey = draft.key.trim().toLowerCase();
    final validKey = RegExp(
      r'^[a-z0-9][a-z0-9._-]{1,78}[a-z0-9]$',
    ).hasMatch(normalizedKey);

    return validKey &&
        draft.name.trim().length >= 3 &&
        draft.permissionKeys.isNotEmpty;
  }

  List<String> _parseDelimitedValues(String rawValue) {
    return rawValue
        .split(RegExp(r'[,;\n]'))
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toSet()
        .toList(growable: false)
      ..sort();
  }

  Future<void> _saveDraft() async {
    final session = ref.read(authSessionProvider);
    final draft = _draft;
    if (session == null || draft == null) {
      return;
    }

    setState(() {
      _formSubmitted = true;
      _saveFailure = null;
    });

    if (!_validateDraft(draft)) {
      return;
    }

    setState(() {
      _saving = true;
    });

    try {
      final repository = ref.read(baseGovernanceRepositoryProvider);
      final savedRole = draft.isNew
          ? await repository.createRole(session, draft.toCreateInput())
          : await repository.updateRole(
              session,
              draft.roleId!,
              draft.toUpdateInput(),
            );

      if (!mounted) {
        return;
      }

      await _loadPage(keepRoleId: savedRole.roleId);
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            draft.isNew
                ? 'Perfil criado com sucesso.'
                : 'Perfil atualizado com sucesso.',
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

  Map<String, List<PermissionCatalogEntry>> _groupedPermissions(
    List<PermissionCatalogEntry> entries,
  ) {
    final filtered =
        entries
            .where((entry) {
              final search = _normalizedCatalogSearch;
              if (search == null) {
                return true;
              }

              final haystack = [
                entry.key,
                entry.label,
                entry.description,
                entry.moduleKey,
              ].join(' ').toLowerCase();
              return haystack.contains(search);
            })
            .toList(growable: false)
          ..sort((left, right) {
            final byModule = left.moduleKey.compareTo(right.moduleKey);
            if (byModule != 0) {
              return byModule;
            }
            return left.label.compareTo(right.label);
          });

    final grouped = <String, List<PermissionCatalogEntry>>{};
    for (final entry in filtered) {
      grouped.putIfAbsent(entry.moduleKey, () => <PermissionCatalogEntry>[]);
      grouped[entry.moduleKey]!.add(entry);
    }
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authSessionProvider);
    final roles = _rolesResult?.items ?? const <BaseGovernanceRole>[];
    final canManage =
        session != null && _canManageWith(session, _accessibleScopes, roles);
    final effectivePermissions = session == null
        ? const <String>{}
        : _resolveEffectivePermissions(session);

    return DefaultTabController(
      length: 2,
      child: ResponsivePage(
        title: 'Papeis e permissoes',
        subtitle:
            'Catalogo RBAC por tenant com escopo por empresa, filial e centro de custo.',
        actions: [
          OutlinedButton.icon(
            onPressed: _loading
                ? null
                : () => _loadPage(keepRoleId: _selectedRoleId),
            icon: const Icon(Icons.refresh),
            label: const Text('Atualizar'),
          ),
          if (canManage)
            PrimaryButton(
              label: 'Novo perfil',
              icon: Icons.add,
              onPressed: _startNewDraft,
            ),
        ],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const NetworkStatusBanner(),
            const SizedBox(height: 16),
            _buildSummaryCards(roles, effectivePermissions.length),
            const SizedBox(height: 16),
            const TabBar(
              tabs: [
                Tab(text: 'Perfis'),
                Tab(text: 'Catalogo'),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _loading && _rolesResult == null
                  ? const LoadingState(
                      message: 'Carregando papeis e permissoes...',
                    )
                  : _loadFailure != null && _rolesResult == null
                  ? _loadFailure!.code == 'FORBIDDEN'
                        ? const EmptyState(
                            title: 'Sem permissao para papeis',
                            message:
                                'Seu perfil atual nao pode consultar o catalogo administrativo de roles.',
                          )
                        : ErrorState(
                            failure: _loadFailure!,
                            onRetry: () =>
                                _loadPage(keepRoleId: _selectedRoleId),
                          )
                  : TabBarView(
                      children: [
                        _buildRolesTab(context, canManage),
                        _buildCatalogTab(),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCards(
    List<BaseGovernanceRole> roles,
    int effectivePermissionCount,
  ) {
    final activeRoles = roles.where((item) => item.isActive).length;
    final draftRoles = roles
        .where((item) => item.status == GovernanceRecordStatus.draft)
        .length;

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        AppCard(
          child: SizedBox(
            width: 220,
            child: _MetricCard(label: 'Perfis ativos', value: '$activeRoles'),
          ),
        ),
        AppCard(
          child: SizedBox(
            width: 220,
            child: _MetricCard(
              label: 'Perfis em rascunho',
              value: '$draftRoles',
            ),
          ),
        ),
        AppCard(
          child: SizedBox(
            width: 260,
            child: _MetricCard(
              label: 'Permissoes conhecidas',
              value: '${_permissionCatalog.length}',
            ),
          ),
        ),
        AppCard(
          child: SizedBox(
            width: 260,
            child: _MetricCard(
              label: 'Permissoes efetivas da sessao',
              value: '$effectivePermissionCount',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRolesTab(BuildContext context, bool canManage) {
    final roles = _rolesResult?.items ?? const <BaseGovernanceRole>[];
    final companies =
        _accessibleScopes?.companies ?? const <AccessibleCompanySummary>[];

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 1100;
        final listWidth = isWide
            ? (constraints.maxWidth * 0.38) - 8
            : constraints.maxWidth;
        final editorWidth = isWide
            ? (constraints.maxWidth * 0.62) - 8
            : constraints.maxWidth;

        return ListView(
          children: [
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                SizedBox(
                  width: listWidth,
                  child: _buildRolesListSection(roles, canManage),
                ),
                SizedBox(
                  width: editorWidth,
                  child: _buildRoleEditorSection(context, companies, canManage),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildRolesListSection(
    List<BaseGovernanceRole> roles,
    bool canManage,
  ) {
    return FormSection(
      title: 'Catalogo de perfis',
      description:
          'Busque por nome ou chave e revise o escopo atual antes de editar um papel.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilterBar(
            filters: [
              SizedBox(
                width: 280,
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    labelText: 'Buscar por nome ou chave',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: () => _loadPage(keepRoleId: _selectedRoleId),
                    ),
                  ),
                  onSubmitted: (_) => _loadPage(keepRoleId: _selectedRoleId),
                ),
              ),
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<String>(
                  key: ValueKey('roles-filter-$_statusFilterKey'),
                  initialValue: _statusFilterKey,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('Todos')),
                    DropdownMenuItem(value: 'draft', child: Text('Rascunho')),
                    DropdownMenuItem(value: 'active', child: Text('Ativo')),
                    DropdownMenuItem(value: 'inactive', child: Text('Inativo')),
                    DropdownMenuItem(
                      value: 'archived',
                      child: Text('Arquivado'),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _statusFilterKey = value ?? 'all';
                    });
                    _loadPage(keepRoleId: _selectedRoleId);
                  },
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  _searchController.clear();
                  setState(() {
                    _statusFilterKey = 'all';
                  });
                  _loadPage();
                },
                icon: const Icon(Icons.filter_alt_off_outlined),
                label: const Text('Limpar'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 460,
            child: roles.isEmpty
                ? EmptyState(
                    title: 'Nenhum perfil encontrado',
                    message: canManage
                        ? 'Use a acao "Novo perfil" para cadastrar o primeiro papel administravel.'
                        : 'Nao ha perfis visiveis para o filtro atual.',
                  )
                : ListView.separated(
                    itemCount: roles.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final role = roles[index];
                      final selected = role.roleId == _selectedRoleId;
                      return Material(
                        color: selected
                            ? Theme.of(context).colorScheme.primaryContainer
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => _selectRole(role),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            role.name,
                                            style: Theme.of(
                                              context,
                                            ).textTheme.titleMedium,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            role.key,
                                            style: Theme.of(
                                              context,
                                            ).textTheme.bodySmall,
                                          ),
                                        ],
                                      ),
                                    ),
                                    GovernanceStatusBadge(status: role.status),
                                  ],
                                ),
                                if ((role.description ?? '').isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  Text(role.description!),
                                ],
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    Chip(
                                      label: Text(
                                        '${role.permissionKeys.length} permissoes',
                                      ),
                                    ),
                                    Chip(
                                      label: Text(
                                        '${role.companyIds.length} empresas',
                                      ),
                                    ),
                                    Chip(
                                      label: Text(
                                        '${role.establishmentIds.length} filiais',
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleEditorSection(
    BuildContext context,
    List<AccessibleCompanySummary> companies,
    bool canManage,
  ) {
    final draft = _draft;
    if (draft == null) {
      return const EmptyState(
        title: 'Selecione um perfil',
        message:
            'Escolha um papel no catalogo para revisar suas permissoes ou criar um novo registro.',
      );
    }

    final groupedPermissions = _groupedPermissions(_permissionCatalog);

    return FormSection(
      title: draft.isNew ? 'Novo perfil' : 'Detalhe do perfil',
      description:
          'A configuracao abaixo controla escopo administrativo e autorizacao no backend.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!canManage) ...[
            const EmptyState(
              title: 'Perfil em leitura',
              message:
                  'Sua sessao pode consultar o catalogo, mas nao pode criar nem editar papeis.',
            ),
            const SizedBox(height: 16),
          ],
          if (_saveFailure != null) ...[
            ErrorState(failure: _saveFailure!),
            const SizedBox(height: 16),
          ],
          TextField(
            controller: _keyController,
            enabled: canManage,
            decoration: InputDecoration(
              labelText: 'Chave tecnica',
              helperText: 'Use minusculas, pontos, hifens ou underscore.',
              errorText:
                  _formSubmitted &&
                      !RegExp(
                        r'^[a-z0-9][a-z0-9._-]{1,78}[a-z0-9]$',
                      ).hasMatch(draft.key.trim().toLowerCase())
                  ? 'Use entre 3 e 80 caracteres em formato tecnico.'
                  : null,
            ),
            onChanged: (value) {
              draft.key = value;
            },
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nameController,
            enabled: canManage,
            decoration: InputDecoration(
              labelText: 'Nome do perfil',
              errorText: _formSubmitted && draft.name.trim().length < 3
                  ? 'Informe um nome com pelo menos 3 caracteres.'
                  : null,
            ),
            onChanged: (value) {
              draft.name = value;
            },
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _descriptionController,
            enabled: canManage,
            minLines: 2,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Descricao',
              hintText:
                  'Explique quando este papel deve ser usado e quais responsabilidades ele separa.',
            ),
            onChanged: (value) {
              draft.description = value;
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<GovernanceRecordStatus>(
            key: ValueKey(
              'role-status-${draft.roleId ?? 'new'}-${draft.status.wireName}',
            ),
            initialValue: draft.status,
            decoration: const InputDecoration(labelText: 'Status'),
            items: GovernanceRecordStatus.values
                .map(
                  (status) => DropdownMenuItem(
                    value: status,
                    child: Text(status.label),
                  ),
                )
                .toList(growable: false),
            onChanged: canManage
                ? (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      draft.status = value;
                    });
                  }
                : null,
          ),
          const SizedBox(height: 24),
          Text(
            'Escopo autorizado',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Selecione empresas e filiais onde este papel pode operar. Sem marcacao, o papel permanece com escopo de tenant.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          if (companies.isEmpty)
            const AppCard(
              child: Text(
                'Nenhuma empresa acessivel foi encontrada para esta sessao.',
              ),
            )
          else
            for (final company in companies) ...[
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: draft.companyIds.contains(company.companyId),
                title: Text(company.legalName),
                subtitle: Text(
                  '${company.establishments.length} estabelecimentos disponiveis',
                ),
                onChanged: canManage
                    ? (value) => setState(() {
                        if (value ?? false) {
                          draft.companyIds.add(company.companyId);
                        } else {
                          draft.companyIds.remove(company.companyId);
                          draft.establishmentIds.removeWhere(
                            (item) => company.establishments.any(
                              (establishment) =>
                                  establishment.establishmentId == item,
                            ),
                          );
                        }
                      })
                    : null,
              ),
              if (draft.companyIds.contains(company.companyId))
                Padding(
                  padding: const EdgeInsets.only(left: 12, bottom: 12),
                  child: Column(
                    children: [
                      for (final establishment in company.establishments)
                        CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          value: draft.establishmentIds.contains(
                            establishment.establishmentId,
                          ),
                          title: Text(establishment.legalNameAtEstablishment),
                          subtitle: Text(establishment.establishmentType.label),
                          onChanged: canManage
                              ? (value) => setState(() {
                                  draft.companyIds.add(company.companyId);
                                  if (value ?? false) {
                                    draft.establishmentIds.add(
                                      establishment.establishmentId,
                                    );
                                  } else {
                                    draft.establishmentIds.remove(
                                      establishment.establishmentId,
                                    );
                                  }
                                })
                              : null,
                        ),
                    ],
                  ),
                ),
            ],
          const SizedBox(height: 24),
          TextField(
            controller: _costCenterController,
            enabled: canManage,
            decoration: const InputDecoration(
              labelText: 'Centros de custo',
              hintText: 'Exemplo: cc_financeiro, cc_fiscal',
              helperText:
                  'Separe multiplos IDs por virgula, ponto e virgula ou quebra de linha.',
            ),
            minLines: 1,
            maxLines: 3,
            onChanged: (value) {
              draft.costCenterIds
                ..clear()
                ..addAll(_parseDelimitedValues(value));
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Permissoes deste perfil',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              Chip(label: Text('${draft.permissionKeys.length} selecionadas')),
            ],
          ),
          const SizedBox(height: 8),
          if (_formSubmitted && draft.permissionKeys.isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                'Selecione ao menos uma permissao para salvar o perfil.',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          for (final entry in groupedPermissions.entries)
            ExpansionTile(
              title: Text(_formatModuleLabel(entry.key)),
              subtitle: Text('${entry.value.length} permissoes'),
              children: [
                for (final permission in entry.value)
                  CheckboxListTile(
                    dense: true,
                    value: draft.permissionKeys.contains(permission.key),
                    title: Text(permission.label),
                    subtitle: Text(permission.description),
                    secondary: Chip(label: Text(permission.actionKey)),
                    onChanged: canManage
                        ? (value) => setState(() {
                            if (value ?? false) {
                              draft.permissionKeys.add(permission.key);
                            } else {
                              draft.permissionKeys.remove(permission.key);
                            }
                          })
                        : null,
                  ),
              ],
            ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: PrimaryButton(
              label: draft.isNew ? 'Criar perfil' : 'Salvar perfil',
              icon: Icons.save_outlined,
              isLoading: _saving,
              onPressed: canManage ? _saveDraft : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCatalogTab() {
    final groupedPermissions = _groupedPermissions(_permissionCatalog);

    return ListView(
      children: [
        FormSection(
          title: 'Catalogo de permissoes',
          description:
              'Referencia unica para montar papeis com allowlist de acoes por modulo e escopo.',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FilterBar(
                filters: [
                  SizedBox(
                    width: 320,
                    child: TextField(
                      controller: _catalogSearchController,
                      decoration: InputDecoration(
                        labelText: 'Buscar permissao',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.search),
                          onPressed: () => setState(() {}),
                        ),
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      _catalogSearchController.clear();
                      setState(() {});
                    },
                    icon: const Icon(Icons.filter_alt_off_outlined),
                    label: const Text('Limpar'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (groupedPermissions.isEmpty)
                const EmptyState(
                  title: 'Nenhuma permissao encontrada',
                  message:
                      'A busca atual nao encontrou entradas no catalogo de autorizacao.',
                )
              else
                for (final entry in groupedPermissions.entries) ...[
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _formatModuleLabel(entry.key),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 12),
                        for (final permission in entry.value) ...[
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(permission.label),
                            subtitle: Text(permission.description),
                            trailing: SizedBox(
                              width: 180,
                              child: Align(
                                alignment: Alignment.centerRight,
                                child: Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  alignment: WrapAlignment.end,
                                  children: [
                                    Chip(label: Text(permission.actionKey)),
                                    Chip(
                                      label: Text(
                                        permission.scopeTypes.join(' / '),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const Divider(),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
            ],
          ),
        ),
      ],
    );
  }

  String _formatModuleLabel(String moduleKey) {
    switch (moduleKey) {
      case 'users':
        return 'Usuarios';
      case 'roles':
        return 'Papeis';
      case 'audit':
        return 'Auditoria';
      case 'reporting':
        return 'Relatorios';
      default:
        return moduleKey.replaceAll('.', ' ').replaceAll('_', ' ');
    }
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value});

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

class _RoleEditorDraft {
  _RoleEditorDraft({
    required this.key,
    required this.name,
    required this.description,
    required this.status,
    required this.permissionKeys,
    required this.companyIds,
    required this.establishmentIds,
    required this.costCenterIds,
    this.roleId,
    this.expectedVersion,
  });

  factory _RoleEditorDraft.empty() {
    return _RoleEditorDraft(
      key: '',
      name: '',
      description: '',
      status: GovernanceRecordStatus.draft,
      permissionKeys: <String>{},
      companyIds: <String>{},
      establishmentIds: <String>{},
      costCenterIds: <String>{},
    );
  }

  factory _RoleEditorDraft.fromRole(BaseGovernanceRole role) {
    return _RoleEditorDraft(
      roleId: role.roleId,
      expectedVersion: role.version,
      key: role.key,
      name: role.name,
      description: role.description ?? '',
      status: role.status,
      permissionKeys: role.permissionKeys.toSet(),
      companyIds: role.companyIds.toSet(),
      establishmentIds: role.establishmentIds.toSet(),
      costCenterIds: role.costCenterIds.toSet(),
    );
  }

  String? roleId;
  int? expectedVersion;
  String key;
  String name;
  String description;
  GovernanceRecordStatus status;
  final Set<String> permissionKeys;
  final Set<String> companyIds;
  final Set<String> establishmentIds;
  final Set<String> costCenterIds;

  bool get isNew => roleId == null;

  List<String> _sorted(Iterable<String> values) {
    final sorted = values.toList(growable: false)..sort();
    return sorted;
  }

  CreateBaseGovernanceRoleInput toCreateInput() {
    return CreateBaseGovernanceRoleInput(
      key: key.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim().isEmpty ? null : description.trim(),
      permissionKeys: _sorted(permissionKeys),
      companyIds: _sorted(companyIds),
      establishmentIds: _sorted(establishmentIds),
      costCenterIds: _sorted(costCenterIds),
      status: status,
    );
  }

  UpdateBaseGovernanceRoleInput toUpdateInput() {
    return UpdateBaseGovernanceRoleInput(
      expectedVersion: expectedVersion ?? 0,
      key: key.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim(),
      permissionKeys: _sorted(permissionKeys),
      companyIds: _sorted(companyIds),
      establishmentIds: _sorted(establishmentIds),
      costCenterIds: _sorted(costCenterIds),
      status: status,
    );
  }
}

extension on List<BaseGovernanceRole> {
  BaseGovernanceRole? get firstOrNull {
    if (isEmpty) {
      return null;
    }
    return first;
  }
}

extension on Iterable<BaseGovernanceRole> {
  BaseGovernanceRole? firstWhereOrNull(
    bool Function(BaseGovernanceRole item) test,
  ) {
    for (final item in this) {
      if (test(item)) {
        return item;
      }
    }
    return null;
  }
}
