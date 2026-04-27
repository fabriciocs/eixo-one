import 'package:flutter/material.dart';

import '../data/customers_repository.dart';
import '../domain/customer.dart';

class CustomerFormPage extends StatefulWidget {
  const CustomerFormPage({
    super.key,
    required this.repository,
    required this.empresaId,
    this.filialId,
    this.existingCustomer,
  });

  final CustomersRepository repository;
  final String empresaId;
  final String? filialId;
  final Customer? existingCustomer;

  @override
  State<CustomerFormPage> createState() => _CustomerFormPageState();
}

class _CustomerFormPageState extends State<CustomerFormPage> {
  final _formKey = GlobalKey<FormState>();
  late CustomerPersonType _tipoPessoa;
  late CustomerStatus _status;
  late final TextEditingController _nomeController;
  late final TextEditingController _documentoController;
  late final TextEditingController _emailController;
  late final TextEditingController _telefoneController;
  late final TextEditingController _limiteCreditoController;
  late final TextEditingController _observacaoController;
  bool _saving = false;
  String? _serverError;

  bool get _isEditing => widget.existingCustomer != null;

  @override
  void initState() {
    super.initState();
    final customer = widget.existingCustomer;
    _tipoPessoa = customer?.tipoPessoa ?? CustomerPersonType.pj;
    _status = customer?.status ?? CustomerStatus.rascunho;
    _nomeController = TextEditingController(text: customer?.nome ?? '');
    _documentoController = TextEditingController(text: customer?.cpfCnpj ?? '');
    _emailController = TextEditingController(text: customer?.email ?? '');
    _telefoneController = TextEditingController(text: customer?.telefone ?? '');
    _limiteCreditoController = TextEditingController(text: ((customer?.limiteCreditoCentavos ?? 0) / 100).toStringAsFixed(2));
    _observacaoController = TextEditingController();
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _documentoController.dispose();
    _emailController.dispose();
    _telefoneController.dispose();
    _limiteCreditoController.dispose();
    _observacaoController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _serverError = null);

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final draft = CustomerDraft(
      empresaId: widget.empresaId,
      filialId: widget.filialId,
      tipoPessoa: _tipoPessoa,
      nome: _nomeController.text,
      cpfCnpj: _documentoController.text,
      email: _emailController.text,
      telefone: _telefoneController.text,
      limiteCreditoCentavos: _parseMoneyToCents(_limiteCreditoController.text),
      status: _status,
      observacao: _observacaoController.text.trim().isEmpty ? null : _observacaoController.text.trim(),
    );

    final error = validateCustomerDraft(draft);
    if (error != null) {
      setState(() => _serverError = error);
      return;
    }

    setState(() => _saving = true);
    try {
      if (_isEditing) {
        await widget.repository.update(widget.existingCustomer!.id, widget.existingCustomer!.version, draft);
      } else {
        await widget.repository.create(draft);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_isEditing ? 'Cliente atualizado.' : 'Cliente criado.')));
      Navigator.of(context).pop(true);
    } on CustomerApiException catch (error) {
      setState(() => _serverError = error.message);
    } catch (_) {
      setState(() => _serverError = 'Não foi possível salvar. Tente novamente.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = _isEditing ? 'Editar cliente' : 'Novo cliente';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_serverError != null)
                Semantics(
                  liveRegion: true,
                  child: Card(
                    color: Theme.of(context).colorScheme.errorContainer,
                    child: ListTile(
                      leading: const Icon(Icons.error_outline),
                      title: Text(_serverError!),
                    ),
                  ),
                ),
              _SectionCard(
                title: 'Dados principais',
                children: [
                  DropdownButtonFormField<CustomerPersonType>(
                    value: _tipoPessoa,
                    decoration: const InputDecoration(labelText: 'Tipo de pessoa'),
                    items: const [
                      DropdownMenuItem(value: CustomerPersonType.pf, child: Text('Pessoa física')),
                      DropdownMenuItem(value: CustomerPersonType.pj, child: Text('Pessoa jurídica')),
                      DropdownMenuItem(value: CustomerPersonType.estrangeiro, child: Text('Estrangeiro')),
                    ],
                    onChanged: _saving ? null : (value) => setState(() => _tipoPessoa = value ?? CustomerPersonType.pj),
                  ),
                  TextFormField(
                    controller: _nomeController,
                    decoration: const InputDecoration(
                      labelText: 'Nome/Razão social',
                      hintText: 'Ex.: Empresa Exemplo Ltda.',
                      helperText: '2 a 150 caracteres, sem HTML/script.',
                    ),
                    textInputAction: TextInputAction.next,
                    validator: (value) {
                      final text = value?.trim() ?? '';
                      if (text.length < 2 || text.length > 150) return 'Informe um nome válido.';
                      if (RegExp(r'[<>]').hasMatch(text)) return 'Remova caracteres HTML/script.';
                      return null;
                    },
                  ),
                  TextFormField(
                    controller: _documentoController,
                    decoration: InputDecoration(
                      labelText: _tipoPessoa == CustomerPersonType.pf
                          ? 'CPF'
                          : _tipoPessoa == CustomerPersonType.pj
                              ? 'CNPJ'
                              : 'Documento estrangeiro',
                      helperText: 'Será validado novamente no backend.',
                    ),
                    keyboardType: TextInputType.text,
                    textInputAction: TextInputAction.next,
                    validator: (value) {
                      if (_tipoPessoa == CustomerPersonType.pf && !isValidCpf(value ?? '')) return 'Informe um CPF válido.';
                      if (_tipoPessoa == CustomerPersonType.pj && !isValidCnpj(value ?? '')) return 'Informe um CNPJ válido.';
                      if (_tipoPessoa == CustomerPersonType.estrangeiro && (value ?? '').trim().length < 3) return 'Informe o documento.';
                      return null;
                    },
                  ),
                  DropdownButtonFormField<CustomerStatus>(
                    value: _status,
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: const [
                      DropdownMenuItem(value: CustomerStatus.rascunho, child: Text('Rascunho')),
                      DropdownMenuItem(value: CustomerStatus.ativo, child: Text('Ativo')),
                      DropdownMenuItem(value: CustomerStatus.bloqueado, child: Text('Bloqueado')),
                      DropdownMenuItem(value: CustomerStatus.inativo, child: Text('Inativo')),
                    ],
                    onChanged: _saving ? null : (value) => setState(() => _status = value ?? CustomerStatus.rascunho),
                  ),
                ],
              ),
              _SectionCard(
                title: 'Contato e comercial',
                children: [
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'E-mail'),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: (value) {
                      final email = value?.trim() ?? '';
                      if (email.isEmpty) return null;
                      if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) return 'Informe um e-mail válido.';
                      return null;
                    },
                  ),
                  TextFormField(
                    controller: _telefoneController,
                    decoration: const InputDecoration(labelText: 'Telefone'),
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                  ),
                  TextFormField(
                    controller: _limiteCreditoController,
                    decoration: const InputDecoration(
                      labelText: 'Limite de crédito',
                      prefixText: 'R$ ',
                      helperText: 'Alterações devem ser auditadas.',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (value) => _parseMoneyToCents(value ?? '') < 0 ? 'Informe valor maior ou igual a zero.' : null,
                  ),
                ],
              ),
              _SectionCard(
                title: 'Observações',
                children: [
                  TextFormField(
                    controller: _observacaoController,
                    decoration: const InputDecoration(
                      labelText: 'Observação',
                      helperText: 'Não informe dados sensíveis desnecessários.',
                    ),
                    minLines: 3,
                    maxLines: 6,
                    maxLength: 2000,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _saving ? null : () => Navigator.of(context).maybePop(),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _saving ? null : _save,
                      icon: _saving
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.save),
                      label: Text(_saving ? 'Salvando...' : 'Salvar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  int _parseMoneyToCents(String value) {
    final normalized = value.trim().replaceAll('.', '').replaceAll(',', '.');
    final parsed = double.tryParse(normalized);
    if (parsed == null || parsed < 0) return -1;
    return (parsed * 100).round();
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final content = children
                .map((child) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: child,
                    ))
                .toList();

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ...content,
              ],
            );
          },
        ),
      ),
    );
  }
}
