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

class EstablishmentFormPage extends ConsumerStatefulWidget {
  const EstablishmentFormPage({
    super.key,
    this.establishmentId,
    this.initialCompanyId,
  });

  final String? establishmentId;
  final String? initialCompanyId;

  bool get isEditing => establishmentId != null;

  @override
  ConsumerState<EstablishmentFormPage> createState() =>
      _EstablishmentFormPageState();
}

class _EstablishmentFormPageState
    extends ConsumerState<EstablishmentFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _registrationNumberController = TextEditingController();
  final _registrationRootController = TextEditingController();
  final _establishmentOrderController = TextEditingController(text: '0001');
  final _legalNameController = TextEditingController();
  final _tradeNameController = TextEditingController();
  final _cnaePrincipalController = TextEditingController();
  final _secondaryCnaesController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _stateCodeController = TextEditingController();
  final _cityCodeController = TextEditingController();
  final _cityNameController = TextEditingController();
  final _districtController = TextEditingController();
  final _line1Controller = TextEditingController();
  final _line2Controller = TextEditingController();
  final _contactEmailController = TextEditingController();
  final _contactPhoneController = TextEditingController();

  EstablishmentType? _selectedType;
  String? _selectedCompanyId;
  bool _isPrincipal = false;
  bool _isAdministrative = false;
  bool _loading = false;
  AppFailure? _failure;
  Establishment? _loadedEstablishment;

  @override
  void initState() {
    super.initState();
    _selectedCompanyId = widget.initialCompanyId;
    if (widget.isEditing) {
      _loadExisting();
    }
  }

  @override
  void dispose() {
    _registrationNumberController.dispose();
    _registrationRootController.dispose();
    _establishmentOrderController.dispose();
    _legalNameController.dispose();
    _tradeNameController.dispose();
    _cnaePrincipalController.dispose();
    _secondaryCnaesController.dispose();
    _postalCodeController.dispose();
    _stateCodeController.dispose();
    _cityCodeController.dispose();
    _cityNameController.dispose();
    _districtController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _contactEmailController.dispose();
    _contactPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadExisting() async {
    final session = ref.read(authSessionProvider);
    if (session == null || widget.establishmentId == null) {
      return;
    }

    setState(() {
      _loading = true;
      _failure = null;
    });

    try {
      final establishment = await ref
          .read(governanceRepositoryProvider)
          .getEstablishment(session, widget.establishmentId!);
      _loadedEstablishment = establishment;
      _selectedCompanyId = establishment.companyId;
      _selectedType = establishment.establishmentType;
      _isPrincipal = establishment.isPrincipal;
      _isAdministrative = establishment.isAdministrative;
      _registrationNumberController.text = establishment.registrationNumber;
      _registrationRootController.text = establishment.registrationRoot;
      _establishmentOrderController.text = establishment.establishmentOrder;
      _legalNameController.text = establishment.legalNameAtEstablishment;
      _tradeNameController.text = establishment.tradeNameAtEstablishment ?? '';
      _cnaePrincipalController.text = establishment.cnaePrincipal;
      _secondaryCnaesController.text =
          establishment.cnaesSecundarios.join(', ');
      _postalCodeController.text = establishment.address.postalCode ?? '';
      _stateCodeController.text = establishment.address.stateCode ?? '';
      _cityCodeController.text = establishment.address.cityCode ?? '';
      _cityNameController.text = establishment.address.cityName;
      _districtController.text = establishment.address.district ?? '';
      _line1Controller.text = establishment.address.line1;
      _line2Controller.text = establishment.address.line2 ?? '';
      _contactEmailController.text = establishment.contactEmail ?? '';
      _contactPhoneController.text = establishment.contactPhone ?? '';
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

    if (_selectedCompanyId == null || _selectedType == null) {
      setState(() {
        _failure = const AppFailure(
          title: 'Campos obrigatorios pendentes',
          message:
              'Defina explicitamente a empresa e o tipo do estabelecimento antes de salvar.',
          code: 'VALIDATION_ERROR',
        );
      });
      return;
    }

    setState(() {
      _loading = true;
      _failure = null;
    });

    try {
      final repository = ref.read(governanceRepositoryProvider);
      final draft = EstablishmentFormDraft(
        registrationNumber: _registrationNumberController.text,
        registrationRoot: _registrationRootController.text,
        establishmentOrder: _establishmentOrderController.text,
        legalNameAtEstablishment: _legalNameController.text,
        tradeNameAtEstablishment: _tradeNameController.text,
        cnaePrincipal: _cnaePrincipalController.text,
        secondaryCnaesRaw: _secondaryCnaesController.text,
        contactEmail: _contactEmailController.text,
        contactPhone: _contactPhoneController.text,
        postalCode: _postalCodeController.text,
        stateCode: _stateCodeController.text,
        cityCode: _cityCodeController.text,
        cityName: _cityNameController.text,
        district: _districtController.text,
        line1: _line1Controller.text,
        line2: _line2Controller.text,
      );
      final input = CreateEstablishmentInput(
        companyId: _selectedCompanyId!,
        establishmentType: _selectedType!,
        isPrincipal: _isPrincipal,
        registrationNumber: draft.registrationNumber,
        registrationRoot: draft.registrationRoot,
        establishmentOrder: draft.establishmentOrder,
        legalNameAtEstablishment: draft.legalNameAtEstablishment,
        tradeNameAtEstablishment: draft.tradeNameAtEstablishment,
        cnaePrincipal: draft.cnaePrincipal,
        cnaesSecundarios: draft.parsedSecondaryCnaes,
        address: Address(
          countryCode: 'BR',
          postalCode: draft.postalCode,
          stateCode: draft.stateCode,
          cityCode: draft.cityCode,
          cityName: draft.cityName,
          district: draft.district,
          line1: draft.line1,
          line2: draft.line2,
        ),
        contactEmail: draft.contactEmail,
        contactPhone: draft.contactPhone,
        isAdministrative: _isAdministrative,
      );

      final establishment = widget.isEditing
          ? await repository.updateEstablishment(
              session,
              widget.establishmentId!,
              UpdateEstablishmentInput(
                expectedVersion: _loadedEstablishment?.version ?? 0,
                companyId: input.companyId,
                establishmentType: input.establishmentType,
                isPrincipal: input.isPrincipal,
                registrationNumber: input.registrationNumber,
                registrationRoot: input.registrationRoot,
                establishmentOrder: input.establishmentOrder,
                legalNameAtEstablishment: input.legalNameAtEstablishment,
                tradeNameAtEstablishment: input.tradeNameAtEstablishment,
                cnaePrincipal: input.cnaePrincipal,
                cnaesSecundarios: input.cnaesSecundarios,
                address: input.address,
                contactEmail: input.contactEmail,
                contactPhone: input.contactPhone,
                isAdministrative: input.isAdministrative,
              ),
            )
          : await repository.createEstablishment(session, input);

      await ref.read(governanceWorkspaceProvider.notifier).reload();
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isEditing
                ? 'Estabelecimento atualizado com sucesso.'
                : 'Estabelecimento salvo com sucesso.',
          ),
        ),
      );
      context.go(GovernanceRoutes.companyDetails(establishment.companyId));
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
    final companies =
        ref.watch(governanceWorkspaceProvider).value?.accessibleScopes.companies ??
            const <AccessibleCompanySummary>[];
    final canUseForm = widget.isEditing
        ? session?.user.hasPermission(GovernancePermissions.establishmentUpdate) ??
            false
        : session?.user.hasPermission(GovernancePermissions.establishmentCreate) ??
            false;

    return ResponsivePage(
      title: widget.isEditing ? 'Editar estabelecimento' : 'Novo estabelecimento',
      subtitle:
          'Cadastre matriz ou filial com tipo explicito e contexto juridico coerente.',
      actions: [
        PrimaryButton(
          label: widget.isEditing ? 'Salvar alteracoes' : 'Salvar estabelecimento',
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
                      'Seu grant atual nao permite criar ou editar estabelecimentos.',
                ),
              ),
            )
          else if (_loading && widget.isEditing && _loadedEstablishment == null)
            const Expanded(
              child: LoadingState(message: 'Carregando dados do estabelecimento...'),
            )
          else if (_failure != null &&
              widget.isEditing &&
              _loadedEstablishment == null)
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
                      title: 'Tipo e vinculo',
                      description:
                          'O tipo nunca e inferido pelo CNPJ. A selecao precisa ser explicita.',
                      child: Column(
                        children: [
                          DropdownButtonFormField<String>(
                            initialValue: _selectedCompanyId,
                            decoration: const InputDecoration(
                              labelText: 'Empresa',
                            ),
                            items: [
                              for (final company in companies)
                                DropdownMenuItem(
                                  value: company.companyId,
                                  child: Text(company.legalName),
                                ),
                            ],
                            onChanged: widget.isEditing
                                ? null
                                : (value) {
                                    setState(() {
                                      _selectedCompanyId = value;
                                    });
                                  },
                            validator: (value) {
                              if ((value?.trim() ?? '').isEmpty) {
                                return 'Selecione a empresa ativa para este cadastro.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          SegmentedButton<EstablishmentType>(
                            emptySelectionAllowed: false,
                            showSelectedIcon: false,
                            selected: _selectedType == null
                                ? const <EstablishmentType>{}
                                : <EstablishmentType>{_selectedType!},
                            segments: const [
                              ButtonSegment(
                                value: EstablishmentType.matrix,
                                label: Text('Matriz'),
                                icon: Icon(Icons.account_tree_outlined),
                              ),
                              ButtonSegment(
                                value: EstablishmentType.branch,
                                label: Text('Filial'),
                                icon: Icon(Icons.storefront_outlined),
                              ),
                            ],
                            onSelectionChanged: (selection) {
                              setState(() {
                                _selectedType =
                                    selection.isEmpty ? null : selection.first;
                                if (_selectedType == EstablishmentType.branch) {
                                  _isPrincipal = false;
                                }
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                          SwitchListTile.adaptive(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Matriz principal'),
                            subtitle: const Text(
                              'Bloqueie esta opcao para filiais e use com cautela em empresas que ja possuem matriz ativa.',
                            ),
                            value: _isPrincipal,
                            onChanged: _selectedType == EstablishmentType.branch
                                ? null
                                : (value) {
                                    setState(() {
                                      _isPrincipal = value;
                                    });
                                  },
                          ),
                          SwitchListTile.adaptive(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Matriz administrativa'),
                            subtitle: const Text(
                              'Use para estruturas que coordenam a operacao sem executar movimentos locais.',
                            ),
                            value: _isAdministrative,
                            onChanged: (value) {
                              setState(() {
                                _isAdministrative = value;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    FormSection(
                      title: 'Identificacao legal e operacional',
                      description:
                          'Registros, ordem do estabelecimento e CNAE principal formam a base operacional.',
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _registrationNumberController,
                            decoration: const InputDecoration(
                              labelText: 'CNPJ ou identificador',
                            ),
                            validator: _requiredValidator(
                              'Informe o identificador principal do estabelecimento.',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _registrationRootController,
                            decoration: const InputDecoration(
                              labelText: 'Raiz cadastral',
                            ),
                            validator: _requiredValidator(
                              'Informe a raiz do estabelecimento.',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _establishmentOrderController,
                            decoration: const InputDecoration(
                              labelText: 'Ordem do estabelecimento',
                            ),
                            validator: _requiredValidator(
                              'Informe a ordem do estabelecimento.',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _legalNameController,
                            decoration: const InputDecoration(
                              labelText: 'Nome empresarial',
                            ),
                            validator: _requiredValidator(
                              'Informe o nome empresarial do estabelecimento.',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _tradeNameController,
                            decoration: const InputDecoration(
                              labelText: 'Nome fantasia local',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _cnaePrincipalController,
                            decoration: const InputDecoration(
                              labelText: 'CNAE principal',
                            ),
                            validator: _requiredValidator(
                              'Informe um CNAE principal valido.',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _secondaryCnaesController,
                            decoration: const InputDecoration(
                              labelText: 'CNAEs secundarios',
                              helperText:
                                  'Separe varios codigos por virgula quando necessario.',
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    FormSection(
                      title: 'Endereco e contato',
                      description:
                          'Mantenha os campos minimos do endereco e um canal de contato para a operacao local.',
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _line1Controller,
                            decoration: const InputDecoration(
                              labelText: 'Endereco principal',
                            ),
                            validator: _requiredValidator('Informe o endereco principal.'),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _line2Controller,
                            decoration: const InputDecoration(
                              labelText: 'Complemento',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _districtController,
                            decoration: const InputDecoration(
                              labelText: 'Bairro',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _cityNameController,
                            decoration: const InputDecoration(
                              labelText: 'Cidade',
                            ),
                            validator: _requiredValidator('Informe a cidade.'),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _stateCodeController,
                            decoration: const InputDecoration(
                              labelText: 'UF',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _postalCodeController,
                            decoration: const InputDecoration(
                              labelText: 'CEP',
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _contactEmailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'E-mail de contato',
                            ),
                            validator: _emailValidator,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _contactPhoneController,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Telefone',
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

  String? _emailValidator(String? value) {
    final raw = value?.trim() ?? '';
    if (raw.isEmpty) {
      return null;
    }
    final pattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!pattern.hasMatch(raw)) {
      return 'Informe um e-mail valido.';
    }
    return null;
  }
}
