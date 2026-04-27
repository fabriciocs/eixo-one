typedef JsonMap = Map<String, dynamic>;

enum GovernanceRecordStatus {
  draft('draft', 'Rascunho'),
  active('active', 'Ativo'),
  inactive('inactive', 'Inativo'),
  archived('archived', 'Arquivado');

  const GovernanceRecordStatus(this.wireName, this.label);

  final String wireName;
  final String label;

  static GovernanceRecordStatus fromWire(String value) {
    return values.firstWhere(
      (status) => status.wireName == value,
      orElse: () => GovernanceRecordStatus.draft,
    );
  }
}

enum EstablishmentType {
  matrix('MATRIX', 'Matriz'),
  branch('BRANCH', 'Filial');

  const EstablishmentType(this.wireName, this.label);

  final String wireName;
  final String label;

  static EstablishmentType fromWire(String value) {
    return values.firstWhere(
      (type) => type.wireName == value,
      orElse: () => EstablishmentType.branch,
    );
  }
}

enum SharingScopeType {
  global('GLOBAL', 'Global'),
  company('COMPANY', 'Empresa'),
  establishment('ESTABLISHMENT', 'Estabelecimento');

  const SharingScopeType(this.wireName, this.label);

  final String wireName;
  final String label;

  static SharingScopeType fromWire(String value) {
    return values.firstWhere(
      (item) => item.wireName == value,
      orElse: () => SharingScopeType.company,
    );
  }
}

enum ShareMode {
  none('NONE', 'Sem compartilhamento'),
  singleMaster('SINGLE_MASTER', 'Mestre unico'),
  replicated('REPLICATED', 'Replicado');

  const ShareMode(this.wireName, this.label);

  final String wireName;
  final String label;

  static ShareMode fromWire(String value) {
    return values.firstWhere(
      (item) => item.wireName == value,
      orElse: () => ShareMode.none,
    );
  }
}

enum SharingPolicyStatus {
  draft('draft', 'Rascunho'),
  active('active', 'Ativa'),
  inactive('inactive', 'Inativa');

  const SharingPolicyStatus(this.wireName, this.label);

  final String wireName;
  final String label;

  static SharingPolicyStatus fromWire(String value) {
    return values.firstWhere(
      (item) => item.wireName == value,
      orElse: () => SharingPolicyStatus.draft,
    );
  }
}

enum ConsolidationRunStatus {
  draft('draft', 'Rascunho'),
  queued('queued', 'Em fila'),
  blocked('blocked', 'Bloqueada'),
  processing('processing', 'Processando'),
  completed('completed', 'Concluida'),
  completedWithDivergences(
    'completed_with_divergences',
    'Concluida com divergencias',
  ),
  failed('failed', 'Falha');

  const ConsolidationRunStatus(this.wireName, this.label);

  final String wireName;
  final String label;

  static ConsolidationRunStatus fromWire(String value) {
    return values.firstWhere(
      (item) => item.wireName == value,
      orElse: () => ConsolidationRunStatus.draft,
    );
  }
}

List<T> _readList<T>(
  Object? rawValue,
  T Function(JsonMap json) parser,
) {
  if (rawValue is! List) {
    return const [];
  }

  return rawValue
      .whereType<Map>()
      .map((item) => parser(item.cast<String, dynamic>()))
      .toList(growable: false);
}

List<String> _readStringList(Object? rawValue) {
  if (rawValue is! List) {
    return const [];
  }

  return rawValue
      .whereType<Object?>()
      .map((item) => item?.toString() ?? '')
      .where((value) => value.isNotEmpty)
      .toList(growable: false);
}

JsonMap _readJsonMap(Object? rawValue) {
  if (rawValue is Map) {
    return rawValue.cast<String, dynamic>();
  }

  return const <String, dynamic>{};
}

class PaginationInfo {
  const PaginationInfo({
    required this.page,
    required this.pageSize,
    required this.totalItems,
    required this.hasNextPage,
  });

  final int page;
  final int pageSize;
  final int totalItems;
  final bool hasNextPage;

  factory PaginationInfo.fromJson(JsonMap json) {
    return PaginationInfo(
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 10,
      totalItems: json['totalItems'] as int? ?? 0,
      hasNextPage: json['hasNextPage'] as bool? ?? false,
    );
  }
}

class GovernanceListResult<T> {
  const GovernanceListResult({
    required this.items,
    required this.pagination,
  });

  final List<T> items;
  final PaginationInfo pagination;
}

class Address {
  const Address({
    required this.countryCode,
    required this.cityName,
    required this.line1,
    this.postalCode,
    this.stateCode,
    this.cityCode,
    this.district,
    this.line2,
  });

  final String countryCode;
  final String cityName;
  final String line1;
  final String? postalCode;
  final String? stateCode;
  final String? cityCode;
  final String? district;
  final String? line2;

  factory Address.fromJson(JsonMap json) {
    return Address(
      countryCode: (json['countryCode'] as String? ?? 'BR').trim(),
      cityName: (json['cityName'] as String? ?? '').trim(),
      line1: (json['line1'] as String? ?? '').trim(),
      postalCode: (json['postalCode'] as String?)?.trim(),
      stateCode: (json['stateCode'] as String?)?.trim(),
      cityCode: (json['cityCode'] as String?)?.trim(),
      district: (json['district'] as String?)?.trim(),
      line2: (json['line2'] as String?)?.trim(),
    );
  }

  JsonMap toJson() {
    return {
      'countryCode': countryCode,
      'cityName': cityName,
      'line1': line1,
      'postalCode': postalCode,
      'stateCode': stateCode,
      'cityCode': cityCode,
      'district': district,
      'line2': line2,
    };
  }
}

class LocalTaxRegistration {
  const LocalTaxRegistration({
    required this.type,
    required this.registrationNumber,
    this.stateCode,
  });

  final String type;
  final String registrationNumber;
  final String? stateCode;

  factory LocalTaxRegistration.fromJson(JsonMap json) {
    return LocalTaxRegistration(
      type: (json['type'] as String? ?? '').trim(),
      registrationNumber: (json['registrationNumber'] as String? ?? '').trim(),
      stateCode: (json['stateCode'] as String?)?.trim(),
    );
  }

  JsonMap toJson() {
    return {
      'type': type,
      'registrationNumber': registrationNumber,
      'stateCode': stateCode,
    };
  }
}

class LocalLicense {
  const LocalLicense({
    required this.name,
    required this.authority,
    required this.licenseNumber,
    this.expiresAt,
    this.notes,
  });

  final String name;
  final String authority;
  final String licenseNumber;
  final String? expiresAt;
  final String? notes;

  factory LocalLicense.fromJson(JsonMap json) {
    return LocalLicense(
      name: (json['name'] as String? ?? '').trim(),
      authority: (json['authority'] as String? ?? '').trim(),
      licenseNumber: (json['licenseNumber'] as String? ?? '').trim(),
      expiresAt: (json['expiresAt'] as String?)?.trim(),
      notes: (json['notes'] as String?)?.trim(),
    );
  }

  JsonMap toJson() {
    return {
      'name': name,
      'authority': authority,
      'licenseNumber': licenseNumber,
      'expiresAt': expiresAt,
      'notes': notes,
    };
  }
}

class Company {
  const Company({
    required this.companyId,
    required this.tenantId,
    required this.legalName,
    required this.legalNameNormalized,
    required this.companyRootRegistration,
    required this.countryCode,
    required this.legalNatureCode,
    required this.openingDate,
    required this.regimeTributario,
    required this.defaultCurrency,
    required this.fiscalCalendarId,
    required this.consolidationMode,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.version,
    this.tradeName,
    this.primaryEstablishmentId,
    this.groupEconomicId,
  });

  final String companyId;
  final String tenantId;
  final String legalName;
  final String legalNameNormalized;
  final String companyRootRegistration;
  final String countryCode;
  final String legalNatureCode;
  final String openingDate;
  final String regimeTributario;
  final String defaultCurrency;
  final String fiscalCalendarId;
  final String consolidationMode;
  final GovernanceRecordStatus status;
  final String createdAt;
  final String updatedAt;
  final int version;
  final String? tradeName;
  final String? primaryEstablishmentId;
  final String? groupEconomicId;

  factory Company.fromJson(JsonMap json) {
    return Company(
      companyId: (json['companyId'] as String? ?? '').trim(),
      tenantId: (json['tenantId'] as String? ?? '').trim(),
      legalName: (json['legalName'] as String? ?? '').trim(),
      legalNameNormalized: (json['legalNameNormalized'] as String? ?? '').trim(),
      companyRootRegistration:
          (json['companyRootRegistration'] as String? ?? '').trim(),
      countryCode: (json['countryCode'] as String? ?? 'BR').trim(),
      legalNatureCode: (json['legalNatureCode'] as String? ?? '').trim(),
      openingDate: (json['openingDate'] as String? ?? '').trim(),
      regimeTributario: (json['regimeTributario'] as String? ?? '').trim(),
      defaultCurrency: (json['defaultCurrency'] as String? ?? 'BRL').trim(),
      fiscalCalendarId: (json['fiscalCalendarId'] as String? ?? '').trim(),
      consolidationMode: (json['consolidationMode'] as String? ?? '').trim(),
      status: GovernanceRecordStatus.fromWire(
        json['status'] as String? ?? 'draft',
      ),
      createdAt: (json['createdAt'] as String? ?? '').trim(),
      updatedAt: (json['updatedAt'] as String? ?? '').trim(),
      version: json['version'] as int? ?? 0,
      tradeName: (json['tradeName'] as String?)?.trim(),
      primaryEstablishmentId: (json['primaryEstablishmentId'] as String?)?.trim(),
      groupEconomicId: (json['groupEconomicId'] as String?)?.trim(),
    );
  }

  String get displayName => tradeName?.isNotEmpty == true ? tradeName! : legalName;
}

class Establishment {
  const Establishment({
    required this.establishmentId,
    required this.tenantId,
    required this.companyId,
    required this.establishmentType,
    required this.isPrincipal,
    required this.registrationNumber,
    required this.registrationRoot,
    required this.establishmentOrder,
    required this.legalNameAtEstablishment,
    required this.cnaePrincipal,
    required this.address,
    required this.localTaxRegistrations,
    required this.localLicenses,
    required this.isAdministrative,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.version,
    this.tradeNameAtEstablishment,
    this.cnaesSecundarios = const [],
    this.contactEmail,
    this.contactPhone,
  });

  final String establishmentId;
  final String tenantId;
  final String companyId;
  final EstablishmentType establishmentType;
  final bool isPrincipal;
  final String registrationNumber;
  final String registrationRoot;
  final String establishmentOrder;
  final String legalNameAtEstablishment;
  final String cnaePrincipal;
  final Address address;
  final List<LocalTaxRegistration> localTaxRegistrations;
  final List<LocalLicense> localLicenses;
  final bool isAdministrative;
  final GovernanceRecordStatus status;
  final String createdAt;
  final String updatedAt;
  final int version;
  final String? tradeNameAtEstablishment;
  final List<String> cnaesSecundarios;
  final String? contactEmail;
  final String? contactPhone;

  factory Establishment.fromJson(JsonMap json) {
    return Establishment(
      establishmentId: (json['establishmentId'] as String? ?? '').trim(),
      tenantId: (json['tenantId'] as String? ?? '').trim(),
      companyId: (json['companyId'] as String? ?? '').trim(),
      establishmentType: EstablishmentType.fromWire(
        json['establishmentType'] as String? ?? 'BRANCH',
      ),
      isPrincipal: json['isPrincipal'] as bool? ?? false,
      registrationNumber: (json['registrationNumber'] as String? ?? '').trim(),
      registrationRoot: (json['registrationRoot'] as String? ?? '').trim(),
      establishmentOrder: (json['establishmentOrder'] as String? ?? '').trim(),
      legalNameAtEstablishment:
          (json['legalNameAtEstablishment'] as String? ?? '').trim(),
      cnaePrincipal: (json['cnaePrincipal'] as String? ?? '').trim(),
      address: Address.fromJson(_readJsonMap(json['address'])),
      localTaxRegistrations: _readList(
        json['localTaxRegistrations'],
        LocalTaxRegistration.fromJson,
      ),
      localLicenses: _readList(json['localLicenses'], LocalLicense.fromJson),
      isAdministrative: json['isAdministrative'] as bool? ?? false,
      status: GovernanceRecordStatus.fromWire(
        json['status'] as String? ?? 'draft',
      ),
      createdAt: (json['createdAt'] as String? ?? '').trim(),
      updatedAt: (json['updatedAt'] as String? ?? '').trim(),
      version: json['version'] as int? ?? 0,
      tradeNameAtEstablishment:
          (json['tradeNameAtEstablishment'] as String?)?.trim(),
      cnaesSecundarios: _readStringList(json['cnaesSecundarios']),
      contactEmail: (json['contactEmail'] as String?)?.trim(),
      contactPhone: (json['contactPhone'] as String?)?.trim(),
    );
  }

  String get displayName =>
      tradeNameAtEstablishment?.isNotEmpty == true
          ? tradeNameAtEstablishment!
          : legalNameAtEstablishment;
}

class UserScopeGrantCompany {
  const UserScopeGrantCompany({
    required this.companyId,
    required this.establishmentIds,
  });

  final String companyId;
  final List<String> establishmentIds;

  factory UserScopeGrantCompany.fromJson(JsonMap json) {
    return UserScopeGrantCompany(
      companyId: (json['companyId'] as String? ?? '').trim(),
      establishmentIds: _readStringList(json['establishmentIds']),
    );
  }

  JsonMap toJson() {
    return {
      'companyId': companyId,
      'establishmentIds': establishmentIds,
    };
  }
}

class UserScopeGrant {
  const UserScopeGrant({
    required this.tenantId,
    required this.userId,
    required this.companyScopes,
    required this.allowedCompanyIds,
    required this.allowedEstablishmentIds,
    required this.roleKeys,
    required this.permissionOverrides,
    required this.readOnlyAllowed,
    required this.grantsVersion,
    required this.createdAt,
    required this.updatedAt,
    this.defaultCompanyId,
    this.defaultEstablishmentId,
  });

  final String tenantId;
  final String userId;
  final List<UserScopeGrantCompany> companyScopes;
  final List<String> allowedCompanyIds;
  final List<String> allowedEstablishmentIds;
  final List<String> roleKeys;
  final List<String> permissionOverrides;
  final bool readOnlyAllowed;
  final int grantsVersion;
  final String createdAt;
  final String updatedAt;
  final String? defaultCompanyId;
  final String? defaultEstablishmentId;

  factory UserScopeGrant.fromJson(JsonMap json) {
    return UserScopeGrant(
      tenantId: (json['tenantId'] as String? ?? '').trim(),
      userId: (json['userId'] as String? ?? '').trim(),
      companyScopes: _readList(
        json['companyScopes'],
        UserScopeGrantCompany.fromJson,
      ),
      allowedCompanyIds: _readStringList(json['allowedCompanyIds']),
      allowedEstablishmentIds: _readStringList(json['allowedEstablishmentIds']),
      roleKeys: _readStringList(json['roleKeys']),
      permissionOverrides: _readStringList(json['permissionOverrides']),
      readOnlyAllowed: json['readOnlyAllowed'] as bool? ?? false,
      grantsVersion: json['grantsVersion'] as int? ?? 0,
      createdAt: (json['createdAt'] as String? ?? '').trim(),
      updatedAt: (json['updatedAt'] as String? ?? '').trim(),
      defaultCompanyId: (json['defaultCompanyId'] as String?)?.trim(),
      defaultEstablishmentId: (json['defaultEstablishmentId'] as String?)?.trim(),
    );
  }
}

class UserContext {
  const UserContext({
    required this.tenantId,
    required this.userId,
    required this.selectedReadCompanyIds,
    required this.selectedReadEstablishmentIds,
    required this.writeEnabled,
    required this.lastSwitchedAt,
    required this.contextVersion,
    this.activeCompanyId,
    this.activeEstablishmentId,
  });

  final String tenantId;
  final String userId;
  final List<String> selectedReadCompanyIds;
  final List<String> selectedReadEstablishmentIds;
  final bool writeEnabled;
  final String lastSwitchedAt;
  final int contextVersion;
  final String? activeCompanyId;
  final String? activeEstablishmentId;

  factory UserContext.fromJson(JsonMap json) {
    return UserContext(
      tenantId: (json['tenantId'] as String? ?? '').trim(),
      userId: (json['userId'] as String? ?? '').trim(),
      selectedReadCompanyIds: _readStringList(json['selectedReadCompanyIds']),
      selectedReadEstablishmentIds: _readStringList(
        json['selectedReadEstablishmentIds'],
      ),
      writeEnabled: json['writeEnabled'] as bool? ?? false,
      lastSwitchedAt: (json['lastSwitchedAt'] as String? ?? '').trim(),
      contextVersion: json['contextVersion'] as int? ?? 0,
      activeCompanyId: (json['activeCompanyId'] as String?)?.trim(),
      activeEstablishmentId: (json['activeEstablishmentId'] as String?)?.trim(),
    );
  }

  UserContext copyWith({
    String? activeCompanyId,
    String? activeEstablishmentId,
    List<String>? selectedReadCompanyIds,
    List<String>? selectedReadEstablishmentIds,
    bool? writeEnabled,
    String? lastSwitchedAt,
    int? contextVersion,
  }) {
    return UserContext(
      tenantId: tenantId,
      userId: userId,
      activeCompanyId: activeCompanyId ?? this.activeCompanyId,
      activeEstablishmentId:
          activeEstablishmentId ?? this.activeEstablishmentId,
      selectedReadCompanyIds:
          selectedReadCompanyIds ?? this.selectedReadCompanyIds,
      selectedReadEstablishmentIds:
          selectedReadEstablishmentIds ?? this.selectedReadEstablishmentIds,
      writeEnabled: writeEnabled ?? this.writeEnabled,
      lastSwitchedAt: lastSwitchedAt ?? this.lastSwitchedAt,
      contextVersion: contextVersion ?? this.contextVersion,
    );
  }
}

class AccessibleEstablishmentSummary {
  const AccessibleEstablishmentSummary({
    required this.establishmentId,
    required this.companyId,
    required this.legalNameAtEstablishment,
    required this.establishmentType,
    required this.status,
  });

  final String establishmentId;
  final String companyId;
  final String legalNameAtEstablishment;
  final EstablishmentType establishmentType;
  final GovernanceRecordStatus status;

  factory AccessibleEstablishmentSummary.fromJson(JsonMap json) {
    return AccessibleEstablishmentSummary(
      establishmentId: (json['establishmentId'] as String? ?? '').trim(),
      companyId: (json['companyId'] as String? ?? '').trim(),
      legalNameAtEstablishment:
          (json['legalNameAtEstablishment'] as String? ?? '').trim(),
      establishmentType: EstablishmentType.fromWire(
        json['establishmentType'] as String? ?? 'BRANCH',
      ),
      status: GovernanceRecordStatus.fromWire(
        json['status'] as String? ?? 'draft',
      ),
    );
  }
}

class AccessibleCompanySummary {
  const AccessibleCompanySummary({
    required this.companyId,
    required this.legalName,
    required this.status,
    required this.establishments,
  });

  final String companyId;
  final String legalName;
  final GovernanceRecordStatus status;
  final List<AccessibleEstablishmentSummary> establishments;

  factory AccessibleCompanySummary.fromJson(JsonMap json) {
    return AccessibleCompanySummary(
      companyId: (json['companyId'] as String? ?? '').trim(),
      legalName: (json['legalName'] as String? ?? '').trim(),
      status: GovernanceRecordStatus.fromWire(
        json['status'] as String? ?? 'draft',
      ),
      establishments: _readList(
        json['establishments'],
        AccessibleEstablishmentSummary.fromJson,
      ),
    );
  }
}

class AccessibleScopesSummary {
  const AccessibleScopesSummary({
    required this.grant,
    required this.companies,
    this.context,
  });

  final UserScopeGrant grant;
  final UserContext? context;
  final List<AccessibleCompanySummary> companies;

  factory AccessibleScopesSummary.fromJson(JsonMap json) {
    return AccessibleScopesSummary(
      grant: UserScopeGrant.fromJson(_readJsonMap(json['grant'])),
      context: json['context'] == null
          ? null
          : UserContext.fromJson(_readJsonMap(json['context'])),
      companies: _readList(json['companies'], AccessibleCompanySummary.fromJson),
    );
  }
}

class GovernanceUserSummary {
  const GovernanceUserSummary({
    required this.id,
    required this.tenantId,
    required this.email,
    required this.displayName,
    required this.status,
    required this.roleKeys,
    required this.permissionKeys,
    required this.moduleKeys,
    required this.createdAt,
    required this.updatedAt,
    required this.version,
    this.lastLoginAt,
  });

  final String id;
  final String tenantId;
  final String email;
  final String displayName;
  final String status;
  final List<String> roleKeys;
  final List<String> permissionKeys;
  final List<String> moduleKeys;
  final String createdAt;
  final String updatedAt;
  final int version;
  final String? lastLoginAt;

  factory GovernanceUserSummary.fromJson(JsonMap json) {
    return GovernanceUserSummary(
      id: (json['id'] as String? ?? '').trim(),
      tenantId: (json['tenantId'] as String? ?? '').trim(),
      email: (json['email'] as String? ?? '').trim(),
      displayName: (json['displayName'] as String? ?? '').trim(),
      status: (json['status'] as String? ?? '').trim(),
      roleKeys: _readStringList(json['roleKeys']),
      permissionKeys: _readStringList(json['permissionKeys']),
      moduleKeys: _readStringList(json['moduleKeys']),
      createdAt: (json['createdAt'] as String? ?? '').trim(),
      updatedAt: (json['updatedAt'] as String? ?? '').trim(),
      version: json['version'] as int? ?? 0,
      lastLoginAt: (json['lastLoginAt'] as String?)?.trim(),
    );
  }
}

class SharingPolicy {
  const SharingPolicy({
    required this.policyId,
    required this.tenantId,
    required this.domainKey,
    required this.scopeType,
    required this.shareMode,
    required this.participantCompanyIds,
    required this.policyConfig,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.version,
    this.masterCompanyId,
  });

  final String policyId;
  final String tenantId;
  final String domainKey;
  final SharingScopeType scopeType;
  final ShareMode shareMode;
  final List<String> participantCompanyIds;
  final JsonMap policyConfig;
  final SharingPolicyStatus status;
  final String createdAt;
  final String updatedAt;
  final int version;
  final String? masterCompanyId;

  factory SharingPolicy.fromJson(JsonMap json) {
    return SharingPolicy(
      policyId: (json['policyId'] as String? ?? '').trim(),
      tenantId: (json['tenantId'] as String? ?? '').trim(),
      domainKey: (json['domainKey'] as String? ?? '').trim(),
      scopeType: SharingScopeType.fromWire(
        json['scopeType'] as String? ?? 'COMPANY',
      ),
      shareMode: ShareMode.fromWire(json['shareMode'] as String? ?? 'NONE'),
      participantCompanyIds: _readStringList(json['participantCompanyIds']),
      policyConfig: _readJsonMap(json['policyConfig']),
      status: SharingPolicyStatus.fromWire(
        json['status'] as String? ?? 'draft',
      ),
      createdAt: (json['createdAt'] as String? ?? '').trim(),
      updatedAt: (json['updatedAt'] as String? ?? '').trim(),
      version: json['version'] as int? ?? 0,
      masterCompanyId: (json['masterCompanyId'] as String?)?.trim(),
    );
  }
}

class ConsolidatedOverview {
  const ConsolidatedOverview({
    required this.selectedReadCompanyIds,
    required this.selectedReadEstablishmentIds,
    required this.activeCompanyCount,
    required this.activeEstablishmentCount,
    required this.companyStatuses,
    this.writeContextCompanyId,
    this.writeContextEstablishmentId,
    this.latestRunStatus,
  });

  final List<String> selectedReadCompanyIds;
  final List<String> selectedReadEstablishmentIds;
  final int activeCompanyCount;
  final int activeEstablishmentCount;
  final List<CompanyStatusSummary> companyStatuses;
  final String? writeContextCompanyId;
  final String? writeContextEstablishmentId;
  final ConsolidationRunStatus? latestRunStatus;

  factory ConsolidatedOverview.fromJson(JsonMap json) {
    return ConsolidatedOverview(
      selectedReadCompanyIds: _readStringList(json['selectedReadCompanyIds']),
      selectedReadEstablishmentIds: _readStringList(
        json['selectedReadEstablishmentIds'],
      ),
      activeCompanyCount: json['activeCompanyCount'] as int? ?? 0,
      activeEstablishmentCount: json['activeEstablishmentCount'] as int? ?? 0,
      companyStatuses: _readList(
        json['companyStatuses'],
        CompanyStatusSummary.fromJson,
      ),
      writeContextCompanyId: (json['writeContextCompanyId'] as String?)?.trim(),
      writeContextEstablishmentId:
          (json['writeContextEstablishmentId'] as String?)?.trim(),
      latestRunStatus: json['latestRunStatus'] == null
          ? null
          : ConsolidationRunStatus.fromWire(
              json['latestRunStatus'] as String? ?? 'draft',
            ),
    );
  }
}

class CompanyStatusSummary {
  const CompanyStatusSummary({
    required this.companyId,
    required this.status,
  });

  final String companyId;
  final GovernanceRecordStatus status;

  factory CompanyStatusSummary.fromJson(JsonMap json) {
    return CompanyStatusSummary(
      companyId: (json['companyId'] as String? ?? '').trim(),
      status: GovernanceRecordStatus.fromWire(
        json['status'] as String? ?? 'draft',
      ),
    );
  }
}

class ConsolidationIssue {
  const ConsolidationIssue({
    required this.code,
    required this.message,
    required this.blocking,
    this.companyId,
    this.field,
  });

  final String code;
  final String message;
  final bool blocking;
  final String? companyId;
  final String? field;

  factory ConsolidationIssue.fromJson(JsonMap json) {
    return ConsolidationIssue(
      code: (json['code'] as String? ?? '').trim(),
      message: (json['message'] as String? ?? '').trim(),
      blocking: json['blocking'] as bool? ?? false,
      companyId: (json['companyId'] as String?)?.trim(),
      field: (json['field'] as String?)?.trim(),
    );
  }
}

class ConsolidationValidationSummary {
  const ConsolidationValidationSummary({
    required this.blockingIssueCount,
    required this.warningCount,
    required this.issues,
  });

  final int blockingIssueCount;
  final int warningCount;
  final List<ConsolidationIssue> issues;

  factory ConsolidationValidationSummary.fromJson(JsonMap json) {
    return ConsolidationValidationSummary(
      blockingIssueCount: json['blockingIssueCount'] as int? ?? 0,
      warningCount: json['warningCount'] as int? ?? 0,
      issues: _readList(json['issues'], ConsolidationIssue.fromJson),
    );
  }
}

class ConsolidationResultSummary {
  const ConsolidationResultSummary({
    required this.participantCompanyCount,
    required this.participantEstablishmentCount,
    required this.includedCompanyIds,
    required this.totalIssues,
  });

  final int participantCompanyCount;
  final int participantEstablishmentCount;
  final List<String> includedCompanyIds;
  final int totalIssues;

  factory ConsolidationResultSummary.fromJson(JsonMap json) {
    return ConsolidationResultSummary(
      participantCompanyCount: json['participantCompanyCount'] as int? ?? 0,
      participantEstablishmentCount:
          json['participantEstablishmentCount'] as int? ?? 0,
      includedCompanyIds: _readStringList(json['includedCompanyIds']),
      totalIssues: json['totalIssues'] as int? ?? 0,
    );
  }
}

class ConsolidationRun {
  const ConsolidationRun({
    required this.runId,
    required this.tenantId,
    required this.participantCompanyIds,
    required this.participantEstablishmentIds,
    required this.periodStart,
    required this.periodEnd,
    required this.fiscalCalendarId,
    required this.currencyCode,
    required this.fxPolicy,
    required this.percentagePolicy,
    required this.eliminationMode,
    required this.status,
    required this.validationSummary,
    required this.requestedBy,
    required this.idempotencyKey,
    required this.createdAt,
    required this.updatedAt,
    required this.version,
    this.resultSummary,
    this.errorSummary,
    this.startedAt,
    this.completedAt,
  });

  final String runId;
  final String tenantId;
  final List<String> participantCompanyIds;
  final List<String> participantEstablishmentIds;
  final String periodStart;
  final String periodEnd;
  final String fiscalCalendarId;
  final String currencyCode;
  final JsonMap fxPolicy;
  final JsonMap percentagePolicy;
  final String eliminationMode;
  final ConsolidationRunStatus status;
  final ConsolidationValidationSummary validationSummary;
  final String requestedBy;
  final String idempotencyKey;
  final String createdAt;
  final String updatedAt;
  final int version;
  final ConsolidationResultSummary? resultSummary;
  final JsonMap? errorSummary;
  final String? startedAt;
  final String? completedAt;

  factory ConsolidationRun.fromJson(JsonMap json) {
    return ConsolidationRun(
      runId: (json['runId'] as String? ?? '').trim(),
      tenantId: (json['tenantId'] as String? ?? '').trim(),
      participantCompanyIds: _readStringList(json['participantCompanyIds']),
      participantEstablishmentIds: _readStringList(
        json['participantEstablishmentIds'],
      ),
      periodStart: (json['periodStart'] as String? ?? '').trim(),
      periodEnd: (json['periodEnd'] as String? ?? '').trim(),
      fiscalCalendarId: (json['fiscalCalendarId'] as String? ?? '').trim(),
      currencyCode: (json['currencyCode'] as String? ?? '').trim(),
      fxPolicy: _readJsonMap(json['fxPolicy']),
      percentagePolicy: _readJsonMap(json['percentagePolicy']),
      eliminationMode: (json['eliminationMode'] as String? ?? '').trim(),
      status: ConsolidationRunStatus.fromWire(
        json['status'] as String? ?? 'draft',
      ),
      validationSummary: ConsolidationValidationSummary.fromJson(
        _readJsonMap(json['validationSummary']),
      ),
      requestedBy: (json['requestedBy'] as String? ?? '').trim(),
      idempotencyKey: (json['idempotencyKey'] as String? ?? '').trim(),
      createdAt: (json['createdAt'] as String? ?? '').trim(),
      updatedAt: (json['updatedAt'] as String? ?? '').trim(),
      version: json['version'] as int? ?? 0,
      resultSummary: json['resultSummary'] == null
          ? null
          : ConsolidationResultSummary.fromJson(
              _readJsonMap(json['resultSummary']),
            ),
      errorSummary: json['errorSummary'] == null
          ? null
          : _readJsonMap(json['errorSummary']),
      startedAt: (json['startedAt'] as String?)?.trim(),
      completedAt: (json['completedAt'] as String?)?.trim(),
    );
  }
}
