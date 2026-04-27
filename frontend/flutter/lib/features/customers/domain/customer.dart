enum CustomerPersonType { pf, pj, estrangeiro }
enum CustomerStatus { rascunho, ativo, bloqueado, inativo }

class CustomerAddress {
  const CustomerAddress({
    this.id,
    required this.label,
    this.postalCode,
    this.street,
    this.number,
    this.complement,
    this.district,
    required this.city,
    this.state,
    required this.country,
    required this.isPrimary,
  });

  final String? id;
  final String label;
  final String? postalCode;
  final String? street;
  final String? number;
  final String? complement;
  final String? district;
  final String city;
  final String? state;
  final String country;
  final bool isPrimary;

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'label': label,
        if (postalCode != null) 'postalCode': postalCode,
        if (street != null) 'street': street,
        if (number != null) 'number': number,
        if (complement != null) 'complement': complement,
        if (district != null) 'district': district,
        'city': city,
        if (state != null) 'state': state,
        'country': country,
        'isPrimary': isPrimary,
      };
}

class CustomerContact {
  const CustomerContact({
    this.id,
    required this.name,
    this.role,
    this.email,
    this.phone,
    required this.isPrimary,
  });

  final String? id;
  final String name;
  final String? role;
  final String? email;
  final String? phone;
  final bool isPrimary;

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'name': name,
        if (role != null) 'role': role,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        'isPrimary': isPrimary,
      };
}

class Customer {
  const Customer({
    required this.id,
    required this.empresaId,
    this.filialId,
    this.codigo,
    required this.tipoPessoa,
    required this.nome,
    this.nomeFantasia,
    this.cpfCnpj,
    this.email,
    this.telefone,
    this.limiteCreditoCentavos = 0,
    this.vendedorResponsavelId,
    required this.status,
    this.tags = const [],
    this.addresses = const [],
    this.contacts = const [],
    required this.version,
  });

  final String id;
  final String empresaId;
  final String? filialId;
  final String? codigo;
  final CustomerPersonType tipoPessoa;
  final String nome;
  final String? nomeFantasia;
  final String? cpfCnpj;
  final String? email;
  final String? telefone;
  final int limiteCreditoCentavos;
  final String? vendedorResponsavelId;
  final CustomerStatus status;
  final List<String> tags;
  final List<CustomerAddress> addresses;
  final List<CustomerContact> contacts;
  final int version;
}

class CustomerDraft {
  CustomerDraft({
    required this.empresaId,
    this.filialId,
    this.codigo,
    required this.tipoPessoa,
    required this.nome,
    this.nomeFantasia,
    this.cpfCnpj,
    this.documentoEstrangeiro,
    this.email,
    this.telefone,
    this.limiteCreditoCentavos = 0,
    this.vendedorResponsavelId,
    this.status = CustomerStatus.rascunho,
    this.tags = const [],
    this.addresses = const [],
    this.contacts = const [],
    this.observacao,
  });

  String empresaId;
  String? filialId;
  String? codigo;
  CustomerPersonType tipoPessoa;
  String nome;
  String? nomeFantasia;
  String? cpfCnpj;
  String? documentoEstrangeiro;
  String? email;
  String? telefone;
  int limiteCreditoCentavos;
  String? vendedorResponsavelId;
  CustomerStatus status;
  List<String> tags;
  List<CustomerAddress> addresses;
  List<CustomerContact> contacts;
  String? observacao;

  Map<String, dynamic> toJson() => {
        'empresaId': empresaId,
        if (filialId != null) 'filialId': filialId,
        if (codigo != null) 'codigo': codigo,
        'tipoPessoa': personTypeToApi(tipoPessoa),
        'nome': nome.trim(),
        if (nomeFantasia != null) 'nomeFantasia': nomeFantasia!.trim(),
        if (cpfCnpj != null) 'cpfCnpj': cpfCnpj,
        if (documentoEstrangeiro != null) 'documentoEstrangeiro': documentoEstrangeiro,
        if (email != null) 'email': email!.trim().toLowerCase(),
        if (telefone != null) 'telefone': telefone,
        'limiteCreditoCentavos': limiteCreditoCentavos,
        if (vendedorResponsavelId != null) 'vendedorResponsavelId': vendedorResponsavelId,
        'status': statusToApi(status),
        'tags': tags,
        'addresses': addresses.map((item) => item.toJson()).toList(),
        'contacts': contacts.map((item) => item.toJson()).toList(),
        if (observacao != null) 'observacao': observacao,
      };
}

String personTypeToApi(CustomerPersonType type) {
  switch (type) {
    case CustomerPersonType.pf:
      return 'PF';
    case CustomerPersonType.pj:
      return 'PJ';
    case CustomerPersonType.estrangeiro:
      return 'ESTRANGEIRO';
  }
}

String statusToApi(CustomerStatus status) {
  switch (status) {
    case CustomerStatus.rascunho:
      return 'rascunho';
    case CustomerStatus.ativo:
      return 'ativo';
    case CustomerStatus.bloqueado:
      return 'bloqueado';
    case CustomerStatus.inativo:
      return 'inativo';
  }
}

String onlyDigits(String? value) => (value ?? '').replaceAll(RegExp(r'\D'), '');

bool isValidCpf(String value) {
  final cpf = onlyDigits(value);
  if (!RegExp(r'^\d{11}$').hasMatch(cpf)) return false;
  if (RegExp(r'^(\d)\1{10}$').hasMatch(cpf)) return false;

  int sum = 0;
  for (int i = 0; i < 9; i++) {
    sum += int.parse(cpf[i]) * (10 - i);
  }
  int digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit != int.parse(cpf[9])) return false;

  sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += int.parse(cpf[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit == int.parse(cpf[10]);
}

bool isValidCnpj(String value) {
  final cnpj = onlyDigits(value);
  if (!RegExp(r'^\d{14}$').hasMatch(cnpj)) return false;
  if (RegExp(r'^(\d)\1{13}$').hasMatch(cnpj)) return false;

  int calc(String base, List<int> weights) {
    int sum = 0;
    for (int i = 0; i < weights.length; i++) {
      sum += int.parse(base[i]) * weights[i];
    }
    final result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  }

  final digit1 = calc(cnpj.substring(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  final digit2 = calc(cnpj.substring(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digit1 == int.parse(cnpj[12]) && digit2 == int.parse(cnpj[13]);
}

String? validateCustomerDraft(CustomerDraft draft) {
  if (draft.nome.trim().length < 2 || draft.nome.trim().length > 150) {
    return 'Informe nome ou razão social com 2 a 150 caracteres.';
  }
  if (RegExp(r'[<>]').hasMatch(draft.nome)) {
    return 'Nome não pode conter HTML/script.';
  }
  if (draft.tipoPessoa == CustomerPersonType.pf && !isValidCpf(draft.cpfCnpj ?? '')) {
    return 'Informe um CPF válido.';
  }
  if (draft.tipoPessoa == CustomerPersonType.pj && !isValidCnpj(draft.cpfCnpj ?? '')) {
    return 'Informe um CNPJ válido.';
  }
  if (draft.tipoPessoa == CustomerPersonType.estrangeiro && (draft.documentoEstrangeiro ?? '').trim().length < 3) {
    return 'Informe o documento estrangeiro.';
  }
  if (draft.email != null && draft.email!.isNotEmpty) {
    final email = draft.email!.trim();
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      return 'Informe um e-mail válido.';
    }
  }
  if (draft.limiteCreditoCentavos < 0) {
    return 'Limite de crédito deve ser maior ou igual a zero.';
  }
  if (draft.addresses.where((item) => item.isPrimary).length > 1) {
    return 'Marque apenas um endereço como principal.';
  }
  if (draft.contacts.where((item) => item.isPrimary).length > 1) {
    return 'Marque apenas um contato como principal.';
  }
  return null;
}
