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

class DataJobsPage extends ConsumerStatefulWidget {
  const DataJobsPage({super.key});

  @override
  ConsumerState<DataJobsPage> createState() => _DataJobsPageState();
}

class _DataJobsPageState extends ConsumerState<DataJobsPage> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _fileNameController = TextEditingController(
    text: 'roles-import.csv',
  );
  final TextEditingController _contentController = TextEditingController(
    text: 'key,name,permissionKeys,status\nfinance.viewer,Financeiro leitura,roles.read|reporting.consolidated.read,active',
  );

  BaseGovernanceListResult<DataJob>? _jobsResult;
  AppFailure? _loadFailure;
  AppFailure? _saveFailure;
  bool _loading = false;
  bool _saving = false;
  String _typeFilter = 'all';
  String _statusFilter = 'all';
  DataJobEntity _entity = DataJobEntity.roles;
  DataJobFormat _format = DataJobFormat.csv;
  DataJobMode _mode = DataJobMode.upsert;
  String? _selectedJobId;

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _fileNameController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  DataJobType? get _jobType =>
      _typeFilter == 'all' ? null : DataJobType.fromWire(_typeFilter);

  DataJobStatus? get _jobStatus =>
      _statusFilter == 'all' ? null : DataJobStatus.fromWire(_statusFilter);

  String? get _search {
    final value = _searchController.text.trim();
    return value.isEmpty ? null : value;
  }

  bool _canRead() {
    final session = ref.read(authSessionProvider);
    return session?.user.permissionKeys.contains(
          BaseGovernancePermissions.dataJobsRead,
        ) ??
        false;
  }

  bool _canManage() {
    final session = ref.read(authSessionProvider);
    return session?.user.permissionKeys.contains(
          BaseGovernancePermissions.dataJobsManage,
        ) ??
        false;
  }

  Future<void> _loadJobs({String? keepJobId}) async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _loading = true;
      _loadFailure = null;
    });

    try {
      final result = await ref.read(baseGovernanceRepositoryProvider).listDataJobs(
            session,
            search: _search,
            type: _jobType,
            status: _jobStatus,
            pageSize: 100,
          );

      if (!mounted) {
        return;
      }

      setState(() {
        _jobsResult = result;
        _selectedJobId = result.items.any((item) => item.id == keepJobId)
            ? keepJobId
            : result.items.firstOrNull?.id;
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

  Future<void> _createImportJob() async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      final job = await ref.read(baseGovernanceRepositoryProvider).createImportJob(
            session,
            CreateImportJobInput(
              entity: _entity,
              format: _format,
              fileName: _fileNameController.text.trim(),
              mode: _mode,
              mapping: const [],
              content: _contentController.text.trim(),
            ),
          );

      if (!mounted) {
        return;
      }

      await _loadJobs(keepJobId: job.id);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job de importacao criado.')),
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

  Future<void> _runSelectedJob() async {
    final session = ref.read(authSessionProvider);
    final jobId = _selectedJobId;
    if (session == null || jobId == null) {
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      final job = await ref.read(baseGovernanceRepositoryProvider).runImportJob(
            session,
            jobId,
          );

      if (!mounted) {
        return;
      }

      await _loadJobs(keepJobId: job.id);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job executado com sucesso.')),
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

  Future<void> _createExportJob() async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      return;
    }

    setState(() {
      _saving = true;
      _saveFailure = null;
    });

    try {
      final job = await ref.read(baseGovernanceRepositoryProvider).createExportJob(
            session,
            CreateExportJobInput(
              entity: _entity,
              format: _format == DataJobFormat.pdf
                  ? DataJobFormat.pdf
                  : DataJobFormat.csv,
              fileName: _fileNameController.text.trim(),
              filters: const {},
            ),
          );

      if (!mounted) {
        return;
      }

      await _loadJobs(keepJobId: job.id);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Job de exportacao criado.')),
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
    final jobs = _jobsResult?.items ?? const <DataJob>[];
    final selected = jobs.firstWhereOrNull((item) => item.id == _selectedJobId);
    final canRead = _canRead();
    final canManage = _canManage();

    return ResponsivePage(
      title: 'Importacao e exportacao',
      subtitle:
          'Jobs administrativos com pre-validacao, preview, execucao e rastreabilidade.',
      actions: [
        OutlinedButton.icon(
          onPressed: _loading ? null : () => _loadJobs(keepJobId: _selectedJobId),
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
                  child: _MetricCard(label: 'Jobs visiveis', value: '${jobs.length}'),
                ),
              ),
              AppCard(
                child: SizedBox(
                  width: 220,
                  child: _MetricCard(
                    label: 'Com erros',
                    value:
                        '${jobs.where((item) => item.errors.isNotEmpty).length}',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _loading && _jobsResult == null
                ? const LoadingState(
                    message: 'Carregando jobs administrativos...',
                  )
                : !canRead
                ? const EmptyState(
                    title: 'Sem permissao para importacao/exportacao',
                    message:
                        'Sua sessao atual nao pode consultar jobs administrativos.',
                  )
                : _loadFailure != null && _jobsResult == null
                ? ErrorState(
                    failure: _loadFailure!,
                    onRetry: () => _loadJobs(keepJobId: _selectedJobId),
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
                                    ? (constraints.maxWidth * 0.42) - 8
                                    : constraints.maxWidth,
                                child: _buildJobsList(jobs),
                              ),
                              SizedBox(
                                width: isWide
                                    ? (constraints.maxWidth * 0.58) - 8
                                    : constraints.maxWidth,
                                child: _buildJobWorkspace(selected, canManage),
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

  Widget _buildJobsList(List<DataJob> jobs) {
    return FormSection(
      title: 'Historico de jobs',
      description:
          'Filtre importacoes e exportacoes por tipo e status antes de abrir o detalhe.',
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
                    labelText: 'Buscar por arquivo ou entidade',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: () => _loadJobs(keepJobId: _selectedJobId),
                    ),
                  ),
                  onSubmitted: (_) => _loadJobs(keepJobId: _selectedJobId),
                ),
              ),
              SizedBox(
                width: 180,
                child: DropdownButtonFormField<String>(
                  initialValue: _typeFilter,
                  decoration: const InputDecoration(labelText: 'Tipo'),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('Todos')),
                    DropdownMenuItem(value: 'import', child: Text('Importacao')),
                    DropdownMenuItem(value: 'export', child: Text('Exportacao')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _typeFilter = value ?? 'all';
                    });
                    _loadJobs(keepJobId: _selectedJobId);
                  },
                ),
              ),
              SizedBox(
                width: 220,
                child: DropdownButtonFormField<String>(
                  initialValue: _statusFilter,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('Todos')),
                    DropdownMenuItem(value: 'validated', child: Text('Validado')),
                    DropdownMenuItem(value: 'processing', child: Text('Processando')),
                    DropdownMenuItem(value: 'completed', child: Text('Concluido')),
                    DropdownMenuItem(value: 'failed', child: Text('Falhou')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _statusFilter = value ?? 'all';
                    });
                    _loadJobs(keepJobId: _selectedJobId);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (jobs.isEmpty)
            const EmptyState(
              title: 'Nenhum job encontrado',
              message: 'Nao ha registros para os filtros aplicados.',
            )
          else
            SizedBox(
              height: 560,
              child: ListView.separated(
                itemCount: jobs.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final job = jobs[index];
                  final selected = job.id == _selectedJobId;
                  return Material(
                    color: selected
                        ? Theme.of(context).colorScheme.primaryContainer
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        setState(() {
                          _selectedJobId = job.id;
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(job.fileName,
                                style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text('${job.type.label} - ${job.entity.label}'),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                Chip(label: Text(job.status.label)),
                                Chip(label: Text('${job.validRows}/${job.totalRows} validas')),
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

  Widget _buildJobWorkspace(DataJob? selected, bool canManage) {
    return FormSection(
      title: 'Novo job e detalhe',
      description:
          'Crie jobs por texto tabular normalizado para o MVP e execute importacoes validadas.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_saveFailure != null) ...[
            ErrorState(failure: _saveFailure!),
            const SizedBox(height: 16),
          ],
          DropdownButtonFormField<DataJobEntity>(
            initialValue: _entity,
            decoration: const InputDecoration(labelText: 'Entidade'),
            items: const [
              DropdownMenuItem(value: DataJobEntity.roles, child: Text('Perfis')),
              DropdownMenuItem(value: DataJobEntity.settings, child: Text('Configuracoes')),
              DropdownMenuItem(value: DataJobEntity.audit, child: Text('Auditoria')),
            ],
            onChanged: canManage
                ? (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _entity = value;
                    });
                  }
                : null,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<DataJobFormat>(
                  initialValue: _format,
                  decoration: const InputDecoration(labelText: 'Formato'),
                  items: const [
                    DropdownMenuItem(value: DataJobFormat.csv, child: Text('CSV')),
                    DropdownMenuItem(value: DataJobFormat.xlsx, child: Text('XLSX')),
                    DropdownMenuItem(value: DataJobFormat.pdf, child: Text('PDF')),
                  ],
                  onChanged: canManage
                      ? (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() {
                            _format = value;
                          });
                        }
                      : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<DataJobMode>(
                  initialValue: _mode,
                  decoration: const InputDecoration(labelText: 'Modo'),
                  items: const [
                    DropdownMenuItem(value: DataJobMode.create, child: Text('Create')),
                    DropdownMenuItem(value: DataJobMode.update, child: Text('Update')),
                    DropdownMenuItem(value: DataJobMode.upsert, child: Text('Upsert')),
                    DropdownMenuItem(value: DataJobMode.simulation, child: Text('Simulacao')),
                  ],
                  onChanged: canManage
                      ? (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() {
                            _mode = value;
                          });
                        }
                      : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _fileNameController,
            enabled: canManage,
            decoration: const InputDecoration(labelText: 'Nome do arquivo'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _contentController,
            enabled: canManage,
            minLines: 8,
            maxLines: 12,
            decoration: const InputDecoration(
              labelText: 'Conteudo tabular do MVP',
              helperText:
                  'Use cabecalho CSV normalizado. O backend pre-valida e gera preview.',
            ),
          ),
          const SizedBox(height: 16),
          if (!canManage)
            const EmptyState(
              title: 'Perfil em leitura',
              message: 'Sua sessao atual nao pode criar ou executar jobs.',
            )
          else
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                PrimaryButton(
                  label: 'Criar importacao',
                  icon: Icons.upload_file_outlined,
                  isLoading: _saving,
                  onPressed: _createImportJob,
                ),
                OutlinedButton.icon(
                  onPressed: _saving ? null : _createExportJob,
                  icon: const Icon(Icons.download_outlined),
                  label: const Text('Criar exportacao'),
                ),
                OutlinedButton.icon(
                  onPressed: _saving || selected == null || selected.type != DataJobType.import
                      ? null
                      : _runSelectedJob,
                  icon: const Icon(Icons.play_arrow_outlined),
                  label: const Text('Executar job'),
                ),
              ],
            ),
          const SizedBox(height: 24),
          if (selected == null)
            const EmptyState(
              title: 'Selecione um job',
              message: 'Abra um registro no historico para revisar preview, erros e saida.',
            )
          else ...[
            Text(selected.fileName,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(selected.status.label)),
                Chip(label: Text(selected.entity.label)),
                Chip(label: Text('${selected.validRows}/${selected.totalRows} validas')),
              ],
            ),
            const SizedBox(height: 16),
            if (selected.errors.isNotEmpty) ...[
              Text('Erros', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              for (final error in selected.errors)
                Text('Linha ${error.row} - ${error.field}: ${error.message}'),
              const SizedBox(height: 16),
            ],
            if (selected.previewRows.isNotEmpty) ...[
              Text('Preview', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: selected.previewRows
                      .map(
                        (row) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            'Linha ${row.rowNumber}: ${row.values}',
                          ),
                        ),
                      )
                      .toList(growable: false),
                ),
              ),
            ],
            if ((selected.outputPreview ?? '').isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Saida', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              AppCard(child: SelectableText(selected.outputPreview!)),
            ],
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

extension on List<DataJob> {
  DataJob? get firstOrNull => isEmpty ? null : first;
}

extension on Iterable<DataJob> {
  DataJob? firstWhereOrNull(bool Function(DataJob item) test) {
    for (final item in this) {
      if (test(item)) {
        return item;
      }
    }
    return null;
  }
}
