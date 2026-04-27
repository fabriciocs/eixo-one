import 'dart:math';

import '../../../core/errors/app_failure.dart';
import '../../../shared/models/auth_session.dart';
import '../application/governance_repository.dart';
import '../domain/models/governance_commands.dart';
import '../domain/models/governance_models.dart';

class InMemoryGovernanceRepository implements GovernanceRepository {
  InMemoryGovernanceRepository();

  final Map<String, Company> _companies = {
    'tenant_demo:cmp_demo': const Company(
      companyId: 'cmp_demo',
      tenantId: 'tenant_demo',
      legalName: 'Empresa Demo LTDA',
      tradeName: 'Demo',
      legalNameNormalized: 'empresa demo ltda',
      companyRootRegistration: '12345678',
      countryCode: 'BR',
      legalNatureCode: '2062',
      openingDate: '2024-01-15',
      regimeTributario: 'LUCRO_REAL',
      defaultCurrency: 'BRL',
      fiscalCalendarId: 'cal_br_default',
      consolidationMode: 'FULL',
      primaryEstablishmentId: 'est_demo_matrix',
      status: GovernanceRecordStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 3,
    ),
    'tenant_demo:cmp_ops': const Company(
      companyId: 'cmp_ops',
      tenantId: 'tenant_demo',
      legalName: 'Operacao Piloto LTDA',
      tradeName: 'Piloto',
      legalNameNormalized: 'operacao piloto ltda',
      companyRootRegistration: '87654321',
      countryCode: 'BR',
      legalNatureCode: '2062',
      openingDate: '2024-05-10',
      regimeTributario: 'LUCRO_PRESUMIDO',
      defaultCurrency: 'BRL',
      fiscalCalendarId: 'cal_br_default',
      consolidationMode: 'FULL',
      primaryEstablishmentId: 'est_ops_matrix',
      status: GovernanceRecordStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 2,
    ),
    'tenant_ops:cmp_external': const Company(
      companyId: 'cmp_external',
      tenantId: 'tenant_ops',
      legalName: 'Empresa Externa LTDA',
      tradeName: 'Externa',
      legalNameNormalized: 'empresa externa ltda',
      companyRootRegistration: '99887766',
      countryCode: 'BR',
      legalNatureCode: '2062',
      openingDate: '2023-10-01',
      regimeTributario: 'LUCRO_REAL',
      defaultCurrency: 'BRL',
      fiscalCalendarId: 'cal_br_default',
      consolidationMode: 'FULL',
      primaryEstablishmentId: 'est_external_matrix',
      status: GovernanceRecordStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 1,
    ),
  };

  final Map<String, Establishment> _establishments = {
    'tenant_demo:est_demo_matrix': Establishment(
      establishmentId: 'est_demo_matrix',
      tenantId: 'tenant_demo',
      companyId: 'cmp_demo',
      establishmentType: EstablishmentType.matrix,
      isPrincipal: true,
      registrationNumber: '12345678000100',
      registrationRoot: '12345678',
      establishmentOrder: '0001',
      legalNameAtEstablishment: 'Empresa Demo Matriz',
      tradeNameAtEstablishment: 'Demo Matriz',
      cnaePrincipal: '6201500',
      cnaesSecundarios: const ['6202300'],
      address: const Address(
        countryCode: 'BR',
        postalCode: '01310-100',
        stateCode: 'SP',
        cityCode: '3550308',
        cityName: 'Sao Paulo',
        district: 'Bela Vista',
        line1: 'Av. Paulista, 1000',
      ),
      localTaxRegistrations: const [],
      localLicenses: const [],
      contactEmail: 'matriz@demo.eixo.one',
      contactPhone: '5511999999999',
      isAdministrative: true,
      status: GovernanceRecordStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 2,
    ),
    'tenant_demo:est_demo_branch': Establishment(
      establishmentId: 'est_demo_branch',
      tenantId: 'tenant_demo',
      companyId: 'cmp_demo',
      establishmentType: EstablishmentType.branch,
      isPrincipal: false,
      registrationNumber: '12345678000291',
      registrationRoot: '12345678',
      establishmentOrder: '0002',
      legalNameAtEstablishment: 'Empresa Demo Filial',
      tradeNameAtEstablishment: 'Demo Filial',
      cnaePrincipal: '4751201',
      address: const Address(
        countryCode: 'BR',
        postalCode: '20040-001',
        stateCode: 'RJ',
        cityCode: '3304557',
        cityName: 'Rio de Janeiro',
        district: 'Centro',
        line1: 'Rua do Ouvidor, 20',
      ),
      localTaxRegistrations: const [],
      localLicenses: const [],
      contactEmail: 'filial@demo.eixo.one',
      contactPhone: '5521999999999',
      isAdministrative: false,
      status: GovernanceRecordStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 1,
    ),
    'tenant_demo:est_ops_matrix': Establishment(
      establishmentId: 'est_ops_matrix',
      tenantId: 'tenant_demo',
      companyId: 'cmp_ops',
      establishmentType: EstablishmentType.matrix,
      isPrincipal: true,
      registrationNumber: '87654321000155',
      registrationRoot: '87654321',
      establishmentOrder: '0001',
      legalNameAtEstablishment: 'Operacao Piloto Matriz',
      tradeNameAtEstablishment: 'Piloto Matriz',
      cnaePrincipal: '7020400',
      address: const Address(
        countryCode: 'BR',
        postalCode: '30110-012',
        stateCode: 'MG',
        cityCode: '3106200',
        cityName: 'Belo Horizonte',
        district: 'Centro',
        line1: 'Av. Afonso Pena, 200',
      ),
      localTaxRegistrations: const [],
      localLicenses: const [],
      contactEmail: 'ops@eixo.one',
      contactPhone: '5531999999999',
      isAdministrative: true,
      status: GovernanceRecordStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 1,
    ),
    'tenant_ops:est_external_matrix': Establishment(
      establishmentId: 'est_external_matrix',
      tenantId: 'tenant_ops',
      companyId: 'cmp_external',
      establishmentType: EstablishmentType.matrix,
      isPrincipal: true,
      registrationNumber: '99887766000177',
      registrationRoot: '99887766',
      establishmentOrder: '0001',
      legalNameAtEstablishment: 'Empresa Externa Matriz',
      tradeNameAtEstablishment: 'Externa Matriz',
      cnaePrincipal: '6201500',
      address: const Address(
        countryCode: 'BR',
        postalCode: '40020-000',
        stateCode: 'BA',
        cityCode: '2927408',
        cityName: 'Salvador',
        district: 'Comercio',
        line1: 'Av. Estados Unidos, 100',
      ),
      localTaxRegistrations: const [],
      localLicenses: const [],
      contactEmail: 'externa@eixo.one',
      contactPhone: '5571999999999',
      isAdministrative: true,
      status: GovernanceRecordStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 1,
    ),
  };

  final Map<String, UserScopeGrant> _grants = {
    'tenant_demo:user_admin': const UserScopeGrant(
      tenantId: 'tenant_demo',
      userId: 'user_admin',
      companyScopes: [
        UserScopeGrantCompany(companyId: 'cmp_demo', establishmentIds: []),
        UserScopeGrantCompany(companyId: 'cmp_ops', establishmentIds: []),
      ],
      allowedCompanyIds: ['cmp_demo', 'cmp_ops'],
      allowedEstablishmentIds: [
        'est_demo_matrix',
        'est_demo_branch',
        'est_ops_matrix',
      ],
      defaultCompanyId: 'cmp_demo',
      defaultEstablishmentId: 'est_demo_matrix',
      roleKeys: ['platform_admin'],
      permissionOverrides: [],
      readOnlyAllowed: false,
      grantsVersion: 1,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
    ),
    'tenant_demo:user_operator': const UserScopeGrant(
      tenantId: 'tenant_demo',
      userId: 'user_operator',
      companyScopes: [
        UserScopeGrantCompany(
          companyId: 'cmp_demo',
          establishmentIds: ['est_demo_branch'],
        ),
      ],
      allowedCompanyIds: ['cmp_demo'],
      allowedEstablishmentIds: ['est_demo_branch'],
      defaultCompanyId: 'cmp_demo',
      defaultEstablishmentId: 'est_demo_branch',
      roleKeys: ['operator'],
      permissionOverrides: [],
      readOnlyAllowed: false,
      grantsVersion: 1,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
    ),
    'tenant_ops:user_admin': const UserScopeGrant(
      tenantId: 'tenant_ops',
      userId: 'user_admin',
      companyScopes: [
        UserScopeGrantCompany(
          companyId: 'cmp_external',
          establishmentIds: ['est_external_matrix'],
        ),
      ],
      allowedCompanyIds: ['cmp_external'],
      allowedEstablishmentIds: ['est_external_matrix'],
      defaultCompanyId: 'cmp_external',
      defaultEstablishmentId: 'est_external_matrix',
      roleKeys: ['platform_admin'],
      permissionOverrides: [],
      readOnlyAllowed: false,
      grantsVersion: 1,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
    ),
  };

  final Map<String, UserContext> _contexts = {
    'tenant_demo:user_admin': const UserContext(
      tenantId: 'tenant_demo',
      userId: 'user_admin',
      activeCompanyId: 'cmp_demo',
      activeEstablishmentId: 'est_demo_matrix',
      selectedReadCompanyIds: ['cmp_demo', 'cmp_ops'],
      selectedReadEstablishmentIds: ['est_demo_matrix', 'est_ops_matrix'],
      writeEnabled: true,
      lastSwitchedAt: '2026-04-26T18:15:00.000Z',
      contextVersion: 1,
    ),
    'tenant_demo:user_operator': const UserContext(
      tenantId: 'tenant_demo',
      userId: 'user_operator',
      activeCompanyId: 'cmp_demo',
      activeEstablishmentId: 'est_demo_branch',
      selectedReadCompanyIds: ['cmp_demo'],
      selectedReadEstablishmentIds: ['est_demo_branch'],
      writeEnabled: true,
      lastSwitchedAt: '2026-04-26T18:15:00.000Z',
      contextVersion: 1,
    ),
    'tenant_ops:user_admin': const UserContext(
      tenantId: 'tenant_ops',
      userId: 'user_admin',
      activeCompanyId: 'cmp_external',
      activeEstablishmentId: 'est_external_matrix',
      selectedReadCompanyIds: ['cmp_external'],
      selectedReadEstablishmentIds: ['est_external_matrix'],
      writeEnabled: true,
      lastSwitchedAt: '2026-04-26T18:15:00.000Z',
      contextVersion: 1,
    ),
  };

  final Map<String, SharingPolicy> _sharingPolicies = {
    'tenant_demo:shp_catalog': const SharingPolicy(
      policyId: 'shp_catalog',
      tenantId: 'tenant_demo',
      domainKey: 'catalog',
      scopeType: SharingScopeType.company,
      shareMode: ShareMode.singleMaster,
      participantCompanyIds: ['cmp_demo', 'cmp_ops'],
      masterCompanyId: 'cmp_demo',
      policyConfig: <String, dynamic>{'syncPriceLists': false},
      status: SharingPolicyStatus.active,
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 1,
    ),
  };

  final Map<String, ConsolidationRun> _runs = {
    'tenant_demo:crn_demo_001': const ConsolidationRun(
      runId: 'crn_demo_001',
      tenantId: 'tenant_demo',
      participantCompanyIds: ['cmp_demo', 'cmp_ops'],
      participantEstablishmentIds: ['est_demo_matrix', 'est_ops_matrix'],
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
      fiscalCalendarId: 'cal_br_default',
      currencyCode: 'BRL',
      fxPolicy: <String, dynamic>{'type': 'FIXED'},
      percentagePolicy: <String, dynamic>{'type': 'FULL'},
      eliminationMode: 'MANUAL_REVIEW',
      status: ConsolidationRunStatus.completed,
      validationSummary: ConsolidationValidationSummary(
        blockingIssueCount: 0,
        warningCount: 0,
        issues: [],
      ),
      resultSummary: ConsolidationResultSummary(
        participantCompanyCount: 2,
        participantEstablishmentCount: 2,
        includedCompanyIds: ['cmp_demo', 'cmp_ops'],
        totalIssues: 0,
      ),
      requestedBy: 'user_admin',
      idempotencyKey: 'seed-run-001',
      createdAt: '2026-04-26T18:29:00.000Z',
      updatedAt: '2026-04-26T18:31:00.000Z',
      version: 1,
      startedAt: '2026-04-26T18:30:00.000Z',
      completedAt: '2026-04-26T18:31:00.000Z',
    ),
  };

  final List<GovernanceUserSummary> _users = const [
    GovernanceUserSummary(
      id: 'user_admin',
      tenantId: 'tenant_demo',
      email: 'admin@eixo.one',
      displayName: 'Admin EixoOne',
      status: 'active',
      roleKeys: ['platform_admin'],
      permissionKeys: [
        'governance.company.read',
        'governance.company.create',
        'governance.company.update',
        'governance.establishment.read',
        'governance.establishment.create',
        'governance.user_scope.manage',
        'governance.context.switch',
        'governance.consolidation.read',
        'governance.consolidation.run',
        'reporting.consolidated.read',
      ],
      moduleKeys: ['dashboard', 'governance'],
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 3,
      lastLoginAt: '2026-04-26T18:10:00.000Z',
    ),
    GovernanceUserSummary(
      id: 'user_operator',
      tenantId: 'tenant_demo',
      email: 'operador@eixo.one',
      displayName: 'Operador EixoOne',
      status: 'active',
      roleKeys: ['operator'],
      permissionKeys: [
        'governance.company.read',
        'governance.establishment.read',
        'governance.context.switch',
        'reporting.consolidated.read',
      ],
      moduleKeys: ['dashboard', 'governance'],
      createdAt: '2026-04-25T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
      version: 1,
    ),
  ];

  final Random _random = Random();

  String _tenantId(AuthSession session) =>
      session.selectedOrganizationId ?? session.organizations.first.id;

  String _key(String tenantId, String entityId) => '$tenantId:$entityId';

  String _now() => DateTime.now().toUtc().toIso8601String();

  String _generateId(String prefix) {
    final seed = DateTime.now().microsecondsSinceEpoch + _random.nextInt(9999);
    return '${prefix}_$seed';
  }

  Future<void> _simulateDelay() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
  }

  void _ensurePermission(AuthSession session, String permission) {
    if (!session.user.hasPermission(permission)) {
      throw const AppFailure(
        title: 'Acesso negado',
        message:
            'Voce nao possui permissao para executar esta acao neste contexto.',
        code: 'FORBIDDEN',
      );
    }
  }

  UserScopeGrant _grantFor(AuthSession session) {
    final tenantId = _tenantId(session);
    return _grants[_key(tenantId, session.user.id)] ??
        UserScopeGrant(
          tenantId: tenantId,
          userId: session.user.id,
          companyScopes: const [],
          allowedCompanyIds: const [],
          allowedEstablishmentIds: const [],
          roleKeys: const [],
          permissionOverrides: const [],
          readOnlyAllowed: false,
          grantsVersion: 0,
          createdAt: _now(),
          updatedAt: _now(),
        );
  }

  UserContext _defaultContextFor(UserScopeGrant grant) {
    return UserContext(
      tenantId: grant.tenantId,
      userId: grant.userId,
      activeCompanyId: grant.defaultCompanyId,
      activeEstablishmentId: grant.defaultEstablishmentId,
      selectedReadCompanyIds: grant.allowedCompanyIds,
      selectedReadEstablishmentIds: grant.allowedEstablishmentIds,
      writeEnabled: !grant.readOnlyAllowed && grant.defaultCompanyId != null,
      lastSwitchedAt: _now(),
      contextVersion: 1,
    );
  }

  UserContext _contextFor(AuthSession session) {
    final tenantId = _tenantId(session);
    final stored = _contexts[_key(tenantId, session.user.id)];
    return stored ?? _defaultContextFor(_grantFor(session));
  }

  List<Company> _tenantCompanies(String tenantId) {
    return _companies.values
        .where((company) => company.tenantId == tenantId)
        .toList(growable: false);
  }

  List<Establishment> _tenantEstablishments(String tenantId) {
    return _establishments.values
        .where((item) => item.tenantId == tenantId)
        .toList(growable: false);
  }

  List<Company> _accessibleCompanies(AuthSession session) {
    final tenantId = _tenantId(session);
    final grant = _grantFor(session);
    return _tenantCompanies(tenantId)
        .where((company) => grant.allowedCompanyIds.contains(company.companyId))
        .toList(growable: false);
  }

  List<Establishment> _accessibleEstablishments(AuthSession session) {
    final tenantId = _tenantId(session);
    final grant = _grantFor(session);
    return _tenantEstablishments(tenantId)
        .where(
          (item) =>
              grant.allowedEstablishmentIds.contains(item.establishmentId) ||
              grant.companyScopes.any(
                (scope) =>
                    scope.companyId == item.companyId &&
                    (scope.establishmentIds.isEmpty ||
                        scope.establishmentIds.contains(item.establishmentId)),
              ),
        )
        .toList(growable: false);
  }

  GovernanceListResult<T> _paginate<T>(
    List<T> source, {
    required int page,
    required int pageSize,
  }) {
    final start = (page - 1) * pageSize;
    final end = start + pageSize;
    return GovernanceListResult<T>(
      items: source.sublist(
        start.clamp(0, source.length),
        end.clamp(0, source.length),
      ),
      pagination: PaginationInfo(
        page: page,
        pageSize: pageSize,
        totalItems: source.length,
        hasNextPage: end < source.length,
      ),
    );
  }

  void _ensureCompanyVisible(AuthSession session, String companyId) {
    if (!_accessibleCompanies(session).any((item) => item.companyId == companyId)) {
      throw const AppFailure(
        title: 'Empresa indisponivel',
        message: 'Esta empresa nao faz parte do escopo autorizado.',
        code: 'COMPANY_ACCESS_DENIED',
      );
    }
  }

  void _ensureEstablishmentVisible(AuthSession session, String establishmentId) {
    if (!_accessibleEstablishments(session)
        .any((item) => item.establishmentId == establishmentId)) {
      throw const AppFailure(
        title: 'Estabelecimento indisponivel',
        message: 'Este estabelecimento nao faz parte do escopo autorizado.',
        code: 'BRANCH_ACCESS_DENIED',
      );
    }
  }

  @override
  Future<AccessibleScopesSummary> fetchAccessibleScopes(AuthSession session) async {
    await _simulateDelay();
    final grant = _grantFor(session);
    final tenantId = _tenantId(session);
    final context = _contexts[_key(tenantId, session.user.id)];
    final accessibleEstablishments = _accessibleEstablishments(session);
    final companies = _accessibleCompanies(session)
      ..sort((left, right) => left.displayName.compareTo(right.displayName));

    return AccessibleScopesSummary(
      grant: grant,
      context: context ?? _defaultContextFor(grant),
      companies: companies
          .map(
            (company) => AccessibleCompanySummary(
              companyId: company.companyId,
              legalName: company.legalName,
              status: company.status,
              establishments: accessibleEstablishments
                  .where((item) => item.companyId == company.companyId)
                  .map(
                    (item) => AccessibleEstablishmentSummary(
                      establishmentId: item.establishmentId,
                      companyId: item.companyId,
                      legalNameAtEstablishment: item.displayName,
                      establishmentType: item.establishmentType,
                      status: item.status,
                    ),
                  )
                  .toList(growable: false),
            ),
          )
          .toList(growable: false),
    );
  }

  @override
  Future<UserContext> fetchUserContext(AuthSession session) async {
    await _simulateDelay();
    return _contextFor(session);
  }

  @override
  Future<UserContext> switchContext(
    AuthSession session,
    SwitchOperationalContextInput input,
  ) async {
    _ensurePermission(session, 'governance.context.switch');
    await _simulateDelay();

    final grant = _grantFor(session);
    final tenantId = _tenantId(session);
    if (input.writeEnabled && input.activeCompanyId == null) {
      throw const AppFailure(
        title: 'Contexto incompleto',
        message:
            'Selecione uma empresa ativa antes de continuar com contexto de escrita.',
        code: 'CONTEXT_SCOPE_INVALID',
      );
    }

    if (input.activeCompanyId != null &&
        !grant.allowedCompanyIds.contains(input.activeCompanyId)) {
      throw const AppFailure(
        title: 'Escopo invalido',
        message: 'A empresa escolhida nao faz parte do seu grant atual.',
        code: 'CONTEXT_SCOPE_INVALID',
      );
    }

    if (input.activeEstablishmentId != null &&
        !grant.allowedEstablishmentIds.contains(input.activeEstablishmentId)) {
      throw const AppFailure(
        title: 'Escopo invalido',
        message:
            'O estabelecimento escolhido nao faz parte do seu grant atual.',
        code: 'CONTEXT_SCOPE_INVALID',
      );
    }

    for (final companyId in input.selectedReadCompanyIds) {
      if (!grant.allowedCompanyIds.contains(companyId)) {
        throw const AppFailure(
          title: 'Escopo de leitura invalido',
          message:
              'O filtro de leitura nao pode ampliar empresas fora do seu grant.',
          code: 'CONTEXT_SCOPE_INVALID',
        );
      }
    }

    for (final establishmentId in input.selectedReadEstablishmentIds) {
      if (!grant.allowedEstablishmentIds.contains(establishmentId)) {
        throw const AppFailure(
          title: 'Escopo de leitura invalido',
          message:
              'O filtro de leitura nao pode ampliar estabelecimentos fora do seu grant.',
          code: 'CONTEXT_SCOPE_INVALID',
        );
      }
    }

    final nextContext = UserContext(
      tenantId: tenantId,
      userId: session.user.id,
      activeCompanyId: input.writeEnabled ? input.activeCompanyId : null,
      activeEstablishmentId:
          input.writeEnabled ? input.activeEstablishmentId : null,
      selectedReadCompanyIds: input.selectedReadCompanyIds,
      selectedReadEstablishmentIds: input.selectedReadEstablishmentIds,
      writeEnabled: input.writeEnabled,
      lastSwitchedAt: _now(),
      contextVersion: _contextFor(session).contextVersion + 1,
    );

    _contexts[_key(tenantId, session.user.id)] = nextContext;
    return nextContext;
  }

  @override
  Future<GovernanceListResult<Company>> listCompanies(
    AuthSession session,
    CompanyFilters filters,
  ) async {
    _ensurePermission(session, 'governance.company.read');
    await _simulateDelay();

    final items = _accessibleCompanies(session)
        .where((item) {
          if (filters.status != null && item.status != filters.status) {
            return false;
          }
          if (filters.countryCode != null &&
              filters.countryCode!.isNotEmpty &&
              item.countryCode != filters.countryCode!.trim().toUpperCase()) {
            return false;
          }
          if (filters.regimeTributario != null &&
              filters.regimeTributario!.isNotEmpty &&
              item.regimeTributario != filters.regimeTributario!.trim()) {
            return false;
          }
          if (filters.search != null && filters.search!.trim().isNotEmpty) {
            final normalized = filters.search!.trim().toLowerCase();
            return item.displayName.toLowerCase().contains(normalized) ||
                item.companyRootRegistration.contains(normalized.toUpperCase());
          }
          return true;
        })
        .toList(growable: false)
      ..sort((left, right) => left.displayName.compareTo(right.displayName));

    return _paginate(items, page: filters.page, pageSize: filters.pageSize);
  }

  @override
  Future<Company> getCompany(AuthSession session, String companyId) async {
    _ensurePermission(session, 'governance.company.read');
    await _simulateDelay();
    _ensureCompanyVisible(session, companyId);
    final company = _companies[_key(_tenantId(session), companyId)];
    if (company == null) {
      throw const AppFailure(
        title: 'Empresa nao encontrada',
        message: 'Nao foi possivel localizar a empresa solicitada.',
        code: 'NOT_FOUND',
      );
    }
    return company;
  }

  @override
  Future<Company> createCompany(
    AuthSession session,
    CreateCompanyInput input,
  ) async {
    _ensurePermission(session, 'governance.company.create');
    await _simulateDelay();
    final tenantId = _tenantId(session);
    final duplicate = _tenantCompanies(tenantId).any(
      (item) => item.companyRootRegistration == input.companyRootRegistration,
    );
    if (duplicate) {
      throw const AppFailure(
        title: 'Cadastro duplicado',
        message:
            'Ja existe uma empresa com esta raiz cadastral no tenant atual.',
        code: 'DUPLICATE_RECORD',
      );
    }

    final companyId = _generateId('cmp');
    final company = Company(
      companyId: companyId,
      tenantId: tenantId,
      legalName: input.legalName.trim(),
      tradeName: input.tradeName?.trim(),
      legalNameNormalized: input.legalName.trim().toLowerCase(),
      companyRootRegistration: input.companyRootRegistration.trim().toUpperCase(),
      countryCode: input.countryCode.trim().toUpperCase(),
      legalNatureCode: input.legalNatureCode.trim(),
      openingDate: input.openingDate.trim(),
      regimeTributario: input.regimeTributario.trim(),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
      fiscalCalendarId: input.fiscalCalendarId.trim(),
      consolidationMode: input.consolidationMode.trim(),
      primaryEstablishmentId: null,
      groupEconomicId: input.groupEconomicId?.trim(),
      status: GovernanceRecordStatus.draft,
      createdAt: _now(),
      updatedAt: _now(),
      version: 1,
    );
    _companies[_key(tenantId, companyId)] = company;
    return company;
  }

  @override
  Future<Company> updateCompany(
    AuthSession session,
    String companyId,
    UpdateCompanyInput input,
  ) async {
    _ensurePermission(session, 'governance.company.update');
    await _simulateDelay();
    final current = await getCompany(session, companyId);
    if (current.version != input.expectedVersion) {
      throw const AppFailure(
        title: 'Conflito de versao',
        message:
            'Este registro foi alterado por outra pessoa. Recarregue antes de salvar novamente.',
        code: 'VERSION_CONFLICT',
      );
    }

    final updated = Company(
      companyId: current.companyId,
      tenantId: current.tenantId,
      legalName: input.legalName.trim(),
      tradeName: input.tradeName?.trim(),
      legalNameNormalized: input.legalName.trim().toLowerCase(),
      companyRootRegistration: current.companyRootRegistration,
      countryCode: input.countryCode.trim().toUpperCase(),
      legalNatureCode: input.legalNatureCode.trim(),
      openingDate: input.openingDate.trim(),
      regimeTributario: input.regimeTributario.trim(),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
      fiscalCalendarId: input.fiscalCalendarId.trim(),
      consolidationMode: input.consolidationMode.trim(),
      primaryEstablishmentId: current.primaryEstablishmentId,
      groupEconomicId: input.groupEconomicId?.trim(),
      status: current.status,
      createdAt: current.createdAt,
      updatedAt: _now(),
      version: current.version + 1,
    );

    _companies[_key(current.tenantId, current.companyId)] = updated;
    return updated;
  }

  @override
  Future<GovernanceListResult<Establishment>> listEstablishments(
    AuthSession session,
    EstablishmentFilters filters,
  ) async {
    _ensurePermission(session, 'governance.establishment.read');
    await _simulateDelay();
    final items = _accessibleEstablishments(session)
        .where((item) {
          if (filters.companyId != null && item.companyId != filters.companyId) {
            return false;
          }
          if (filters.status != null && item.status != filters.status) {
            return false;
          }
          if (filters.establishmentType != null &&
              item.establishmentType != filters.establishmentType) {
            return false;
          }
          if (filters.search != null && filters.search!.trim().isNotEmpty) {
            final normalized = filters.search!.trim().toLowerCase();
            return item.displayName.toLowerCase().contains(normalized) ||
                item.registrationNumber.contains(normalized.toUpperCase());
          }
          return true;
        })
        .toList(growable: false)
      ..sort((left, right) => left.displayName.compareTo(right.displayName));
    return _paginate(items, page: filters.page, pageSize: filters.pageSize);
  }

  @override
  Future<Establishment> getEstablishment(
    AuthSession session,
    String establishmentId,
  ) async {
    _ensurePermission(session, 'governance.establishment.read');
    await _simulateDelay();
    _ensureEstablishmentVisible(session, establishmentId);
    final establishment = _establishments[_key(_tenantId(session), establishmentId)];
    if (establishment == null) {
      throw const AppFailure(
        title: 'Estabelecimento nao encontrado',
        message: 'Nao foi possivel localizar o estabelecimento solicitado.',
        code: 'NOT_FOUND',
      );
    }
    return establishment;
  }

  @override
  Future<Establishment> createEstablishment(
    AuthSession session,
    CreateEstablishmentInput input,
  ) async {
    _ensurePermission(session, 'governance.establishment.create');
    await _simulateDelay();
    _ensureCompanyVisible(session, input.companyId);
    final company = await getCompany(session, input.companyId);

    if (input.establishmentType == EstablishmentType.branch && input.isPrincipal) {
      throw const AppFailure(
        title: 'Tipo invalido',
        message: 'Filial nao pode ser marcada como matriz principal.',
        code: 'INVALID_ESTABLISHMENT_TYPE',
      );
    }

    if (input.registrationRoot.trim().toUpperCase() !=
        company.companyRootRegistration) {
      throw const AppFailure(
        title: 'Raiz inconsistente',
        message:
            'A raiz do estabelecimento deve pertencer a empresa selecionada.',
        code: 'VALIDATION_ERROR',
      );
    }

    final duplicate = _tenantEstablishments(_tenantId(session)).any(
      (item) => item.registrationNumber == input.registrationNumber,
    );
    if (duplicate) {
      throw const AppFailure(
        title: 'Cadastro duplicado',
        message:
            'Ja existe um estabelecimento com este identificador no tenant atual.',
        code: 'DUPLICATE_RECORD',
      );
    }

    final hasAnotherPrincipalMatrix = _tenantEstablishments(_tenantId(session)).any(
      (item) =>
          item.companyId == input.companyId &&
          item.isPrincipal &&
          item.status == GovernanceRecordStatus.active,
    );
    if (input.establishmentType == EstablishmentType.matrix &&
        input.isPrincipal &&
        hasAnotherPrincipalMatrix) {
      throw const AppFailure(
        title: 'Matriz principal duplicada',
        message: 'A empresa ja possui uma matriz principal ativa.',
        code: 'COMPANY_ALREADY_HAS_PRIMARY_MATRIX',
      );
    }

    final establishmentId = _generateId('est');
    final establishment = Establishment(
      establishmentId: establishmentId,
      tenantId: _tenantId(session),
      companyId: input.companyId,
      establishmentType: input.establishmentType,
      isPrincipal: input.isPrincipal,
      registrationNumber: input.registrationNumber.trim().toUpperCase(),
      registrationRoot: input.registrationRoot.trim().toUpperCase(),
      establishmentOrder: input.establishmentOrder.trim(),
      legalNameAtEstablishment: input.legalNameAtEstablishment.trim(),
      tradeNameAtEstablishment: input.tradeNameAtEstablishment?.trim(),
      cnaePrincipal: input.cnaePrincipal.trim(),
      cnaesSecundarios: input.cnaesSecundarios,
      address: input.address,
      localTaxRegistrations: input.localTaxRegistrations,
      localLicenses: input.localLicenses,
      contactEmail: input.contactEmail?.trim(),
      contactPhone: input.contactPhone?.trim(),
      isAdministrative: input.isAdministrative,
      status: GovernanceRecordStatus.active,
      createdAt: _now(),
      updatedAt: _now(),
      version: 1,
    );
    _establishments[_key(establishment.tenantId, establishmentId)] = establishment;

    if (establishment.isPrincipal) {
      final currentCompany = _companies[_key(company.tenantId, company.companyId)]!;
      _companies[_key(company.tenantId, company.companyId)] = Company(
        companyId: currentCompany.companyId,
        tenantId: currentCompany.tenantId,
        legalName: currentCompany.legalName,
        tradeName: currentCompany.tradeName,
        legalNameNormalized: currentCompany.legalNameNormalized,
        companyRootRegistration: currentCompany.companyRootRegistration,
        countryCode: currentCompany.countryCode,
        legalNatureCode: currentCompany.legalNatureCode,
        openingDate: currentCompany.openingDate,
        regimeTributario: currentCompany.regimeTributario,
        defaultCurrency: currentCompany.defaultCurrency,
        fiscalCalendarId: currentCompany.fiscalCalendarId,
        consolidationMode: currentCompany.consolidationMode,
        primaryEstablishmentId: establishment.establishmentId,
        groupEconomicId: currentCompany.groupEconomicId,
        status: currentCompany.status,
        createdAt: currentCompany.createdAt,
        updatedAt: _now(),
        version: currentCompany.version + 1,
      );
    }

    return establishment;
  }

  @override
  Future<Establishment> updateEstablishment(
    AuthSession session,
    String establishmentId,
    UpdateEstablishmentInput input,
  ) async {
    _ensurePermission(session, 'governance.establishment.update');
    await _simulateDelay();
    final current = await getEstablishment(session, establishmentId);
    if (current.version != input.expectedVersion) {
      throw const AppFailure(
        title: 'Conflito de versao',
        message:
            'Este registro foi alterado por outra pessoa. Recarregue antes de salvar novamente.',
        code: 'VERSION_CONFLICT',
      );
    }

    if (input.establishmentType == EstablishmentType.branch && input.isPrincipal) {
      throw const AppFailure(
        title: 'Tipo invalido',
        message: 'Filial nao pode ser marcada como matriz principal.',
        code: 'INVALID_ESTABLISHMENT_TYPE',
      );
    }

    final updated = Establishment(
      establishmentId: current.establishmentId,
      tenantId: current.tenantId,
      companyId: current.companyId,
      establishmentType: input.establishmentType,
      isPrincipal: input.isPrincipal,
      registrationNumber: input.registrationNumber.trim().toUpperCase(),
      registrationRoot: input.registrationRoot.trim().toUpperCase(),
      establishmentOrder: input.establishmentOrder.trim(),
      legalNameAtEstablishment: input.legalNameAtEstablishment.trim(),
      tradeNameAtEstablishment: input.tradeNameAtEstablishment?.trim(),
      cnaePrincipal: input.cnaePrincipal.trim(),
      cnaesSecundarios: input.cnaesSecundarios,
      address: input.address,
      localTaxRegistrations: input.localTaxRegistrations,
      localLicenses: input.localLicenses,
      contactEmail: input.contactEmail?.trim(),
      contactPhone: input.contactPhone?.trim(),
      isAdministrative: input.isAdministrative,
      status: current.status,
      createdAt: current.createdAt,
      updatedAt: _now(),
      version: current.version + 1,
    );
    _establishments[_key(current.tenantId, current.establishmentId)] = updated;
    return updated;
  }

  @override
  Future<GovernanceListResult<GovernanceUserSummary>> listUsers(
    AuthSession session,
    GovernanceUserFilters filters,
  ) async {
    _ensurePermission(session, 'governance.user_scope.manage');
    await _simulateDelay();
    final tenantId = _tenantId(session);
    final normalizedSearch = filters.search?.trim().toLowerCase();
    final items = _users
        .where((item) => item.tenantId == tenantId)
        .where((item) {
          if (filters.status != null && filters.status!.isNotEmpty) {
            return item.status == filters.status;
          }
          return true;
        })
        .where((item) {
          if (normalizedSearch == null || normalizedSearch.isEmpty) {
            return true;
          }
          return item.displayName.toLowerCase().contains(normalizedSearch) ||
              item.email.toLowerCase().contains(normalizedSearch);
        })
        .toList(growable: false);

    return _paginate(items, page: filters.page, pageSize: filters.pageSize);
  }

  @override
  Future<UserScopeGrant> getUserScopeGrant(
    AuthSession session,
    String userId,
  ) async {
    _ensurePermission(session, 'governance.user_scope.manage');
    await _simulateDelay();
    final grant = _grants[_key(_tenantId(session), userId)];
    if (grant == null) {
      throw const AppFailure(
        title: 'Grant nao encontrado',
        message: 'Nao foi possivel localizar o grant do usuario selecionado.',
        code: 'NOT_FOUND',
      );
    }
    return grant;
  }

  @override
  Future<UserScopeGrant> upsertUserScopeGrant(
    AuthSession session,
    String userId,
    UpsertUserScopeGrantInput input,
  ) async {
    _ensurePermission(session, 'governance.user_scope.manage');
    await _simulateDelay();
    final tenantId = _tenantId(session);
    final tenantCompanies = _tenantCompanies(tenantId);
    final tenantEstablishments = _tenantEstablishments(tenantId);

    for (final scope in input.companies) {
      final companyExists = tenantCompanies.any(
        (company) => company.companyId == scope.companyId,
      );
      if (!companyExists) {
        throw const AppFailure(
          title: 'Empresa invalida',
          message: 'Um dos escopos informados nao existe neste tenant.',
          code: 'NOT_FOUND',
        );
      }

      for (final establishmentId in scope.establishmentIds) {
        final belongsToCompany = tenantEstablishments.any(
          (item) =>
              item.establishmentId == establishmentId &&
              item.companyId == scope.companyId,
        );
        if (!belongsToCompany) {
          throw const AppFailure(
            title: 'Grant inconsistente',
            message:
                'O estabelecimento selecionado nao pertence a empresa concedida.',
            code: 'GRANT_SCOPE_INCONSISTENT',
          );
        }
      }
    }

    final nextGrant = UserScopeGrant(
      tenantId: tenantId,
      userId: userId,
      companyScopes: input.companies,
      allowedCompanyIds: input.companies.map((item) => item.companyId).toList(),
      allowedEstablishmentIds: input.companies
          .expand((item) => item.establishmentIds)
          .toSet()
          .toList(growable: false),
      defaultCompanyId: input.defaultCompanyId,
      defaultEstablishmentId: input.defaultEstablishmentId,
      roleKeys: input.roleKeys,
      permissionOverrides: input.permissionOverrides,
      readOnlyAllowed: input.readOnlyAllowed,
      grantsVersion:
          (_grants[_key(tenantId, userId)]?.grantsVersion ?? 0) + 1,
      createdAt: _grants[_key(tenantId, userId)]?.createdAt ?? _now(),
      updatedAt: _now(),
    );

    _grants[_key(tenantId, userId)] = nextGrant;
    return nextGrant;
  }

  @override
  Future<ConsolidatedOverview> getConsolidatedOverview(AuthSession session) async {
    _ensurePermission(session, 'reporting.consolidated.read');
    await _simulateDelay();
    final context = _contextFor(session);
    final visibleCompanies = _accessibleCompanies(session);
    final visibleEstablishments = _accessibleEstablishments(session);
    final readCompanyIds = context.selectedReadCompanyIds.isNotEmpty
        ? context.selectedReadCompanyIds
        : visibleCompanies.map((item) => item.companyId).toList(growable: false);
    final readEstablishmentIds = context.selectedReadEstablishmentIds.isNotEmpty
        ? context.selectedReadEstablishmentIds
        : visibleEstablishments
            .where((item) => readCompanyIds.contains(item.companyId))
            .map((item) => item.establishmentId)
            .toList(growable: false);
    final matchingRuns = _runs.values
        .where((run) => run.tenantId == _tenantId(session))
        .where(
          (run) => run.participantCompanyIds.every(readCompanyIds.contains),
        )
        .toList(growable: false)
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));

    return ConsolidatedOverview(
      writeContextCompanyId: context.activeCompanyId,
      writeContextEstablishmentId: context.activeEstablishmentId,
      selectedReadCompanyIds: readCompanyIds,
      selectedReadEstablishmentIds: readEstablishmentIds,
      activeCompanyCount: visibleCompanies
          .where((item) => item.status == GovernanceRecordStatus.active)
          .length,
      activeEstablishmentCount: visibleEstablishments
          .where((item) => item.status == GovernanceRecordStatus.active)
          .length,
      latestRunStatus: matchingRuns.isEmpty ? null : matchingRuns.first.status,
      companyStatuses: visibleCompanies
          .map(
            (item) => CompanyStatusSummary(
              companyId: item.companyId,
              status: item.status,
            ),
          )
          .toList(growable: false),
    );
  }

  @override
  Future<GovernanceListResult<ConsolidationRun>> listConsolidationRuns(
    AuthSession session,
    ConsolidationRunFilters filters,
  ) async {
    _ensurePermission(session, 'governance.consolidation.read');
    await _simulateDelay();
    final allowedCompanyIds =
        _accessibleCompanies(session).map((item) => item.companyId).toSet();
    final items = _runs.values
        .where((item) => item.tenantId == _tenantId(session))
        .where((item) => item.participantCompanyIds.every(allowedCompanyIds.contains))
        .where((item) {
          if (filters.status != null && item.status != filters.status) {
            return false;
          }
          if (filters.requestedBy != null &&
              filters.requestedBy!.isNotEmpty &&
              item.requestedBy != filters.requestedBy) {
            return false;
          }
          return true;
        })
        .toList(growable: false)
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));
    return _paginate(items, page: filters.page, pageSize: filters.pageSize);
  }

  @override
  Future<ConsolidationRun> createConsolidationRun(
    AuthSession session,
    CreateConsolidationRunInput input,
  ) async {
    _ensurePermission(session, 'governance.consolidation.run');
    await _simulateDelay();
    final allowedCompanyIds =
        _accessibleCompanies(session).map((item) => item.companyId).toSet();
    final tenantCompanies = _tenantCompanies(_tenantId(session));

    for (final companyId in input.participantCompanyIds) {
      if (!allowedCompanyIds.contains(companyId)) {
        throw const AppFailure(
          title: 'Escopo de consolidacao invalido',
          message: 'A consolidacao inclui empresa fora do escopo autorizado.',
          code: 'FORBIDDEN',
        );
      }
    }

    final issues = <ConsolidationIssue>[];
    for (final company in tenantCompanies.where(
      (item) => input.participantCompanyIds.contains(item.companyId),
    )) {
      if (company.status != GovernanceRecordStatus.active) {
        issues.add(
          ConsolidationIssue(
            code: 'COMPANY_INACTIVE',
            message: 'A empresa ${company.displayName} precisa estar ativa.',
            blocking: true,
            companyId: company.companyId,
          ),
        );
      }
      if (company.fiscalCalendarId != input.fiscalCalendarId) {
        issues.add(
          ConsolidationIssue(
            code: 'CALENDAR_MISMATCH',
            message:
                'A empresa ${company.displayName} usa calendario fiscal diferente do informado.',
            blocking: true,
            companyId: company.companyId,
          ),
        );
      }
      if (company.consolidationMode != 'FULL') {
        issues.add(
          ConsolidationIssue(
            code: 'CONSOLIDATION_MODE_INVALID',
            message:
                'A empresa ${company.displayName} nao esta elegivel para consolidacao FULL.',
            blocking: true,
            companyId: company.companyId,
          ),
        );
      }
    }

    final run = ConsolidationRun(
      runId: _generateId('crn'),
      tenantId: _tenantId(session),
      participantCompanyIds: input.participantCompanyIds,
      participantEstablishmentIds: input.participantEstablishmentIds,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      fiscalCalendarId: input.fiscalCalendarId,
      currencyCode: input.currencyCode,
      fxPolicy: input.fxPolicy,
      percentagePolicy: input.percentagePolicy,
      eliminationMode: input.eliminationMode,
      status: issues.any((item) => item.blocking)
          ? ConsolidationRunStatus.blocked
          : ConsolidationRunStatus.queued,
      validationSummary: ConsolidationValidationSummary(
        blockingIssueCount: issues.where((item) => item.blocking).length,
        warningCount: issues.where((item) => !item.blocking).length,
        issues: issues,
      ),
      resultSummary: issues.any((item) => item.blocking)
          ? null
          : ConsolidationResultSummary(
              participantCompanyCount: input.participantCompanyIds.length,
              participantEstablishmentCount:
                  input.participantEstablishmentIds.length,
              includedCompanyIds: input.participantCompanyIds,
              totalIssues: issues.length,
            ),
      requestedBy: session.user.id,
      idempotencyKey: _generateId('idem'),
      createdAt: _now(),
      updatedAt: _now(),
      version: 1,
    );
    _runs[_key(run.tenantId, run.runId)] = run;
    return run;
  }

  @override
  Future<GovernanceListResult<SharingPolicy>> listSharingPolicies(
    AuthSession session,
  ) async {
    _ensurePermission(session, 'governance.sharing.policy.manage');
    await _simulateDelay();
    final items = _sharingPolicies.values
        .where((item) => item.tenantId == _tenantId(session))
        .toList(growable: false)
      ..sort((left, right) => left.domainKey.compareTo(right.domainKey));
    return GovernanceListResult(
      items: items,
      pagination: PaginationInfo(
        page: 1,
        pageSize: items.length,
        totalItems: items.length,
        hasNextPage: false,
      ),
    );
  }
}
