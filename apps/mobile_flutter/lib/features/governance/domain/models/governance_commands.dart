import 'governance_models.dart';

String? _normalizeOptional(String? value) {
  final normalized = value?.trim() ?? '';
  return normalized.isEmpty ? null : normalized;
}

List<String> _csvToList(String rawValue) {
  return rawValue
      .split(',')
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toSet()
      .toList(growable: false);
}

class CompanyFilters {
  const CompanyFilters({
    this.status,
    this.countryCode,
    this.regimeTributario,
    this.search,
    this.page = 1,
    this.pageSize = 20,
  });

  final GovernanceRecordStatus? status;
  final String? countryCode;
  final String? regimeTributario;
  final String? search;
  final int page;
  final int pageSize;

  Map<String, String> toQueryParameters() {
    return {
      'page': '$page',
      'pageSize': '$pageSize',
      if (status != null) 'status': status!.wireName,
      if (_normalizeOptional(countryCode) != null)
        'countryCode': _normalizeOptional(countryCode)!,
      if (_normalizeOptional(regimeTributario) != null)
        'regimeTributario': _normalizeOptional(regimeTributario)!,
      if (_normalizeOptional(search) != null)
        'search': _normalizeOptional(search)!,
    };
  }

  CompanyFilters copyWith({
    GovernanceRecordStatus? status,
    String? countryCode,
    String? regimeTributario,
    String? search,
    int? page,
    int? pageSize,
    bool clearStatus = false,
    bool clearCountryCode = false,
    bool clearRegimeTributario = false,
  }) {
    return CompanyFilters(
      status: clearStatus ? null : status ?? this.status,
      countryCode: clearCountryCode ? null : countryCode ?? this.countryCode,
      regimeTributario: clearRegimeTributario
          ? null
          : regimeTributario ?? this.regimeTributario,
      search: search ?? this.search,
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
    );
  }
}

class EstablishmentFilters {
  const EstablishmentFilters({
    this.companyId,
    this.status,
    this.establishmentType,
    this.search,
    this.page = 1,
    this.pageSize = 30,
  });

  final String? companyId;
  final GovernanceRecordStatus? status;
  final EstablishmentType? establishmentType;
  final String? search;
  final int page;
  final int pageSize;

  Map<String, String> toQueryParameters() {
    return {
      'page': '$page',
      'pageSize': '$pageSize',
      if (_normalizeOptional(companyId) != null)
        'companyId': _normalizeOptional(companyId)!,
      if (status != null) 'status': status!.wireName,
      if (establishmentType != null)
        'establishmentType': establishmentType!.wireName,
      if (_normalizeOptional(search) != null)
        'search': _normalizeOptional(search)!,
    };
  }
}

class GovernanceUserFilters {
  const GovernanceUserFilters({
    this.status,
    this.search,
    this.page = 1,
    this.pageSize = 20,
  });

  final String? status;
  final String? search;
  final int page;
  final int pageSize;

  Map<String, String> toQueryParameters() {
    return {
      'page': '$page',
      'pageSize': '$pageSize',
      if (_normalizeOptional(status) != null) 'status': _normalizeOptional(status)!,
      if (_normalizeOptional(search) != null) 'search': _normalizeOptional(search)!,
    };
  }
}

class ConsolidationRunFilters {
  const ConsolidationRunFilters({
    this.status,
    this.requestedBy,
    this.page = 1,
    this.pageSize = 20,
  });

  final ConsolidationRunStatus? status;
  final String? requestedBy;
  final int page;
  final int pageSize;

  Map<String, String> toQueryParameters() {
    return {
      'page': '$page',
      'pageSize': '$pageSize',
      if (status != null) 'status': status!.wireName,
      if (_normalizeOptional(requestedBy) != null)
        'requestedBy': _normalizeOptional(requestedBy)!,
    };
  }
}

class CreateCompanyInput {
  const CreateCompanyInput({
    required this.legalName,
    required this.companyRootRegistration,
    required this.legalNatureCode,
    required this.openingDate,
    required this.regimeTributario,
    required this.defaultCurrency,
    required this.fiscalCalendarId,
    required this.consolidationMode,
    this.tradeName,
    this.countryCode = 'BR',
    this.groupEconomicId,
  });

  final String legalName;
  final String? tradeName;
  final String companyRootRegistration;
  final String countryCode;
  final String legalNatureCode;
  final String openingDate;
  final String regimeTributario;
  final String defaultCurrency;
  final String fiscalCalendarId;
  final String consolidationMode;
  final String? groupEconomicId;

  JsonMap toJson() {
    return {
      'legalName': legalName.trim(),
      'tradeName': _normalizeOptional(tradeName),
      'companyRootRegistration':
          companyRootRegistration.replaceAll(RegExp(r'\s+'), '').toUpperCase(),
      'countryCode': countryCode.trim().toUpperCase(),
      'legalNatureCode': legalNatureCode.trim(),
      'openingDate': openingDate.trim(),
      'regimeTributario': regimeTributario.trim(),
      'defaultCurrency': defaultCurrency.trim().toUpperCase(),
      'fiscalCalendarId': fiscalCalendarId.trim(),
      'consolidationMode': consolidationMode.trim(),
      'groupEconomicId': _normalizeOptional(groupEconomicId),
    }..removeWhere((key, value) => value == null);
  }
}

class UpdateCompanyInput extends CreateCompanyInput {
  const UpdateCompanyInput({
    required this.expectedVersion,
    required super.legalName,
    required super.companyRootRegistration,
    required super.legalNatureCode,
    required super.openingDate,
    required super.regimeTributario,
    required super.defaultCurrency,
    required super.fiscalCalendarId,
    required super.consolidationMode,
    super.tradeName,
    super.countryCode,
    super.groupEconomicId,
  });

  final int expectedVersion;

  @override
  JsonMap toJson() {
    return {
      ...super.toJson(),
      'expectedVersion': expectedVersion,
    };
  }
}

class CreateEstablishmentInput {
  const CreateEstablishmentInput({
    required this.companyId,
    required this.establishmentType,
    required this.isPrincipal,
    required this.registrationNumber,
    required this.registrationRoot,
    required this.establishmentOrder,
    required this.legalNameAtEstablishment,
    required this.cnaePrincipal,
    required this.address,
    this.tradeNameAtEstablishment,
    this.cnaesSecundarios = const [],
    this.localTaxRegistrations = const [],
    this.localLicenses = const [],
    this.contactEmail,
    this.contactPhone,
    this.isAdministrative = false,
  });

  final String companyId;
  final EstablishmentType establishmentType;
  final bool isPrincipal;
  final String registrationNumber;
  final String registrationRoot;
  final String establishmentOrder;
  final String legalNameAtEstablishment;
  final String? tradeNameAtEstablishment;
  final String cnaePrincipal;
  final List<String> cnaesSecundarios;
  final Address address;
  final List<LocalTaxRegistration> localTaxRegistrations;
  final List<LocalLicense> localLicenses;
  final String? contactEmail;
  final String? contactPhone;
  final bool isAdministrative;

  JsonMap toJson() {
    return {
      'companyId': companyId,
      'establishmentType': establishmentType.wireName,
      'isPrincipal': isPrincipal,
      'registrationNumber':
          registrationNumber.replaceAll(RegExp(r'\s+'), '').toUpperCase(),
      'registrationRoot':
          registrationRoot.replaceAll(RegExp(r'\s+'), '').toUpperCase(),
      'establishmentOrder': establishmentOrder.trim(),
      'legalNameAtEstablishment': legalNameAtEstablishment.trim(),
      'tradeNameAtEstablishment': _normalizeOptional(tradeNameAtEstablishment),
      'cnaePrincipal': cnaePrincipal.trim(),
      'cnaesSecundarios': cnaesSecundarios,
      'address': address.toJson(),
      'localTaxRegistrations':
          localTaxRegistrations.map((item) => item.toJson()).toList(),
      'localLicenses': localLicenses.map((item) => item.toJson()).toList(),
      'contactEmail': _normalizeOptional(contactEmail),
      'contactPhone': _normalizeOptional(contactPhone),
      'isAdministrative': isAdministrative,
    }..removeWhere((key, value) => value == null);
  }
}

class UpdateEstablishmentInput extends CreateEstablishmentInput {
  const UpdateEstablishmentInput({
    required this.expectedVersion,
    required super.companyId,
    required super.establishmentType,
    required super.isPrincipal,
    required super.registrationNumber,
    required super.registrationRoot,
    required super.establishmentOrder,
    required super.legalNameAtEstablishment,
    required super.cnaePrincipal,
    required super.address,
    super.tradeNameAtEstablishment,
    super.cnaesSecundarios,
    super.localTaxRegistrations,
    super.localLicenses,
    super.contactEmail,
    super.contactPhone,
    super.isAdministrative,
  });

  final int expectedVersion;

  @override
  JsonMap toJson() {
    final payload = super.toJson();
    payload['expectedVersion'] = expectedVersion;
    payload.remove('companyId');
    return payload;
  }
}

class SwitchOperationalContextInput {
  const SwitchOperationalContextInput({
    required this.selectedReadCompanyIds,
    required this.selectedReadEstablishmentIds,
    required this.writeEnabled,
    this.activeCompanyId,
    this.activeEstablishmentId,
  });

  final List<String> selectedReadCompanyIds;
  final List<String> selectedReadEstablishmentIds;
  final bool writeEnabled;
  final String? activeCompanyId;
  final String? activeEstablishmentId;

  JsonMap toJson() {
    return {
      'activeCompanyId': _normalizeOptional(activeCompanyId),
      'activeEstablishmentId': _normalizeOptional(activeEstablishmentId),
      'selectedReadCompanyIds': selectedReadCompanyIds,
      'selectedReadEstablishmentIds': selectedReadEstablishmentIds,
      'writeEnabled': writeEnabled,
    };
  }
}

class UpsertUserScopeGrantInput {
  const UpsertUserScopeGrantInput({
    required this.companies,
    required this.readOnlyAllowed,
    this.defaultCompanyId,
    this.defaultEstablishmentId,
    this.roleKeys = const [],
    this.permissionOverrides = const [],
    this.justification,
  });

  final List<UserScopeGrantCompany> companies;
  final bool readOnlyAllowed;
  final String? defaultCompanyId;
  final String? defaultEstablishmentId;
  final List<String> roleKeys;
  final List<String> permissionOverrides;
  final String? justification;

  JsonMap toJson() {
    return {
      'companies': companies.map((item) => item.toJson()).toList(),
      'defaultCompanyId': _normalizeOptional(defaultCompanyId),
      'defaultEstablishmentId': _normalizeOptional(defaultEstablishmentId),
      'readOnlyAllowed': readOnlyAllowed,
      'roleKeys': roleKeys,
      'permissionOverrides': permissionOverrides,
      'justification': _normalizeOptional(justification),
    }..removeWhere((key, value) => value == null);
  }
}

class CreateConsolidationRunInput {
  const CreateConsolidationRunInput({
    required this.participantCompanyIds,
    required this.participantEstablishmentIds,
    required this.periodStart,
    required this.periodEnd,
    required this.fiscalCalendarId,
    required this.currencyCode,
    required this.fxPolicy,
    required this.percentagePolicy,
    required this.eliminationMode,
    this.notes,
  });

  final List<String> participantCompanyIds;
  final List<String> participantEstablishmentIds;
  final String periodStart;
  final String periodEnd;
  final String fiscalCalendarId;
  final String currencyCode;
  final JsonMap fxPolicy;
  final JsonMap percentagePolicy;
  final String eliminationMode;
  final String? notes;

  JsonMap toJson() {
    return {
      'participantCompanyIds': participantCompanyIds,
      'participantEstablishmentIds': participantEstablishmentIds,
      'periodStart': periodStart.trim(),
      'periodEnd': periodEnd.trim(),
      'fiscalCalendarId': fiscalCalendarId.trim(),
      'currencyCode': currencyCode.trim().toUpperCase(),
      'fxPolicy': fxPolicy,
      'percentagePolicy': percentagePolicy,
      'eliminationMode': eliminationMode.trim(),
      'notes': _normalizeOptional(notes),
    }..removeWhere((key, value) => value == null);
  }
}

class EstablishmentFormDraft {
  EstablishmentFormDraft({
    required this.registrationNumber,
    required this.registrationRoot,
    required this.establishmentOrder,
    required this.legalNameAtEstablishment,
    required this.tradeNameAtEstablishment,
    required this.cnaePrincipal,
    required this.secondaryCnaesRaw,
    required this.contactEmail,
    required this.contactPhone,
    required this.postalCode,
    required this.stateCode,
    required this.cityCode,
    required this.cityName,
    required this.district,
    required this.line1,
    required this.line2,
  });

  final String registrationNumber;
  final String registrationRoot;
  final String establishmentOrder;
  final String legalNameAtEstablishment;
  final String tradeNameAtEstablishment;
  final String cnaePrincipal;
  final String secondaryCnaesRaw;
  final String contactEmail;
  final String contactPhone;
  final String postalCode;
  final String stateCode;
  final String cityCode;
  final String cityName;
  final String district;
  final String line1;
  final String line2;

  List<String> get parsedSecondaryCnaes => _csvToList(secondaryCnaesRaw);
}
