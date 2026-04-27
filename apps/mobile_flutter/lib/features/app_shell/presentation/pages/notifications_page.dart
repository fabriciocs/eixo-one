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

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _templateKeyController = TextEditingController(
    text: 'notifications.custom.manual.email',
  );
  final TextEditingController _templateLabelController = TextEditingController(
    text: 'Envio manual administrativo',
  );
  final TextEditingController _templateEventController = TextEditingController(
    text: 'manual.dispatch',
  );
  final TextEditingController _templateSubjectController =
      TextEditingController(text: 'Alerta administrativo');
  final TextEditingController _templateBodyController = TextEditingController(
    text:
        'Ola {{customerName}}, existe uma pendencia referente ao documento {{documentCode}}.',
  );
  final TextEditingController _recipientController = TextEditingController(
    text: 'financeiro@cliente.com',
  );
  final TextEditingController _variablesController = TextEditingController(
    text: '{"customerName":"Cliente Demo","documentCode":"DOC-101"}',
  );

  BaseGovernanceListResult<NotificationTemplateRecord>? _templatesResult;
  BaseGovernanceListResult<NotificationDeliveryRecord>? _deliveriesResult;
  AppFailure? _loadFailure;
  AppFailure? _saveFailure;
  bool _loading = false;
  bool _saving = false;
  NotificationChannel? _channelFilter;
  NotificationDeliveryStatus? _deliveryStatusFilter;
  NotificationChannel _draftChannel = NotificationChannel.email;
  NotificationTemplateStatus _draftStatus = NotificationTemplateStatus.active;
  String? _selectedTemplateId;
  String? _selectedDeliveryId;
  bool _requiresConsent = true;
  bool _allowAttachments = false;
  bool _consentGranted = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _templateKeyController.dispose();
    _templateLabelController.dispose();
    _templateEventController.dispose();
    _templateSubjectController.dispose();
    _templateBodyController.dispose();
    _recipientController.dispose();
    _variablesController.dispose();
    super.dispose();
  }

  bool _canRead() {
    final session = ref.read(authSessionProvider);
    return session?.user.permissionKeys.contains(
          BaseGovernancePermissions.notificationsRead,
        ) ??
        false;
  }

  bool _canManage() {
    final session = ref.read(authSessionProvider);
    return session?.user.permissionKeys.contains(
          BaseGovernancePermissions.notificationsManage,
        ) ??
        false;
  }

  Future<void> _loadData() async {
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
      final templates = await repository.listNotificationTemplates(
        session,
        search: _searchController.text.trim().isEmpty
            ? null
            : _searchController.text.trim(),
        channel: _channelFilter,
        pageSize: 100,
      );
      final deliveries = await repository.listNotificationDeliveries(
        session,
        search: _searchController.text.trim().isEmpty
            ? null
            : _searchController.text.trim(),
        channel: _channelFilter,
        status: _deliveryStatusFilter,
        pageSize: 100,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _templatesResult = templates;
        _deliveriesResult = deliveries;
        _selectedTemplateId = templates.items.any(
          (item) => item.templateId == _selectedTemplateId,
        )
            ? _selectedTemplateId
            : templates.items.firstOrNull?.templateId;
        _selectedDeliveryId = deliveries.items.any(
          (item) => item.deliveryId == _selectedDeliveryId,
        )
            ? _selectedDeliveryId
            : deliveries.items.firstOrNull?.deliveryId;
      });
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

  Future<void> _createTemplate() async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      await ref.read(baseGovernanceRepositoryProvider).createNotificationTemplate(
            session,
            CreateNotificationTemplateInput(
              key: _templateKeyController.text.trim(),
              moduleKey: 'notifications',
              label: _templateLabelController.text.trim(),
              channel: _draftChannel,
              eventKey: _templateEventController.text.trim(),
              subject: _templateSubjectController.text.trim(),
              body: _templateBodyController.text.trim(),
              scopeType: SettingScopeType.tenant,
              requiresConsent: _requiresConsent,
              allowAttachments: _allowAttachments,
              retryLimit: 3,
              status: _draftStatus,
            ),
          );
      if (!mounted) {
        return;
      }
      await _loadData();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Template criado com sucesso.')),
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

  Future<void> _sendNotification() async {
    final session = ref.read(authSessionProvider);
    final selected = _templatesResult?.items.firstWhereOrNull(
      (item) => item.templateId == _selectedTemplateId,
    );
    if (session == null || selected == null) {
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      final variables = _parseVariables();
      await ref.read(baseGovernanceRepositoryProvider).sendNotification(
            session,
            SendNotificationInput(
              templateKey: selected.key,
              recipient: _recipientController.text.trim(),
              subjectOverride: _templateSubjectController.text.trim().isEmpty
                  ? null
                  : _templateSubjectController.text.trim(),
              bodyVariables: variables,
              attachments: const [],
              consentGranted: _consentGranted,
              metadata: <String, dynamic>{'source': 'notifications_page'},
            ),
          );
      if (!mounted) {
        return;
      }
      await _loadData();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notificacao enviada para a fila.')),
      );
    } on FormatException {
      if (!mounted) {
        return;
      }
      setState(() {
        _saveFailure = const AppFailure(
          title: 'JSON invalido',
          message: 'Revise o JSON das variaveis antes de enviar.',
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

  Future<void> _retrySelectedDelivery() async {
    final session = ref.read(authSessionProvider);
    final selected = _deliveriesResult?.items.firstWhereOrNull(
      (item) => item.deliveryId == _selectedDeliveryId,
    );
    if (session == null || selected == null) {
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      await ref.read(baseGovernanceRepositoryProvider).retryNotificationDelivery(
            session,
            selected.deliveryId,
            expectedStatus: selected.status,
          );
      if (!mounted) {
        return;
      }
      await _loadData();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Retentativa executada.')),
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

  Map<String, dynamic> _parseVariables() {
    final raw = _variablesController.text.trim();
    if (raw.isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(raw);
    if (decoded is! Map) {
      throw const FormatException('JSON deve ser um objeto.');
    }
    return Map<String, dynamic>.from(decoded);
  }

  @override
  Widget build(BuildContext context) {
    final templates = _templatesResult?.items ?? const <NotificationTemplateRecord>[];
    final deliveries =
        _deliveriesResult?.items ?? const <NotificationDeliveryRecord>[];
    final selectedTemplate = templates.firstWhereOrNull(
      (item) => item.templateId == _selectedTemplateId,
    );
    final selectedDelivery = deliveries.firstWhereOrNull(
      (item) => item.deliveryId == _selectedDeliveryId,
    );
    final canRead = _canRead();
    final canManage = _canManage();

    return ResponsivePage(
      title: 'Notificacoes',
      subtitle:
          'Central administrativa de templates, envios, consentimento e retentativas.',
      actions: [
        OutlinedButton.icon(
          onPressed: _loading ? null : _loadData,
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
                    label: 'Templates ativos',
                    value:
                        '${templates.where((item) => item.status == NotificationTemplateStatus.active).length}',
                  ),
                ),
              ),
              AppCard(
                child: SizedBox(
                  width: 220,
                  child: _MetricCard(
                    label: 'Entregas com falha',
                    value:
                        '${deliveries.where((item) => item.status == NotificationDeliveryStatus.failed).length}',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _loading && _templatesResult == null
                ? const LoadingState(
                    message: 'Carregando central de notificacoes...',
                  )
                : !canRead
                ? const EmptyState(
                    title: 'Sem permissao para notificacoes',
                    message:
                        'Sua sessao atual nao pode consultar templates ou entregas.',
                  )
                : _loadFailure != null && _templatesResult == null
                ? ErrorState(failure: _loadFailure!, onRetry: _loadData)
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
                                child: _buildTemplateCatalog(templates),
                              ),
                              SizedBox(
                                width: isWide
                                    ? (constraints.maxWidth * 0.6) - 8
                                    : constraints.maxWidth,
                                child: _buildWorkspace(
                                  canManage,
                                  selectedTemplate,
                                  selectedDelivery,
                                ),
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

  Widget _buildTemplateCatalog(List<NotificationTemplateRecord> templates) {
    return FormSection(
      title: 'Templates e entregas',
      description:
          'Filtre por canal, selecione um template e acompanhe o historico de comunicacao.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilterBar(
            filters: [
              SizedBox(
                width: 260,
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    labelText: 'Buscar por chave ou evento',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: _loadData,
                    ),
                  ),
                  onSubmitted: (_) => _loadData(),
                ),
              ),
              SizedBox(
                width: 180,
                child: DropdownButtonFormField<NotificationChannel?>(
                  initialValue: _channelFilter,
                  decoration: const InputDecoration(labelText: 'Canal'),
                  items: [
                    const DropdownMenuItem<NotificationChannel?>(
                      value: null,
                      child: Text('Todos'),
                    ),
                    ...NotificationChannel.values.map(
                      (item) => DropdownMenuItem<NotificationChannel?>(
                        value: item,
                        child: Text(item.label),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _channelFilter = value;
                    });
                    _loadData();
                  },
                ),
              ),
              SizedBox(
                width: 200,
                child: DropdownButtonFormField<NotificationDeliveryStatus?>(
                  initialValue: _deliveryStatusFilter,
                  decoration: const InputDecoration(labelText: 'Status entrega'),
                  items: [
                    const DropdownMenuItem<NotificationDeliveryStatus?>(
                      value: null,
                      child: Text('Todos'),
                    ),
                    ...NotificationDeliveryStatus.values.map(
                      (item) => DropdownMenuItem<NotificationDeliveryStatus?>(
                        value: item,
                        child: Text(item.label),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _deliveryStatusFilter = value;
                    });
                    _loadData();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (templates.isEmpty)
            const EmptyState(
              title: 'Nenhum template encontrado',
              message: 'Nao ha templates para os filtros aplicados.',
            )
          else
            SizedBox(
              height: 520,
              child: ListView.separated(
                itemCount: templates.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final template = templates[index];
                  final selected = template.templateId == _selectedTemplateId;
                  return Material(
                    color: selected
                        ? Theme.of(context).colorScheme.primaryContainer
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        setState(() {
                          _selectedTemplateId = template.templateId;
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              template.label,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(template.key),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                Chip(label: Text(template.channel.label)),
                                Chip(label: Text(template.status.label)),
                                Chip(label: Text(template.eventKey)),
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

  Widget _buildWorkspace(
    bool canManage,
    NotificationTemplateRecord? selectedTemplate,
    NotificationDeliveryRecord? selectedDelivery,
  ) {
    return FormSection(
      title: 'Disparo e detalhe',
      description:
          'Crie templates do MVP, envie notificacoes manuais e reexecute falhas controladas.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_saveFailure != null) ...[
            ErrorState(failure: _saveFailure!),
            const SizedBox(height: 16),
          ],
          TextField(
            controller: _templateKeyController,
            enabled: canManage,
            decoration: const InputDecoration(labelText: 'Chave do template'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _templateLabelController,
            enabled: canManage,
            decoration: const InputDecoration(labelText: 'Titulo visivel'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<NotificationChannel>(
                  initialValue: _draftChannel,
                  decoration: const InputDecoration(labelText: 'Canal'),
                  items: NotificationChannel.values
                      .map(
                        (item) => DropdownMenuItem(
                          value: item,
                          child: Text(item.label),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: canManage
                      ? (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() {
                            _draftChannel = value;
                          });
                        }
                      : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<NotificationTemplateStatus>(
                  initialValue: _draftStatus,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: NotificationTemplateStatus.values
                      .map(
                        (item) => DropdownMenuItem(
                          value: item,
                          child: Text(item.label),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: canManage
                      ? (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() {
                            _draftStatus = value;
                          });
                        }
                      : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _templateEventController,
            enabled: canManage,
            decoration: const InputDecoration(labelText: 'Evento'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _templateSubjectController,
            enabled: canManage,
            decoration: const InputDecoration(labelText: 'Assunto'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _templateBodyController,
            enabled: canManage,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Corpo do template',
              helperText: 'Use placeholders como {{customerName}}.',
            ),
          ),
          SwitchListTile(
            value: _requiresConsent,
            onChanged: canManage
                ? (value) => setState(() => _requiresConsent = value)
                : null,
            title: const Text('Exigir consentimento'),
          ),
          SwitchListTile(
            value: _allowAttachments,
            onChanged: canManage
                ? (value) => setState(() => _allowAttachments = value)
                : null,
            title: const Text('Permitir anexos'),
          ),
          if (!canManage)
            const EmptyState(
              title: 'Perfil em leitura',
              message: 'Sua sessao atual nao pode criar ou disparar notificacoes.',
            )
          else
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                PrimaryButton(
                  label: 'Criar template',
                  icon: Icons.add_outlined,
                  isLoading: _saving,
                  onPressed: _createTemplate,
                ),
                OutlinedButton.icon(
                  onPressed: _saving || selectedTemplate == null
                      ? null
                      : _sendNotification,
                  icon: const Icon(Icons.send_outlined),
                  label: const Text('Disparar notificacao'),
                ),
                OutlinedButton.icon(
                  onPressed: _saving ||
                          selectedDelivery == null ||
                          selectedDelivery.status == NotificationDeliveryStatus.sent
                      ? null
                      : _retrySelectedDelivery,
                  icon: const Icon(Icons.refresh_outlined),
                  label: const Text('Retentar falha'),
                ),
              ],
            ),
          const SizedBox(height: 24),
          TextField(
            controller: _recipientController,
            enabled: canManage,
            decoration: const InputDecoration(labelText: 'Destinatario'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _variablesController,
            enabled: canManage,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Variaveis JSON',
              helperText: 'Exemplo: {"customerName":"Cliente","documentCode":"DOC-1"}',
            ),
          ),
          SwitchListTile(
            value: _consentGranted,
            onChanged: canManage
                ? (value) => setState(() => _consentGranted = value)
                : null,
            title: const Text('Consentimento concedido'),
          ),
          const SizedBox(height: 16),
          if (selectedTemplate != null) ...[
            Text(
              'Template selecionado: ${selectedTemplate.label}',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(selectedTemplate.key),
                  const SizedBox(height: 8),
                  Text(selectedTemplate.body),
                ],
              ),
            ),
          ],
          if (selectedDelivery != null) ...[
            const SizedBox(height: 16),
            Text(
              'Ultima entrega selecionada',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 8),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${selectedDelivery.channel.label} - ${selectedDelivery.status.label}',
                  ),
                  const SizedBox(height: 8),
                  Text(selectedDelivery.recipient),
                  const SizedBox(height: 8),
                  Text(selectedDelivery.body),
                  if ((selectedDelivery.lastError ?? '').isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text('Erro: ${selectedDelivery.lastError}'),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
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

extension on List<NotificationTemplateRecord> {
  NotificationTemplateRecord? get firstOrNull => isEmpty ? null : first;
}

extension on Iterable<NotificationTemplateRecord> {
  NotificationTemplateRecord? firstWhereOrNull(
    bool Function(NotificationTemplateRecord item) test,
  ) {
    for (final item in this) {
      if (test(item)) {
        return item;
      }
    }
    return null;
  }
}

extension on Iterable<NotificationDeliveryRecord> {
  NotificationDeliveryRecord? firstWhereOrNull(
    bool Function(NotificationDeliveryRecord item) test,
  ) {
    for (final item in this) {
      if (test(item)) {
        return item;
      }
    }
    return null;
  }
}
