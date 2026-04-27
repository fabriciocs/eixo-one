import 'dart:convert';

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
import '../../../base_governance/domain/base_governance_permissions.dart';
import '../../../base_governance/models/base_governance_models.dart';
import '../../../base_governance/repositories/base_governance_repository.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _valueController = TextEditingController();

  BaseGovernanceListResult<BaseGovernanceSetting>? _settingsResult;
  AppFailure? _loadFailure;
  AppFailure? _saveFailure;
  bool _loading = false;
  bool _saving = false;
  String _scopeFilter = 'all';
  String? _selectedSettingKey;
  _SettingEditorDraft? _draft;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _valueController.dispose();
    super.dispose();
  }

  String? get _normalizedSearch {
    final value = _searchController.text.trim();
    return value.isEmpty ? null : value;
  }

  SettingScopeType? get _scopeType {
    return _scopeFilter == 'all'
        ? null
        : SettingScopeType.fromWire(_scopeFilter);
  }

  Future<void> _loadSettings({String? keepSettingKey}) async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _loading = true;
      _loadFailure = null;
    });

    try {
      final result = await ref.read(baseGovernanceRepositoryProvider).listSettings(
            session,
            search: _normalizedSearch,
            scopeType: _scopeType,
            pageSize: 100,
          );

      if (!mounted) {
        return;
      }

      final nextSelectedKey =
          result.items.any((item) => item.settingKey == keepSettingKey)
          ? keepSettingKey
          : result.items.any((item) => item.settingKey == _selectedSettingKey)
          ? _selectedSettingKey
          : result.items.firstOrNull?.settingKey;

      setState(() {
        _settingsResult = result;
        _selectedSettingKey = nextSelectedKey;
        _saveFailure = null;
      });

      final selected = result.items.firstWhereOrNull(
        (item) => item.settingKey == nextSelectedKey,
      );
      if (selected != null) {
        _selectSetting(selected);
      } else {
        _draft = null;
        _valueController.clear();
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

  void _selectSetting(BaseGovernanceSetting setting) {
    final draft = _SettingEditorDraft.fromSetting(setting);
    setState(() {
      _selectedSettingKey = setting.settingKey;
      _draft = draft;
      _saveFailure = null;
    });
    _valueController.text = draft.serializedValue;
  }

  bool _canManage() {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return false;
    }
    return session.user.permissionKeys.contains(
      BaseGovernancePermissions.settingsManage,
    );
  }

  bool _canRead() {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return false;
    }
    return session.user.permissionKeys.contains(
      BaseGovernancePermissions.settingsRead,
    );
  }

  Object? _parseDraftValue(_SettingEditorDraft draft) {
    switch (draft.valueType) {
      case SettingValueType.string:
        return _valueController.text.trim();
      case SettingValueType.number:
        return num.tryParse(_valueController.text.trim());
      case SettingValueType.boolean:
        return draft.booleanValue;
      case SettingValueType.json:
        final decoded = jsonDecode(_valueController.text.trim());
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
        if (decoded is Map) {
          return decoded.cast<String, dynamic>();
        }
        return null;
    }
  }

  Future<void> _saveSetting() async {
    final session = ref.read(authSessionProvider);
    final draft = _draft;
    if (session == null || draft == null) {
      return;
    }

    setState(() {
      _saveFailure = null;
    });

    final parsedValue = _parseDraftValue(draft);
    if (parsedValue == null) {
      setState(() {
        _saveFailure = const AppFailure(
          title: 'Revise os dados informados',
          message:
              'O valor informado nao corresponde ao tipo esperado desta configuracao.',
          code: 'VALIDATION_ERROR',
        );
      });
      return;
    }

    setState(() {
      _saving = true;
    });

    try {
      final savedSetting = await ref
          .read(baseGovernanceRepositoryProvider)
          .updateSetting(
            session,
            draft.settingKey,
            UpdateBaseGovernanceSettingInput(
              scopeType: draft.scopeType,
              companyId: draft.companyId,
              establishmentId: draft.establishmentId,
              value: parsedValue,
              expectedVersion: draft.expectedVersion,
            ),
          );

      if (!mounted) {
        return;
      }

      await _loadSettings(keepSettingKey: savedSetting.settingKey);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Configuracao atualizada com sucesso.')),
      );
    } on FormatException {
      if (!mounted) {
        return;
      }
      setState(() {
        _saveFailure = const AppFailure(
          title: 'JSON invalido',
          message: 'Revise a estrutura JSON antes de salvar a configuracao.',
          code: 'VALIDATION_ERROR',
        );
      });
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

  Future<void> _resetSetting() async {
    final session = ref.read(authSessionProvider);
    final draft = _draft;
    if (session == null || draft == null) {
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      final savedSetting = await ref
          .read(baseGovernanceRepositoryProvider)
          .resetSetting(
            session,
            draft.settingKey,
            ResetBaseGovernanceSettingInput(
              scopeType: draft.scopeType,
              companyId: draft.companyId,
              establishmentId: draft.establishmentId,
              expectedVersion: draft.expectedVersion,
            ),
          );

      if (!mounted) {
        return;
      }

      await _loadSettings(keepSettingKey: savedSetting.settingKey);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Configuracao restaurada para o padrao.')),
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

  @override
  Widget build(BuildContext context) {
    final settings = _settingsResult?.items ?? const <BaseGovernanceSetting>[];
    final canRead = _canRead();
    final canManage = _canManage();

    return ResponsivePage(
      title: 'Configuracoes',
      subtitle:
          'Parametros versionados por modulo e escopo, com fallback para o padrao.',
      actions: [
        OutlinedButton.icon(
          onPressed: _loading ? null : () => _loadSettings(),
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
                  child: _MetricCard(
                    label: 'Configuracoes visiveis',
                    value: '${settings.length}',
                  ),
                ),
              ),
              AppCard(
                child: SizedBox(
                  width: 220,
                  child: _MetricCard(
                    label: 'Escopos ativos',
                    value:
                        '${settings.map((item) => item.scopeType.wireName).toSet().length}',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _loading && _settingsResult == null
                ? const LoadingState(
                    message: 'Carregando configuracoes administrativas...',
                  )
                : !canRead
                ? const EmptyState(
                    title: 'Sem permissao para configuracoes',
                    message:
                        'Sua sessao atual nao pode consultar parametros administrativos.',
                  )
                : _loadFailure != null && _settingsResult == null
                ? ErrorState(
                    failure: _loadFailure!,
                    onRetry: () => _loadSettings(),
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth >= 1100;
                      return ListView(
                        children: [
                          Wrap(
                            spacing: 16,
                            runSpacing: 16,
                            children: [
                              SizedBox(
                                width: isWide
                                    ? (constraints.maxWidth * 0.4) - 8
                                    : constraints.maxWidth,
                                child: _buildSettingsList(settings),
                              ),
                              SizedBox(
                                width: isWide
                                    ? (constraints.maxWidth * 0.6) - 8
                                    : constraints.maxWidth,
                                child: _buildSettingEditor(canManage),
                              ),
                            ],
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

  Widget _buildSettingsList(List<BaseGovernanceSetting> settings) {
    return FormSection(
      title: 'Catalogo de configuracoes',
      description:
          'Filtre por chave, modulo ou escopo e revise o impacto antes de alterar o valor.',
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
                    labelText: 'Buscar por chave ou titulo',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: () => _loadSettings(),
                    ),
                  ),
                  onSubmitted: (_) => _loadSettings(),
                ),
              ),
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<String>(
                  key: ValueKey('settings-scope-$_scopeFilter'),
                  initialValue: _scopeFilter,
                  decoration: const InputDecoration(labelText: 'Escopo'),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('Todos')),
                    DropdownMenuItem(value: 'TENANT', child: Text('Tenant')),
                    DropdownMenuItem(value: 'COMPANY', child: Text('Empresa')),
                    DropdownMenuItem(
                      value: 'ESTABLISHMENT',
                      child: Text('Filial'),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _scopeFilter = value ?? 'all';
                    });
                    _loadSettings();
                  },
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  _searchController.clear();
                  setState(() {
                    _scopeFilter = 'all';
                  });
                  _loadSettings();
                },
                icon: const Icon(Icons.filter_alt_off_outlined),
                label: const Text('Limpar'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (settings.isEmpty)
            const EmptyState(
              title: 'Nenhuma configuracao encontrada',
              message:
                  'Nao ha registros para os filtros aplicados neste momento.',
            )
          else
            SizedBox(
              height: 560,
              child: ListView.separated(
                itemCount: settings.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final setting = settings[index];
                  final selected = setting.settingKey == _selectedSettingKey;
                  return Material(
                    color: selected
                        ? Theme.of(context).colorScheme.primaryContainer
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => _selectSetting(setting),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              setting.label,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              setting.settingKey,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                Chip(label: Text(setting.scopeType.label)),
                                Chip(label: Text(setting.moduleKey)),
                                Chip(label: Text('v${setting.version}')),
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

  Widget _buildSettingEditor(bool canManage) {
    final draft = _draft;
    if (draft == null) {
      return const EmptyState(
        title: 'Selecione uma configuracao',
        message:
            'Escolha um item no catalogo para revisar o valor atual e comparar com o padrao.',
      );
    }

    return FormSection(
      title: 'Detalhe da configuracao',
      description:
          'Toda alteracao incrementa a versao e pode ser restaurada ao valor padrao.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_saveFailure != null) ...[
            ErrorState(failure: _saveFailure!),
            const SizedBox(height: 16),
          ],
          Text(
            draft.label,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(draft.settingKey),
          if ((draft.description ?? '').isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(draft.description!),
          ],
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(label: Text(draft.scopeType.label)),
              Chip(label: Text(draft.moduleKey)),
              Chip(label: Text('Tipo ${draft.valueType.wireName}')),
              Chip(label: Text('v${draft.expectedVersion}')),
            ],
          ),
          const SizedBox(height: 24),
          if (draft.valueType == SettingValueType.boolean)
            DropdownButtonFormField<bool>(
              key: ValueKey(
                'setting-bool-${draft.settingKey}-${draft.booleanValue}',
              ),
              initialValue: draft.booleanValue,
              decoration: const InputDecoration(labelText: 'Valor atual'),
              items: const [
                DropdownMenuItem(value: true, child: Text('true')),
                DropdownMenuItem(value: false, child: Text('false')),
              ],
              onChanged: canManage
                  ? (value) {
                      if (value == null) {
                        return;
                      }
                      setState(() {
                        draft.booleanValue = value;
                      });
                    }
                  : null,
            )
          else
            TextField(
              controller: _valueController,
              enabled: canManage,
              minLines: draft.valueType == SettingValueType.json ? 6 : 1,
              maxLines: draft.valueType == SettingValueType.json ? 10 : 3,
              decoration: InputDecoration(
                labelText: 'Valor atual',
                helperText: draft.valueType == SettingValueType.json
                    ? 'Use JSON valido para objetos versionados.'
                    : null,
              ),
            ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Valor padrao',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 8),
                Text(_serializeValue(draft.defaultValue)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (!canManage)
            const EmptyState(
              title: 'Perfil em leitura',
              message:
                  'Sua sessao atual pode consultar os parametros, mas nao pode altera-los.',
            )
          else
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                PrimaryButton(
                  label: 'Salvar configuracao',
                  icon: Icons.save_outlined,
                  isLoading: _saving,
                  onPressed: _saveSetting,
                ),
                OutlinedButton.icon(
                  onPressed: _saving ? null : _resetSetting,
                  icon: const Icon(Icons.restore_outlined),
                  label: const Text('Restaurar padrao'),
                ),
              ],
            ),
        ],
      ),
    );
  }

  String _serializeValue(Object? value) {
    if (value is Map || value is List) {
      return const JsonEncoder.withIndent('  ').convert(value);
    }
    return '$value';
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

class _SettingEditorDraft {
  _SettingEditorDraft({
    required this.settingKey,
    required this.label,
    required this.moduleKey,
    required this.scopeType,
    required this.valueType,
    required this.defaultValue,
    required this.expectedVersion,
    this.description,
    this.companyId,
    this.establishmentId,
    this.booleanValue = false,
    required this.serializedValue,
  });

  factory _SettingEditorDraft.fromSetting(BaseGovernanceSetting setting) {
    return _SettingEditorDraft(
      settingKey: setting.settingKey,
      label: setting.label,
      description: setting.description,
      moduleKey: setting.moduleKey,
      scopeType: setting.scopeType,
      companyId: setting.companyId,
      establishmentId: setting.establishmentId,
      valueType: setting.valueType,
      defaultValue: setting.defaultValue,
      expectedVersion: setting.version,
      booleanValue: setting.value is bool ? setting.value as bool : false,
      serializedValue: _serialize(setting.value),
    );
  }

  final String settingKey;
  final String label;
  final String? description;
  final String moduleKey;
  final SettingScopeType scopeType;
  final String? companyId;
  final String? establishmentId;
  final SettingValueType valueType;
  final Object? defaultValue;
  final int expectedVersion;
  bool booleanValue;
  final String serializedValue;

  static String _serialize(Object? value) {
    if (value is Map || value is List) {
      return const JsonEncoder.withIndent('  ').convert(value);
    }
    return '$value';
  }
}

extension on List<BaseGovernanceSetting> {
  BaseGovernanceSetting? get firstOrNull {
    if (isEmpty) {
      return null;
    }
    return first;
  }
}

extension on Iterable<BaseGovernanceSetting> {
  BaseGovernanceSetting? firstWhereOrNull(
    bool Function(BaseGovernanceSetting item) test,
  ) {
    for (final item in this) {
      if (test(item)) {
        return item;
      }
    }
    return null;
  }
}
