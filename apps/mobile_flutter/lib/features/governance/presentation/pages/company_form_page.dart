import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/form_section.dart';
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

class CompanyFormPage extends ConsumerStatefulWidget {
  const CompanyFormPage({
    super.key,
    this.companyId,
  });

  final String? companyId;

  bool get isEditing => companyId != null;

  @override
  ConsumerState<CompanyFormPage> createState() => _CompanyFormPageState();
}

class _CompanyFormPageState extends ConsumerState<CompanyFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _legalNameController = TextEditingController();
  final _tradeNameController = TextEditingController();
  final _rootRegistrationController = TextEditingController();
  final _countryCodeController = TextEditingController(text: 'BR');
  final _legalNatureCodeController = TextEditingController(text: '2062');
  final _openingDateController = TextEditingController();
  final _regimeController = TextEditingController(text: 'LUCRO_REAL');
  final _currencyController = TextEditingController(text: 'BRL');
  final _calendarController = TextEditingController(text: 'cal_br_default');
  final _consolidationModeController = TextEditingController(text: 'FULL');

  bool _loading = false;
  AppFailure? _failure;
  Company? _loadedCompany;

  @override
  void initState() {
    super.initState();
    if (widget.isEditing) {
      _loadExisting();
    }
  }

  @override
  void dispose() {
    _legalNameController.dispose();
    _tradeNameController.dispose();
    _rootRegistrationController.dispose();
    _countryCodeController.dispose();
    _legalNatureCodeController.dispose();
    _openingDateController.dispose();
    _regimeController.dispose();
    _currencyController.dispose();
    _calendarController.dispose();
    _consolidationModeController.dispose();
    super.dispose();
  }

  Future<void> _loadExisting() async {
    final session = ref.read(authSessionProvider);
    if (session == null || widget.companyId == null) {
      return;
    }

    setState(() {
      _loading = true;
      _failure = null;
    });

    try {
      final company = await ref
          .read(governanceRepositoryProvider)
          .getCompany(session, widget.companyId!);
      _loadedCompany = company;
      _legalNameController.text = company.legalName;
      _tradeNameController.text = company.tradeName ?? '';
      _rootRegistrationController.text = company.companyRootRegistration;
      _countryCodeController.text = company.countryCode;
      _legalNatureCodeController.text = company.legalNatureCode;
      _openingDateController.text = company.openingDate;
      _regimeController.text = company.regimeTributario;
      _currencyController.text = company.defaultCurrency;
      _calendarController.text = company.fiscalCalendarId;
      _consolidationModeController.text = company.consolidationMode;
    } on AppFailure catch (error) {
      _failure = error;
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _submit() async {
    final session = ref.read(authSessionProvider);
    if (session == null || !_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _loading = true;
      _failure = null;
    });

    try {
      final repository = ref.read(governanceRepositoryProvider);
      final input = CreateCompanyInput(
        legalName: _legalNameController.text,
        tradeName: _tradeNameController.text,
        companyRootRegistration: _rootRegistrationController.text,
        countryCode: _countryCodeController.text,
        legalNatureCode: _legalNatureCodeController.text,
        openingDate: _openingDateController.text,
        regimeTributario: _regimeController.text,
        defaultCurrency: _currencyController.text,
        fiscalCalendarId: _calendarController.text,
        consolidationMode: _consolidationModeController.text,
      );

      final company = widget.isEditing
          ? await repository.updateCompany(
              session,
              widget.companyId!,
              UpdateCompanyInput(
                expectedVersion: _loadedCompany?.version ?? 0,
                legalName: input.legalName,
                tradeName: input.tradeName,
                companyRootRegistration: input.companyRootRegistration,
                countryCode: input.countryCode,
                legalNatureCode: input.legalNatureCode,
                openingDate: input.openingDate,
                regimeTributario: input.regimeTributario,
                defaultCurrency: input.defaultCurrency,
                fiscalCalendarId: input.fiscalCalendarId,
                consolidationMode: input.consolidationMode,
              ),
            )
          : await repository.createCompany(session, input);

      await ref.read(governanceWorkspaceProvider.notifier).reload();
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isEditing
                ? 'Empresa atualizada com sucesso.'
                : 'Empresa salva com sucesso.',
          ),
        ),
      );
      context.go(GovernanceRoutes.companyDetails(company.companyId));
    } on AppFailure catch (error) {
      setState(() {
        _failure = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(authSessionProvider);
    final canUseForm = widget.isEditing
        ? session?.user.hasPermission(GovernancePermissions.companyUpdate) ?? false
        : session?.user.hasPermission(GovernancePermissions.companyCreate) ?? false;

    return ResponsivePage(
      title: widget.isEditing ? 'Editar empresa' : 'Nova empresa',
      subtitle:
          'Dados juridicos, tributarios e de consolidacao que definem a entidade legal.',
      actions: [
        PrimaryButton(
          label: widget.isEditing ? 'Salvar alteracoes' : 'Salvar empresa',
          icon: Icons.save_outlined,
          isLoading: _loading,
          onPressed: canUseForm ? _submit : null,
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NetworkStatusBanner(),
          const SizedBox(height: 16),
          const GovernanceContextBar(),
          const SizedBox(height: 16),
          if (!canUseForm)
            const Expanded(
              child: ErrorState(
                failure: AppFailure(
                  title: 'Sem permissao para editar',
                  message:
                      'Seu grant atual nao permite criar ou editar empresas neste modulo.',
                ),
              ),
            )
          else if (_loading && widget.isEditing && _loadedCompany == null)
            const Expanded(
              child: LoadingState(message: 'Carregando dados da empresa...'),
            )
          else if (_failure != null && widget.isEditing && _loadedCompany == null)
            Expanded(
              child: ErrorState(
                failure: _failure!,
                onRetry: _loadExisting,
              ),
            )
          else
            Expanded(
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: ListView(
                  children: [
                    if (_failure != null) ...[
                      ErrorState(failure: _failure!),
                      const SizedBox(height: 16),
                    ],
                    FormSection(
                      title: 'Identificacao',
                      description:
                          'Defina a entidade legal principal e evite duplicidade por raiz cadastral.',
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _legalNameController,
                            decoration: const InputDecoration(
                              labelText: 'Razao social',
                            ),
                            validator: _requiredValidator('Informe a razao social.'),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _tradeNameController,
                            decoration: const InputDecoration(
                              labelText: 'Nome fantasia',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _rootRegistrationController,
                            readOnly: widget.isEditing,
                            decoration: const InputDecoration(
                              labelText: 'Raiz cadastral',
                              helperText:
                                  'No modo edicao, a raiz fica somente leitura para evitar quebra estrutural.',
                            ),
                            validator: _requiredValidator(
                              'Informe a raiz cadastral da empresa.',
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    FormSection(
                      title: 'Dados juridicos e tributarios',
                      description:
                          'Esses campos influenciam grants, consolidacao e futuras integracoes fiscais.',
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _countryCodeController,
                            decoration: const InputDecoration(
                              labelText: 'Pais',
                            ),
                            validator: _requiredValidator('Informe o pais.'),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _legalNatureCodeController,
                            decoration: const InputDecoration(
                              labelText: 'Natureza juridica',
                            ),
                            validator: _requiredValidator(
                              'Informe a natureza juridica.',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _openingDateController,
                            decoration: const InputDecoration(
                              labelText: 'Data de abertura',
                              hintText: 'YYYY-MM-DD',
                            ),
                            validator: _dateValidator,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _regimeController,
                            decoration: const InputDecoration(
                              labelText: 'Regime tributario',
                            ),
                            validator: _requiredValidator(
                              'Selecione um regime tributario valido.',
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    FormSection(
                      title: 'Consolidacao e operacao',
                      description:
                          'Configure moeda, calendario e o modo minimo de consolidacao desta entidade.',
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _currencyController,
                            decoration: const InputDecoration(
                              labelText: 'Moeda funcional',
                            ),
                            validator: _requiredValidator('Informe a moeda funcional.'),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _calendarController,
                            decoration: const InputDecoration(
                              labelText: 'Calendario fiscal',
                            ),
                            validator: _requiredValidator(
                              'Informe o calendario fiscal.',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _consolidationModeController,
                            decoration: const InputDecoration(
                              labelText: 'Modo de consolidacao',
                            ),
                            validator: _requiredValidator(
                              'Informe o modo de consolidacao.',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  FormFieldValidator<String> _requiredValidator(String message) {
    return (value) {
      if ((value?.trim() ?? '').isEmpty) {
        return message;
      }
      return null;
    };
  }

  String? _dateValidator(String? value) {
    final raw = value?.trim() ?? '';
    if (raw.isEmpty) {
      return 'Informe a data de abertura.';
    }
    final datePattern = RegExp(r'^\d{4}-\d{2}-\d{2}$');
    if (!datePattern.hasMatch(raw)) {
      return 'Use o formato YYYY-MM-DD.';
    }
    return null;
  }
}
