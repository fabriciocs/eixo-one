import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../core/config/app_config.dart';
import '../../../core/errors/app_failure.dart';
import '../../../shared/models/auth_session.dart';
import '../../governance/domain/models/governance_models.dart'
    show GovernanceRecordStatus, PaginationInfo;
import '../domain/base_governance_permissions.dart';
import '../models/base_governance_models.dart';

abstract class BaseGovernanceRepository {
  Future<BaseGovernanceListResult<BaseGovernanceRole>> listRoles(
    AuthSession session, {
    String? search,
    GovernanceRecordStatus? status,
    int page = 1,
    int pageSize = 50,
  });

  Future<BaseGovernanceRole> createRole(
    AuthSession session,
    CreateBaseGovernanceRoleInput input,
  );

  Future<BaseGovernanceRole> updateRole(
    AuthSession session,
    String roleId,
    UpdateBaseGovernanceRoleInput input,
  );

  Future<List<PermissionCatalogEntry>> listPermissionCatalog(
    AuthSession session,
  );

  Future<BaseGovernanceListResult<BaseGovernanceSetting>> listSettings(
    AuthSession session, {
    String? search,
    String? moduleKey,
    SettingScopeType? scopeType,
    bool? sensitive,
    GovernanceRecordStatus? status,
    int page = 1,
    int pageSize = 50,
  });

  Future<BaseGovernanceSetting> updateSetting(
    AuthSession session,
    String settingKey,
    UpdateBaseGovernanceSettingInput input,
  );

  Future<BaseGovernanceSetting> resetSetting(
    AuthSession session,
    String settingKey,
    ResetBaseGovernanceSettingInput input,
  );

  Future<BaseGovernanceListResult<BaseGovernanceAuditEvent>> listAuditEvents(
    AuthSession session, {
    String? entityType,
    String? entityId,
    int page = 1,
    int pageSize = 50,
  });

  Future<BaseGovernanceListResult<DataJob>> listDataJobs(
    AuthSession session, {
    String? search,
    DataJobEntity? entity,
    DataJobType? type,
    DataJobStatus? status,
    int page = 1,
    int pageSize = 50,
  });

  Future<DataJob> createImportJob(
    AuthSession session,
    CreateImportJobInput input,
  );

  Future<DataJob> runImportJob(
    AuthSession session,
    String jobId,
  );

  Future<DataJob> createExportJob(
    AuthSession session,
    CreateExportJobInput input,
  );
}

final baseGovernanceRepositoryProvider = Provider<BaseGovernanceRepository>((
  ref,
) {
  final useApi =
      AppConfig.useGovernanceApi &&
      Firebase.apps.isNotEmpty &&
      FirebaseAuth.instance.currentUser != null;

  if (useApi) {
    return ApiBaseGovernanceRepository();
  }

  return InMemoryBaseGovernanceRepository();
});

class ApiBaseGovernanceRepository implements BaseGovernanceRepository {
  ApiBaseGovernanceRepository({http.Client? client, FirebaseAuth? auth})
    : _client = client ?? http.Client(),
      _auth = auth ?? FirebaseAuth.instance;

  final http.Client _client;
  final FirebaseAuth _auth;

  Future<Map<String, String>> _headers() async {
    final user = _auth.currentUser;
    if (user == null) {
      throw const AppFailure(
        title: 'Sessao sem integracao de API',
        message:
            'A API de perfis exige autenticacao Firebase ativa neste ambiente.',
        code: 'UNAUTHENTICATED',
      );
    }

    final token = await user.getIdToken();
    return <String, String>{
      'authorization': 'Bearer $token',
      'content-type': 'application/json',
      'accept': 'application/json',
      'x-correlation-id': DateTime.now().microsecondsSinceEpoch.toString(),
    };
  }

  Uri _uri(String path, [Map<String, String>? queryParameters]) {
    final baseUri = Uri.parse(AppConfig.apiBaseUrl);
    return baseUri.replace(
      path: '${baseUri.path}$path',
      queryParameters: queryParameters == null || queryParameters.isEmpty
          ? null
          : queryParameters,
    );
  }

  Future<JsonMap> _send({
    required String method,
    required String path,
    Map<String, String>? queryParameters,
    JsonMap? body,
  }) async {
    try {
      final headers = await _headers();
      final uri = _uri(path, queryParameters);
      late final http.Response response;

      switch (method) {
        case 'GET':
          response = await _client
              .get(uri, headers: headers)
              .timeout(Duration(seconds: AppConfig.apiTimeoutSeconds));
          break;
        case 'PUT':
          response = await _client
              .put(uri, headers: headers, body: jsonEncode(body ?? const {}))
              .timeout(Duration(seconds: AppConfig.apiTimeoutSeconds));
          break;
        case 'POST':
          response = await _client
              .post(uri, headers: headers, body: jsonEncode(body ?? const {}))
              .timeout(Duration(seconds: AppConfig.apiTimeoutSeconds));
          break;
        case 'PATCH':
          response = await _client
              .patch(uri, headers: headers, body: jsonEncode(body ?? const {}))
              .timeout(Duration(seconds: AppConfig.apiTimeoutSeconds));
          break;
        default:
          throw UnsupportedError('Metodo $method nao suportado.');
      }

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          decoded['ok'] == true) {
        return decoded;
      }

      final error = decoded['error'] as Map<String, dynamic>? ?? const {};
      throw _mapApiFailure(
        code: error['code']?.toString() ?? 'INTERNAL_ERROR',
        message:
            error['message']?.toString() ??
            'A API de perfis e permissoes retornou uma falha.',
      );
    } on TimeoutException {
      throw const AppFailure(
        title: 'Tempo de resposta excedido',
        message:
            'A API demorou mais do que o esperado. Tente novamente em instantes.',
        retryable: true,
        code: 'TIMEOUT',
      );
    } on FormatException {
      throw const AppFailure(
        title: 'Resposta invalida',
        message:
            'A API respondeu em um formato inesperado. Revise o ambiente ou tente novamente.',
        retryable: true,
        code: 'INTERNAL_ERROR',
      );
    } on AppFailure {
      rethrow;
    } catch (_) {
      throw const AppFailure(
        title: 'Falha de comunicacao',
        message:
            'Nao foi possivel concluir a operacao com a API agora. Verifique a rede e tente novamente.',
        retryable: true,
        code: 'DEPENDENCY_UNAVAILABLE',
      );
    }
  }

  AppFailure _mapApiFailure({required String code, required String message}) {
    switch (code) {
      case 'UNAUTHENTICATED':
        return const AppFailure(
          title: 'Sessao expirada',
          message: 'Sua sessao expirou. Entre novamente para continuar.',
          code: 'UNAUTHENTICATED',
        );
      case 'FORBIDDEN':
        return AppFailure(title: 'Acesso negado', message: message, code: code);
      case 'VALIDATION_ERROR':
        return AppFailure(
          title: 'Revise os dados informados',
          message: message,
          code: code,
        );
      case 'VERSION_CONFLICT':
        return const AppFailure(
          title: 'Conflito de versao',
          message:
              'Este registro foi alterado por outra pessoa. Recarregue os dados antes de salvar novamente.',
          code: 'VERSION_CONFLICT',
        );
      case 'DUPLICATE_RECORD':
        return AppFailure(
          title: 'Operacao bloqueada',
          message: message,
          code: code,
        );
      case 'NOT_FOUND':
        return AppFailure(
          title: 'Registro nao encontrado',
          message: message,
          code: code,
        );
      default:
        return AppFailure(
          title: 'Falha na API',
          message: message,
          retryable: true,
          code: code,
        );
    }
  }

  BaseGovernanceListResult<T> _parseListResult<T>(
    JsonMap envelope,
    T Function(JsonMap json) parser,
  ) {
    final data = envelope['data'] as Map<String, dynamic>? ?? const {};
    final meta = envelope['meta'] as Map<String, dynamic>? ?? const {};
    final items = (data['items'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => parser(item.cast<String, dynamic>()))
        .toList(growable: false);

    return BaseGovernanceListResult<T>(
      items: items,
      pagination: PaginationInfo.fromJson(
        (meta['pagination'] as Map<String, dynamic>? ?? const {}),
      ),
    );
  }

  @override
  Future<BaseGovernanceListResult<BaseGovernanceRole>> listRoles(
    AuthSession session, {
    String? search,
    GovernanceRecordStatus? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/roles',
      queryParameters: <String, String>{
        'page': '$page',
        'pageSize': '$pageSize',
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
        if (status != null) 'status': status.wireName,
      },
    );
    return _parseListResult(envelope, BaseGovernanceRole.fromJson);
  }

  @override
  Future<BaseGovernanceRole> createRole(
    AuthSession session,
    CreateBaseGovernanceRoleInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/roles',
      body: input.toJson(),
    );
    return BaseGovernanceRole.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<BaseGovernanceRole> updateRole(
    AuthSession session,
    String roleId,
    UpdateBaseGovernanceRoleInput input,
  ) async {
    final envelope = await _send(
      method: 'PATCH',
      path: '/v1/governance/roles/$roleId',
      body: input.toJson(),
    );
    return BaseGovernanceRole.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<List<PermissionCatalogEntry>> listPermissionCatalog(
    AuthSession session,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/permissions/catalog',
    );
    final data = envelope['data'] as Map<String, dynamic>? ?? const {};
    return readPermissionCatalogList(data['items']);
  }

  @override
  Future<BaseGovernanceListResult<BaseGovernanceSetting>> listSettings(
    AuthSession session, {
    String? search,
    String? moduleKey,
    SettingScopeType? scopeType,
    bool? sensitive,
    GovernanceRecordStatus? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/settings',
      queryParameters: <String, String>{
        'page': '$page',
        'pageSize': '$pageSize',
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
        if (moduleKey != null && moduleKey.trim().isNotEmpty)
          'moduleKey': moduleKey.trim(),
        if (scopeType != null) 'scopeType': scopeType.wireName,
        if (sensitive != null) 'sensitive': '$sensitive',
        if (status != null) 'status': status.wireName,
      },
    );
    return _parseListResult(envelope, BaseGovernanceSetting.fromJson);
  }

  @override
  Future<BaseGovernanceSetting> updateSetting(
    AuthSession session,
    String settingKey,
    UpdateBaseGovernanceSettingInput input,
  ) async {
    final envelope = await _send(
      method: 'PUT',
      path: '/v1/governance/settings/$settingKey',
      body: input.toJson(),
    );
    return BaseGovernanceSetting.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<BaseGovernanceSetting> resetSetting(
    AuthSession session,
    String settingKey,
    ResetBaseGovernanceSettingInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/settings/$settingKey/reset',
      body: input.toJson(),
    );
    return BaseGovernanceSetting.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<BaseGovernanceListResult<BaseGovernanceAuditEvent>> listAuditEvents(
    AuthSession session, {
    String? entityType,
    String? entityId,
    int page = 1,
    int pageSize = 50,
  }) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/audit-events',
      queryParameters: <String, String>{
        'page': '$page',
        'pageSize': '$pageSize',
        if (entityType != null && entityType.trim().isNotEmpty)
          'entityType': entityType.trim(),
        if (entityId != null && entityId.trim().isNotEmpty)
          'entityId': entityId.trim(),
      },
    );
    return _parseListResult(envelope, BaseGovernanceAuditEvent.fromJson);
  }

  @override
  Future<BaseGovernanceListResult<DataJob>> listDataJobs(
    AuthSession session, {
    String? search,
    DataJobEntity? entity,
    DataJobType? type,
    DataJobStatus? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/data-jobs',
      queryParameters: <String, String>{
        'page': '$page',
        'pageSize': '$pageSize',
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
        if (entity != null) 'entity': entity.wireName,
        if (type != null) 'type': type.wireName,
        if (status != null) 'status': status.wireName,
      },
    );
    return _parseListResult(envelope, DataJob.fromJson);
  }

  @override
  Future<DataJob> createImportJob(
    AuthSession session,
    CreateImportJobInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/imports',
      body: input.toJson(),
    );
    return DataJob.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<DataJob> runImportJob(
    AuthSession session,
    String jobId,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/imports/$jobId/run',
      body: const {},
    );
    return DataJob.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<DataJob> createExportJob(
    AuthSession session,
    CreateExportJobInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/exports',
      body: input.toJson(),
    );
    return DataJob.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }
}

class InMemoryBaseGovernanceRepository implements BaseGovernanceRepository {
  InMemoryBaseGovernanceRepository()
    : _roles = _seedRoles(),
      _auditEvents = _seedAuditEvents(),
      _dataJobs = _seedDataJobs();

  final Random _random = Random();
  final List<BaseGovernanceRole> _roles;
  final List<BaseGovernanceSetting> _settings = _seedSettings();
  final List<BaseGovernanceAuditEvent> _auditEvents;
  final List<DataJob> _dataJobs;
  final Map<String, List<String>> _roleKeysByUserId = <String, List<String>>{
    'user_admin': const ['platform_admin'],
    'user_operator': const ['operator'],
    'user_external': const ['supervisor'],
  };
  final Map<String, List<String>> _permissionOverridesByUserId =
      const <String, List<String>>{};

  static List<BaseGovernanceRole> _seedRoles() {
    final allPermissionKeys = _permissionCatalog
        .map((permission) => permission.key)
        .toList(growable: false);

    return <BaseGovernanceRole>[
      BaseGovernanceRole(
        roleId: 'role_platform_admin',
        tenantId: 'tenant_demo',
        key: 'platform_admin',
        name: 'Administrador da plataforma',
        description:
            'Controla modulos, grants, auditoria e operacoes administrativas do tenant.',
        permissionKeys: allPermissionKeys,
        companyIds: const ['cmp_demo', 'cmp_ops'],
        establishmentIds: const [
          'est_demo_matrix',
          'est_demo_branch',
          'est_ops_matrix',
        ],
        costCenterIds: const [],
        status: GovernanceRecordStatus.active,
        version: 2,
        createdAt: '2026-04-26T18:00:00.000Z',
        createdBy: 'user_admin',
        updatedAt: '2026-04-26T18:20:00.000Z',
        updatedBy: 'user_admin',
      ),
      BaseGovernanceRole(
        roleId: 'role_operator',
        tenantId: 'tenant_demo',
        key: 'operator',
        name: 'Operador',
        description:
            'Executa consultas operacionais, alterna contexto e acompanha consolidado.',
        permissionKeys: const [
          'governance.company.read',
          'governance.establishment.read',
          'governance.context.switch',
          'reporting.consolidated.read',
        ],
        companyIds: const ['cmp_demo'],
        establishmentIds: const ['est_demo_branch'],
        costCenterIds: const [],
        status: GovernanceRecordStatus.active,
        version: 1,
        createdAt: '2026-04-26T18:00:00.000Z',
        createdBy: 'user_admin',
      ),
      BaseGovernanceRole(
        roleId: 'role_supervisor',
        tenantId: 'tenant_demo',
        key: 'supervisor',
        name: 'Supervisor',
        description:
            'Revisa cadastros, le auditoria e acompanha grants de operacao.',
        permissionKeys: const [
          'users.read',
          'roles.read',
          'audit.read',
          'governance.company.read',
          'governance.establishment.read',
          'governance.context.switch',
          'reporting.consolidated.read',
        ],
        companyIds: const ['cmp_demo', 'cmp_ops'],
        establishmentIds: const ['est_demo_matrix', 'est_ops_matrix'],
        costCenterIds: const [],
        status: GovernanceRecordStatus.active,
        version: 1,
        createdAt: '2026-04-26T18:05:00.000Z',
        createdBy: 'user_admin',
      ),
    ];
  }

  static List<BaseGovernanceAuditEvent> _seedAuditEvents() {
    return const <BaseGovernanceAuditEvent>[
      BaseGovernanceAuditEvent(
        contractVersion: 'v1',
        tenantId: 'tenant_demo',
        actorUserId: 'user_admin',
        entityType: 'role',
        entityId: 'role_platform_admin',
        action: 'role.created',
        severity: 'info',
        correlationId: 'corr-seed-role-platform-admin',
        requestId: 'req-seed-role-platform-admin',
        metadata: <String, dynamic>{'source': 'seed'},
        createdAt: '2026-04-26T18:00:00.000Z',
        after: <String, dynamic>{'key': 'platform_admin', 'status': 'active'},
      ),
      BaseGovernanceAuditEvent(
        contractVersion: 'v1',
        tenantId: 'tenant_demo',
        actorUserId: 'user_admin',
        entityType: 'user_scope_grant',
        entityId: 'user_operator',
        action: 'grant.updated',
        severity: 'info',
        correlationId: 'corr-seed-grant-operator',
        requestId: 'req-seed-grant-operator',
        metadata: <String, dynamic>{'source': 'seed'},
        createdAt: '2026-04-26T18:18:00.000Z',
        after: <String, dynamic>{
          'roleKeys': ['operator'],
          'defaultCompanyId': 'cmp_demo',
        },
      ),
    ];
  }

  String _tenantId(AuthSession session) {
    return session.selectedOrganizationId ?? session.organizations.first.id;
  }

  List<String> _normalizeStringList(Iterable<String> values) {
    final items = values
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toSet()
        .toList(growable: false);
    items.sort();
    return items;
  }

  BaseGovernanceRole _requireRole(String tenantId, String roleId) {
    final role = _roles.cast<BaseGovernanceRole?>().firstWhere(
      (item) => item?.tenantId == tenantId && item?.roleId == roleId,
      orElse: () => null,
    );

    if (role == null) {
      throw const AppFailure(
        title: 'Registro nao encontrado',
        message: 'Perfil nao encontrado.',
        code: 'NOT_FOUND',
      );
    }

    return role;
  }

  void _validatePermissionKeys(List<String> permissionKeys) {
    final knownKeys = _permissionCatalog.map((item) => item.key).toSet();
    final unknown = permissionKeys
        .where((permissionKey) => !knownKeys.contains(permissionKey))
        .toList(growable: false);

    if (unknown.isNotEmpty) {
      throw AppFailure(
        title: 'Revise os dados informados',
        message:
            'Existem permissoes desconhecidas neste perfil: ${unknown.join(', ')}.',
        code: 'VALIDATION_ERROR',
      );
    }
  }

  void _ensureUniqueRoleKey(
    String tenantId,
    String key, {
    String? ignoreRoleId,
  }) {
    final normalizedKey = key.trim().toLowerCase();
    final duplicated = _roles.any(
      (role) =>
          role.tenantId == tenantId &&
          role.key.toLowerCase() == normalizedKey &&
          role.roleId != ignoreRoleId,
    );

    if (duplicated) {
      throw const AppFailure(
        title: 'Operacao bloqueada',
        message: 'Ja existe um perfil com esta chave neste tenant.',
        code: 'DUPLICATE_RECORD',
      );
    }
  }

  BaseGovernanceAuditEvent _buildAuditEvent({
    required String tenantId,
    required String actorUserId,
    required String entityType,
    required String entityId,
    required String action,
    JsonMap? before,
    JsonMap? after,
  }) {
    final stamp = DateTime.now().microsecondsSinceEpoch;
    final suffix = _random.nextInt(999999).toString().padLeft(6, '0');

    return BaseGovernanceAuditEvent(
      contractVersion: 'v1',
      tenantId: tenantId,
      actorUserId: actorUserId,
      entityType: entityType,
      entityId: entityId,
      action: action,
      severity: 'info',
      correlationId: 'corr-$stamp-$suffix',
      requestId: 'req-$stamp-$suffix',
      before: before,
      after: after,
      metadata: const <String, dynamic>{'source': 'in_memory'},
      createdAt: DateTime.now().toUtc().toIso8601String(),
    );
  }

  Set<String> _effectivePermissionKeys(AuthSession session) {
    final effective = <String>{...session.user.permissionKeys};
    final roleKeys = _roleKeysByUserId[session.user.id] ?? const <String>[];

    for (final roleKey in roleKeys) {
      final role = _roles.firstWhereOrNull(
        (item) => item.key == roleKey && item.isActive,
      );
      if (role == null) {
        continue;
      }
      effective.addAll(role.permissionKeys);
    }

    effective.addAll(
      _permissionOverridesByUserId[session.user.id] ?? const <String>[],
    );
    return effective;
  }

  String _jobId() {
    final stamp = DateTime.now().microsecondsSinceEpoch;
    final suffix = _random.nextInt(999999).toString().padLeft(6, '0');
    return 'job_$stamp$suffix';
  }

  void _requirePermission(AuthSession session, String permissionKey) {
    if (_effectivePermissionKeys(session).contains(permissionKey)) {
      return;
    }

    throw AppFailure(
      title: 'Acesso negado',
      message:
          'Sua sessao atual nao pode executar a permissao $permissionKey neste ambiente.',
      code: 'FORBIDDEN',
    );
  }

  BaseGovernanceSetting _requireSetting(
    String tenantId,
    String settingKey,
    SettingScopeType scopeType, {
    String? companyId,
    String? establishmentId,
  }) {
    final setting = _settings.cast<BaseGovernanceSetting?>().firstWhere(
      (item) =>
          item?.tenantId == tenantId &&
          item?.settingKey == settingKey &&
          item?.scopeType == scopeType &&
          item?.companyId == companyId &&
          item?.establishmentId == establishmentId,
      orElse: () => null,
    );

    if (setting == null) {
      throw const AppFailure(
        title: 'Registro nao encontrado',
        message: 'Configuracao nao encontrada.',
        code: 'NOT_FOUND',
      );
    }

    return setting;
  }

  @override
  Future<BaseGovernanceListResult<BaseGovernanceRole>> listRoles(
    AuthSession session, {
    String? search,
    GovernanceRecordStatus? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    _requirePermission(session, BaseGovernancePermissions.rolesRead);
    final tenantId = _tenantId(session);
    final normalizedSearch = search?.trim().toLowerCase();
    final filtered =
        _roles
            .where((role) => role.tenantId == tenantId)
            .where((role) => status == null || role.status == status)
            .where((role) {
              if (normalizedSearch == null || normalizedSearch.isEmpty) {
                return true;
              }

              final haystack = [
                role.key,
                role.name,
                role.description ?? '',
              ].join(' ').toLowerCase();
              return haystack.contains(normalizedSearch);
            })
            .toList(growable: false)
          ..sort((left, right) => left.name.compareTo(right.name));

    final start = (page - 1) * pageSize;
    final items = start >= filtered.length
        ? const <BaseGovernanceRole>[]
        : filtered.skip(start).take(pageSize).toList(growable: false);

    return BaseGovernanceListResult<BaseGovernanceRole>(
      items: items,
      pagination: PaginationInfo(
        page: page,
        pageSize: pageSize,
        totalItems: filtered.length,
        hasNextPage: start + pageSize < filtered.length,
      ),
    );
  }

  @override
  Future<BaseGovernanceRole> createRole(
    AuthSession session,
    CreateBaseGovernanceRoleInput input,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.rolesManage);
    final tenantId = _tenantId(session);
    _ensureUniqueRoleKey(tenantId, input.key);
    final permissionKeys = _normalizeStringList(input.permissionKeys);
    _validatePermissionKeys(permissionKeys);

    final role = BaseGovernanceRole(
      roleId:
          'role_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}${_random.nextInt(999).toString().padLeft(3, '0')}',
      tenantId: tenantId,
      key: input.key.trim().toLowerCase(),
      name: input.name.trim(),
      description: input.description?.trim().isEmpty == true
          ? null
          : input.description?.trim(),
      permissionKeys: permissionKeys,
      companyIds: _normalizeStringList(input.companyIds),
      establishmentIds: _normalizeStringList(input.establishmentIds),
      costCenterIds: _normalizeStringList(input.costCenterIds),
      status: input.status,
      version: 0,
      createdAt: DateTime.now().toUtc().toIso8601String(),
      createdBy: session.user.id,
    );

    _roles.add(role);
    _auditEvents.insert(
      0,
      _buildAuditEvent(
        tenantId: tenantId,
        actorUserId: session.user.id,
        entityType: 'role',
        entityId: role.roleId,
        action: 'role.created',
        after: <String, dynamic>{
          'key': role.key,
          'status': role.status.wireName,
          'permissionKeys': role.permissionKeys,
        },
      ),
    );

    return role;
  }

  @override
  Future<BaseGovernanceRole> updateRole(
    AuthSession session,
    String roleId,
    UpdateBaseGovernanceRoleInput input,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.rolesManage);
    final tenantId = _tenantId(session);
    final currentRole = _requireRole(tenantId, roleId);

    if (currentRole.version != input.expectedVersion) {
      throw const AppFailure(
        title: 'Conflito de versao',
        message:
            'Este registro foi alterado por outra pessoa. Recarregue os dados antes de salvar novamente.',
        code: 'VERSION_CONFLICT',
      );
    }

    final nextKey = (input.key ?? currentRole.key).trim().toLowerCase();
    _ensureUniqueRoleKey(tenantId, nextKey, ignoreRoleId: currentRole.roleId);

    final permissionKeys = _normalizeStringList(
      input.permissionKeys ?? currentRole.permissionKeys,
    );
    _validatePermissionKeys(permissionKeys);

    final updatedRole = BaseGovernanceRole(
      roleId: currentRole.roleId,
      tenantId: currentRole.tenantId,
      key: nextKey,
      name: (input.name ?? currentRole.name).trim(),
      description: input.description == null
          ? currentRole.description
          : (input.description!.trim().isEmpty
                ? null
                : input.description!.trim()),
      permissionKeys: permissionKeys,
      companyIds: _normalizeStringList(
        input.companyIds ?? currentRole.companyIds,
      ),
      establishmentIds: _normalizeStringList(
        input.establishmentIds ?? currentRole.establishmentIds,
      ),
      costCenterIds: _normalizeStringList(
        input.costCenterIds ?? currentRole.costCenterIds,
      ),
      status: input.status ?? currentRole.status,
      version: currentRole.version + 1,
      createdAt: currentRole.createdAt,
      createdBy: currentRole.createdBy,
      updatedAt: DateTime.now().toUtc().toIso8601String(),
      updatedBy: session.user.id,
    );

    final index = _roles.indexWhere((role) => role.roleId == roleId);
    _roles[index] = updatedRole;
    _auditEvents.insert(
      0,
      _buildAuditEvent(
        tenantId: tenantId,
        actorUserId: session.user.id,
        entityType: 'role',
        entityId: updatedRole.roleId,
        action: 'role.updated',
        before: <String, dynamic>{
          'key': currentRole.key,
          'status': currentRole.status.wireName,
          'permissionKeys': currentRole.permissionKeys,
        },
        after: <String, dynamic>{
          'key': updatedRole.key,
          'status': updatedRole.status.wireName,
          'permissionKeys': updatedRole.permissionKeys,
        },
      ),
    );

    return updatedRole;
  }

  @override
  Future<List<PermissionCatalogEntry>> listPermissionCatalog(
    AuthSession session,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.rolesRead);
    return _permissionCatalog;
  }

  @override
  Future<BaseGovernanceListResult<BaseGovernanceSetting>> listSettings(
    AuthSession session, {
    String? search,
    String? moduleKey,
    SettingScopeType? scopeType,
    bool? sensitive,
    GovernanceRecordStatus? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    _requirePermission(session, BaseGovernancePermissions.settingsRead);
    final tenantId = _tenantId(session);
    final normalizedSearch = search?.trim().toLowerCase();
    final filtered =
        _settings
            .where((setting) => setting.tenantId == tenantId)
            .where(
              (setting) =>
                  moduleKey == null || moduleKey.trim().isEmpty
                      ? true
                      : setting.moduleKey == moduleKey.trim(),
            )
            .where((setting) => scopeType == null || setting.scopeType == scopeType)
            .where((setting) => sensitive == null || setting.sensitive == sensitive)
            .where((setting) => status == null || setting.status == status)
            .where((setting) {
              if (normalizedSearch == null || normalizedSearch.isEmpty) {
                return true;
              }

              final haystack = [
                setting.settingKey,
                setting.label,
                setting.description ?? '',
                setting.category,
                setting.moduleKey,
              ].join(' ').toLowerCase();
              return haystack.contains(normalizedSearch);
            })
            .toList(growable: false)
          ..sort((left, right) => left.label.compareTo(right.label));

    final start = (page - 1) * pageSize;
    final items = start >= filtered.length
        ? const <BaseGovernanceSetting>[]
        : filtered.skip(start).take(pageSize).toList(growable: false);

    return BaseGovernanceListResult<BaseGovernanceSetting>(
      items: items,
      pagination: PaginationInfo(
        page: page,
        pageSize: pageSize,
        totalItems: filtered.length,
        hasNextPage: start + pageSize < filtered.length,
      ),
    );
  }

  @override
  Future<BaseGovernanceSetting> updateSetting(
    AuthSession session,
    String settingKey,
    UpdateBaseGovernanceSettingInput input,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.settingsManage);
    final tenantId = _tenantId(session);
    final currentSetting = _requireSetting(
      tenantId,
      settingKey,
      input.scopeType,
      companyId: input.companyId,
      establishmentId: input.establishmentId,
    );

    if (currentSetting.version != input.expectedVersion) {
      throw const AppFailure(
        title: 'Conflito de versao',
        message:
            'Este registro foi alterado por outra pessoa. Recarregue os dados antes de salvar novamente.',
        code: 'VERSION_CONFLICT',
      );
    }

    final updatedSetting = BaseGovernanceSetting(
      settingKey: currentSetting.settingKey,
      tenantId: currentSetting.tenantId,
      moduleKey: currentSetting.moduleKey,
      category: currentSetting.category,
      label: currentSetting.label,
      description: currentSetting.description,
      scopeType: currentSetting.scopeType,
      companyId: currentSetting.companyId,
      establishmentId: currentSetting.establishmentId,
      valueType: currentSetting.valueType,
      value: input.value,
      defaultValue: currentSetting.defaultValue,
      sensitive: currentSetting.sensitive,
      status: currentSetting.status,
      version: currentSetting.version + 1,
      createdAt: currentSetting.createdAt,
      createdBy: currentSetting.createdBy,
      updatedAt: DateTime.now().toUtc().toIso8601String(),
      updatedBy: session.user.id,
    );

    final index = _settings.indexWhere(
      (setting) =>
          setting.settingKey == settingKey &&
          setting.scopeType == input.scopeType &&
          setting.companyId == input.companyId &&
          setting.establishmentId == input.establishmentId,
    );
    _settings[index] = updatedSetting;
    _auditEvents.insert(
      0,
      _buildAuditEvent(
        tenantId: tenantId,
        actorUserId: session.user.id,
        entityType: 'setting',
        entityId: updatedSetting.settingKey,
        action: 'setting.updated',
        before: <String, dynamic>{
          'scopeType': currentSetting.scopeType.wireName,
          'value': currentSetting.value,
          'version': currentSetting.version,
        },
        after: <String, dynamic>{
          'scopeType': updatedSetting.scopeType.wireName,
          'value': updatedSetting.value,
          'version': updatedSetting.version,
        },
      ),
    );

    return updatedSetting;
  }

  @override
  Future<BaseGovernanceSetting> resetSetting(
    AuthSession session,
    String settingKey,
    ResetBaseGovernanceSettingInput input,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.settingsManage);
    final tenantId = _tenantId(session);
    final currentSetting = _requireSetting(
      tenantId,
      settingKey,
      input.scopeType,
      companyId: input.companyId,
      establishmentId: input.establishmentId,
    );

    if (currentSetting.version != input.expectedVersion) {
      throw const AppFailure(
        title: 'Conflito de versao',
        message:
            'Este registro foi alterado por outra pessoa. Recarregue os dados antes de salvar novamente.',
        code: 'VERSION_CONFLICT',
      );
    }

    final resetSetting = BaseGovernanceSetting(
      settingKey: currentSetting.settingKey,
      tenantId: currentSetting.tenantId,
      moduleKey: currentSetting.moduleKey,
      category: currentSetting.category,
      label: currentSetting.label,
      description: currentSetting.description,
      scopeType: currentSetting.scopeType,
      companyId: currentSetting.companyId,
      establishmentId: currentSetting.establishmentId,
      valueType: currentSetting.valueType,
      value: currentSetting.defaultValue,
      defaultValue: currentSetting.defaultValue,
      sensitive: currentSetting.sensitive,
      status: currentSetting.status,
      version: currentSetting.version + 1,
      createdAt: currentSetting.createdAt,
      createdBy: currentSetting.createdBy,
      updatedAt: DateTime.now().toUtc().toIso8601String(),
      updatedBy: session.user.id,
    );

    final index = _settings.indexWhere(
      (setting) =>
          setting.settingKey == settingKey &&
          setting.scopeType == input.scopeType &&
          setting.companyId == input.companyId &&
          setting.establishmentId == input.establishmentId,
    );
    _settings[index] = resetSetting;
    _auditEvents.insert(
      0,
      _buildAuditEvent(
        tenantId: tenantId,
        actorUserId: session.user.id,
        entityType: 'setting',
        entityId: resetSetting.settingKey,
        action: 'setting.reset',
        before: <String, dynamic>{
          'scopeType': currentSetting.scopeType.wireName,
          'value': currentSetting.value,
          'version': currentSetting.version,
        },
        after: <String, dynamic>{
          'scopeType': resetSetting.scopeType.wireName,
          'value': resetSetting.value,
          'version': resetSetting.version,
        },
      ),
    );

    return resetSetting;
  }

  @override
  Future<BaseGovernanceListResult<BaseGovernanceAuditEvent>> listAuditEvents(
    AuthSession session, {
    String? entityType,
    String? entityId,
    int page = 1,
    int pageSize = 50,
  }) async {
    _requirePermission(session, BaseGovernancePermissions.auditRead);
    final tenantId = _tenantId(session);
    final filtered =
        _auditEvents
            .where((event) => event.tenantId == tenantId)
            .where(
              (event) => entityType == null || entityType.trim().isEmpty
                  ? true
                  : event.entityType == entityType.trim(),
            )
            .where(
              (event) => entityId == null || entityId.trim().isEmpty
                  ? true
                  : event.entityId == entityId.trim(),
            )
            .toList(growable: false)
          ..sort((left, right) => right.createdAt.compareTo(left.createdAt));

    final start = (page - 1) * pageSize;
    final items = start >= filtered.length
        ? const <BaseGovernanceAuditEvent>[]
        : filtered.skip(start).take(pageSize).toList(growable: false);

    return BaseGovernanceListResult<BaseGovernanceAuditEvent>(
      items: items,
      pagination: PaginationInfo(
        page: page,
        pageSize: pageSize,
        totalItems: filtered.length,
        hasNextPage: start + pageSize < filtered.length,
      ),
    );
  }

  @override
  Future<BaseGovernanceListResult<DataJob>> listDataJobs(
    AuthSession session, {
    String? search,
    DataJobEntity? entity,
    DataJobType? type,
    DataJobStatus? status,
    int page = 1,
    int pageSize = 50,
  }) async {
    _requirePermission(session, BaseGovernancePermissions.dataJobsRead);
    final tenantId = _tenantId(session);
    final normalizedSearch = search?.trim().toLowerCase();
    final filtered = _dataJobs
        .where((job) => job.tenantId == tenantId)
        .where((job) => entity == null || job.entity == entity)
        .where((job) => type == null || job.type == type)
        .where((job) => status == null || job.status == status)
        .where((job) {
          if (normalizedSearch == null || normalizedSearch.isEmpty) {
            return true;
          }
          return [
            job.fileName,
            job.entity.wireName,
            job.type.wireName,
            job.status.wireName,
          ].join(' ').toLowerCase().contains(normalizedSearch);
        })
        .toList(growable: false)
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));

    final start = (page - 1) * pageSize;
    final items = start >= filtered.length
        ? const <DataJob>[]
        : filtered.skip(start).take(pageSize).toList(growable: false);

    return BaseGovernanceListResult<DataJob>(
      items: items,
      pagination: PaginationInfo(
        page: page,
        pageSize: pageSize,
        totalItems: filtered.length,
        hasNextPage: start + pageSize < filtered.length,
      ),
    );
  }

  @override
  Future<DataJob> createImportJob(
    AuthSession session,
    CreateImportJobInput input,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.dataJobsManage);
    final tenantId = _tenantId(session);
    final lines = input.content
        .split(RegExp(r'\r?\n'))
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList(growable: false);
    final headers = lines.first.split(',').map((item) => item.trim()).toList();
    final rows = lines.skip(1).map((line) {
      final values = line.split(',').map((item) => item.trim()).toList();
      return Map<String, String>.fromEntries(
        headers.asMap().entries.map(
          (entry) => MapEntry(entry.value, values.elementAtOrNull(entry.key) ?? ''),
        ),
      );
    }).toList(growable: false);

    final mappedRows = rows.map((row) => Map<String, String>.from(row)).toList();
    final errors = <DataJobError>[];
    for (var index = 0; index < mappedRows.length; index += 1) {
      final row = mappedRows[index];
      if (input.entity == DataJobEntity.roles && (row['permissionKeys'] ?? '').isEmpty) {
        errors.add(
          DataJobError(
            row: index + 1,
            field: 'permissionKeys',
            message: 'Informe ao menos uma permissao.',
          ),
        );
      }
    }

    final job = DataJob(
      id: _jobId(),
      tenantId: tenantId,
      type: DataJobType.import,
      entity: input.entity,
      format: input.format,
      status: errors.isEmpty ? DataJobStatus.validated : DataJobStatus.failed,
      fileName: input.fileName,
      companyId: input.companyId,
      establishmentId: input.establishmentId,
      mode: input.mode,
      mapping: input.mapping,
      filters: const {},
      totalRows: mappedRows.length,
      validRows: mappedRows.length - errors.length,
      invalidRows: errors.length,
      errors: errors,
      previewRows: mappedRows.asMap().entries.map(
        (entry) => DataJobPreviewRow(
          rowNumber: entry.key + 1,
          values: entry.value,
          valid: errors.where((error) => error.row == entry.key + 1).isEmpty,
        ),
      ).take(20).toList(growable: false),
      createdBy: session.user.id,
      createdAt: DateTime.now().toUtc().toIso8601String(),
      updatedAt: DateTime.now().toUtc().toIso8601String(),
    );

    _dataJobs.insert(0, job);
    return job;
  }

  @override
  Future<DataJob> runImportJob(
    AuthSession session,
    String jobId,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.dataJobsManage);
    final current = _dataJobs.firstWhere(
      (job) => job.id == jobId,
      orElse: () => throw const AppFailure(
        title: 'Registro nao encontrado',
        message: 'Job de importacao nao encontrado.',
        code: 'NOT_FOUND',
      ),
    );

    if (current.errors.isNotEmpty) {
      throw const AppFailure(
        title: 'Revise os dados informados',
        message: 'Corrija os erros da pre-validacao antes de executar o job.',
        code: 'VALIDATION_ERROR',
      );
    }

    if (current.entity == DataJobEntity.roles) {
      for (final row in current.previewRows) {
        final key = row.values['key']?.toString().trim() ?? '';
        final permissionKeys = _parseDelimitedValues(
          row.values['permissionKeys']?.toString() ?? '',
        );
        final existing = _roles.firstWhereOrNull((item) => item.key == key);
        if (existing == null) {
          _roles.insert(
            0,
            BaseGovernanceRole(
              roleId: 'role_${_jobId()}',
              tenantId: current.tenantId,
              key: key,
              name: row.values['name']?.toString().trim() ?? key,
              description: row.values['description']?.toString().trim(),
              permissionKeys: permissionKeys,
              companyIds: _parseDelimitedValues(
                row.values['companyIds']?.toString() ?? '',
              ),
              establishmentIds: _parseDelimitedValues(
                row.values['establishmentIds']?.toString() ?? '',
              ),
              costCenterIds: _parseDelimitedValues(
                row.values['costCenterIds']?.toString() ?? '',
              ),
              status: GovernanceRecordStatus.fromWire(
                row.values['status']?.toString() ?? 'draft',
              ),
              version: 0,
              createdAt: DateTime.now().toUtc().toIso8601String(),
              createdBy: session.user.id,
            ),
          );
        }
      }
    }

    final updated = DataJob(
      id: current.id,
      tenantId: current.tenantId,
      type: current.type,
      entity: current.entity,
      format: current.format,
      status: DataJobStatus.completed,
      fileName: current.fileName,
      companyId: current.companyId,
      establishmentId: current.establishmentId,
      mode: current.mode,
      mapping: current.mapping,
      filters: current.filters,
      totalRows: current.totalRows,
      validRows: current.validRows,
      invalidRows: current.invalidRows,
      errors: current.errors,
      previewRows: current.previewRows,
      outputPreview: current.outputPreview,
      createdBy: current.createdBy,
      createdAt: current.createdAt,
      updatedAt: DateTime.now().toUtc().toIso8601String(),
      completedAt: DateTime.now().toUtc().toIso8601String(),
    );
    final index = _dataJobs.indexWhere((job) => job.id == jobId);
    _dataJobs[index] = updated;
    _auditEvents.insert(
      0,
      _buildAuditEvent(
        tenantId: current.tenantId,
        actorUserId: session.user.id,
        entityType: 'data_job',
        entityId: current.id,
        action: 'data_job.completed',
        after: <String, dynamic>{
          'status': updated.status.wireName,
          'entity': updated.entity.wireName,
        },
      ),
    );
    return updated;
  }

  @override
  Future<DataJob> createExportJob(
    AuthSession session,
    CreateExportJobInput input,
  ) async {
    _requirePermission(session, BaseGovernancePermissions.dataJobsManage);
    final tenantId = _tenantId(session);
    final rows = switch (input.entity) {
      DataJobEntity.settings => _settings
          .where((item) => item.tenantId == tenantId)
          .map((item) => {
            'settingKey': item.settingKey,
            'moduleKey': item.moduleKey,
            'scopeType': item.scopeType.wireName,
          })
          .toList(growable: false),
      DataJobEntity.audit => _auditEvents
          .where((item) => item.tenantId == tenantId)
          .map((item) => {
            'entityType': item.entityType,
            'entityId': item.entityId,
            'action': item.action,
          })
          .toList(growable: false),
      _ => _roles
          .where((item) => item.tenantId == tenantId)
          .map((item) => {
            'key': item.key,
            'name': item.name,
            'status': item.status.wireName,
          })
          .toList(growable: false),
    };
    final headers = rows.isEmpty ? const <String>[] : rows.first.keys.toList();
    final outputPreview = [
      headers.join(','),
      ...rows.take(20).map(
        (row) => headers.map((header) => row[header]).join(','),
      ),
    ].join('\r\n');

    final job = DataJob(
      id: _jobId(),
      tenantId: tenantId,
      type: DataJobType.export,
      entity: input.entity,
      format: input.format,
      status: DataJobStatus.completed,
      fileName: input.fileName,
      companyId: input.companyId,
      establishmentId: input.establishmentId,
      mapping: const [],
      filters: input.filters,
      totalRows: rows.length,
      validRows: rows.length,
      invalidRows: 0,
      errors: const [],
      previewRows: rows.asMap().entries.map(
        (entry) => DataJobPreviewRow(
          rowNumber: entry.key + 1,
          values: Map<String, dynamic>.from(entry.value),
          valid: true,
        ),
      ).take(20).toList(growable: false),
      outputPreview: outputPreview,
      createdBy: session.user.id,
      createdAt: DateTime.now().toUtc().toIso8601String(),
      updatedAt: DateTime.now().toUtc().toIso8601String(),
      completedAt: DateTime.now().toUtc().toIso8601String(),
    );

    _dataJobs.insert(0, job);
    return job;
  }
}

const List<PermissionCatalogEntry>
_permissionCatalog = <PermissionCatalogEntry>[
  PermissionCatalogEntry(
    key: 'users.read',
    label: 'Listar usuarios',
    description: 'Consulta usuarios do tenant e seus estados operacionais.',
    moduleKey: 'users',
    actionKey: 'read',
    scopeTypes: ['TENANT'],
  ),
  PermissionCatalogEntry(
    key: 'users.manage',
    label: 'Gerenciar usuarios',
    description: 'Ativa, suspende e arquiva usuarios com trilha de auditoria.',
    moduleKey: 'users',
    actionKey: 'manage',
    scopeTypes: ['TENANT'],
  ),
  PermissionCatalogEntry(
    key: BaseGovernancePermissions.rolesRead,
    label: 'Listar perfis',
    description: 'Consulta o catalogo administravel de perfis e permissoes.',
    moduleKey: 'roles',
    actionKey: 'read',
    scopeTypes: ['TENANT'],
  ),
  PermissionCatalogEntry(
    key: BaseGovernancePermissions.rolesManage,
    label: 'Gerenciar perfis',
    description: 'Cria, edita e desativa perfis administraveis por tenant.',
    moduleKey: 'roles',
    actionKey: 'manage',
    scopeTypes: ['TENANT'],
  ),
  PermissionCatalogEntry(
    key: BaseGovernancePermissions.settingsRead,
    label: 'Consultar configuracoes',
    description: 'Lista parametros versionados por modulo, empresa e filial.',
    moduleKey: 'settings',
    actionKey: 'read',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: BaseGovernancePermissions.settingsManage,
    label: 'Gerenciar configuracoes',
    description:
        'Atualiza parametros sensiveis, reverte para padrao e registra auditoria.',
    moduleKey: 'settings',
    actionKey: 'manage',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: BaseGovernancePermissions.auditRead,
    label: 'Consultar auditoria',
    description: 'Le eventos auditaveis por entidade, usuario e correlacao.',
    moduleKey: 'audit',
    actionKey: 'read',
    scopeTypes: ['TENANT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.company.read',
    label: 'Consultar empresas',
    description: 'Lista e detalha empresas do escopo autorizado.',
    moduleKey: 'governance',
    actionKey: 'read',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.company.create',
    label: 'Criar empresas',
    description: 'Cria novas empresas com validacoes e idempotencia.',
    moduleKey: 'governance',
    actionKey: 'create',
    scopeTypes: ['TENANT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.company.update',
    label: 'Editar empresas',
    description: 'Atualiza dados de empresas respeitando versao e auditoria.',
    moduleKey: 'governance',
    actionKey: 'update',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.company.activate',
    label: 'Ativar empresas',
    description: 'Executa transicoes de ativacao de empresas.',
    moduleKey: 'governance',
    actionKey: 'activate',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.company.inactivate',
    label: 'Inativar empresas',
    description: 'Executa transicoes de inativacao de empresas.',
    moduleKey: 'governance',
    actionKey: 'inactivate',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.company.archive',
    label: 'Arquivar empresas',
    description: 'Arquiva empresas bloqueando operacoes sensiveis.',
    moduleKey: 'governance',
    actionKey: 'archive',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.establishment.read',
    label: 'Consultar estabelecimentos',
    description: 'Lista e detalha matriz e filiais do escopo autorizado.',
    moduleKey: 'governance',
    actionKey: 'read',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.establishment.create',
    label: 'Criar estabelecimentos',
    description: 'Cria estabelecimentos vinculados a empresas autorizadas.',
    moduleKey: 'governance',
    actionKey: 'create',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.establishment.update',
    label: 'Editar estabelecimentos',
    description: 'Atualiza estabelecimentos com versao e regras de negocio.',
    moduleKey: 'governance',
    actionKey: 'update',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.establishment.activate',
    label: 'Ativar estabelecimentos',
    description: 'Ativa matriz ou filial respeitando integridade do cadastro.',
    moduleKey: 'governance',
    actionKey: 'activate',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.establishment.inactivate',
    label: 'Inativar estabelecimentos',
    description: 'Inativa matriz ou filial respeitando grants vigentes.',
    moduleKey: 'governance',
    actionKey: 'inactivate',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.establishment.archive',
    label: 'Arquivar estabelecimentos',
    description: 'Arquiva estabelecimentos bloqueando o uso operacional.',
    moduleKey: 'governance',
    actionKey: 'archive',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.user_scope.manage',
    label: 'Gerenciar grants',
    description:
        'Define escopos, papeis e sobrescritas de permissao por usuario.',
    moduleKey: 'governance',
    actionKey: 'manage_scope',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.context.switch',
    label: 'Trocar contexto',
    description: 'Alterna empresa e filial ativas para escrita e leitura.',
    moduleKey: 'governance',
    actionKey: 'switch_context',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
  PermissionCatalogEntry(
    key: 'governance.sharing.policy.manage',
    label: 'Gerenciar compartilhamento',
    description:
        'Configura politicas explicitas de compartilhamento entre empresas.',
    moduleKey: 'governance',
    actionKey: 'manage_sharing',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.consolidation.read',
    label: 'Consultar consolidacao',
    description: 'Lista e detalha execucoes formais de consolidacao.',
    moduleKey: 'governance',
    actionKey: 'read_consolidation',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.consolidation.run',
    label: 'Criar consolidacao',
    description: 'Dispara novas execucoes de consolidacao multiempresa.',
    moduleKey: 'governance',
    actionKey: 'run_consolidation',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'governance.consolidation.reprocess',
    label: 'Reprocessar consolidacao',
    description: 'Reagenda runs bloqueadas ou com divergencia.',
    moduleKey: 'governance',
    actionKey: 'reprocess_consolidation',
    scopeTypes: ['TENANT', 'COMPANY'],
  ),
  PermissionCatalogEntry(
    key: 'reporting.consolidated.read',
    label: 'Ler visao consolidada',
    description: 'Consulta indicadores consolidados do escopo selecionado.',
    moduleKey: 'reporting',
    actionKey: 'read_consolidated',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  ),
];

List<BaseGovernanceSetting> _seedSettings() {
  return const <BaseGovernanceSetting>[
    BaseGovernanceSetting(
      settingKey: 'governance.numbering.invoice_series',
      tenantId: 'tenant_demo',
      moduleKey: 'governance',
      category: 'numbering',
      label: 'Serie de faturamento',
      description: 'Prefixo e numeracao padrao dos documentos de faturamento.',
      scopeType: SettingScopeType.company,
      companyId: 'cmp_demo',
      valueType: SettingValueType.json,
      value: <String, Object>{'prefix': 'NF', 'nextNumber': 1824},
      defaultValue: <String, Object>{'prefix': 'NF', 'nextNumber': 1000},
      sensitive: false,
      status: GovernanceRecordStatus.active,
      version: 3,
      createdAt: '2026-04-26T18:10:00.000Z',
      createdBy: 'user_admin',
      updatedAt: '2026-04-26T18:22:00.000Z',
      updatedBy: 'user_admin',
    ),
    BaseGovernanceSetting(
      settingKey: 'notifications.email.invoice_template',
      tenantId: 'tenant_demo',
      moduleKey: 'notifications',
      category: 'templates',
      label: 'Template de e-mail de faturamento',
      description: 'Assunto e corpo utilizados no envio padrao de documentos.',
      scopeType: SettingScopeType.tenant,
      valueType: SettingValueType.json,
      value: <String, Object>{
        'subject': 'Documento fiscal disponivel',
        'body': 'Acesse o portal para consultar seu documento.',
      },
      defaultValue: <String, Object>{
        'subject': 'Documento disponivel',
        'body': 'Seu documento ja pode ser consultado no portal.',
      },
      sensitive: false,
      status: GovernanceRecordStatus.active,
      version: 1,
      createdAt: '2026-04-26T18:12:00.000Z',
      createdBy: 'user_admin',
      updatedAt: '2026-04-26T18:18:00.000Z',
      updatedBy: 'user_admin',
    ),
    BaseGovernanceSetting(
      settingKey: 'governance.approvals.require_second_reviewer',
      tenantId: 'tenant_demo',
      moduleKey: 'governance',
      category: 'policy',
      label: 'Exigir segundo aprovador',
      description: 'Ativa dupla revisao para alteracoes administrativas sensiveis.',
      scopeType: SettingScopeType.tenant,
      valueType: SettingValueType.boolean,
      value: true,
      defaultValue: true,
      sensitive: false,
      status: GovernanceRecordStatus.active,
      version: 0,
      createdAt: '2026-04-26T18:15:00.000Z',
      createdBy: 'user_admin',
    ),
  ];
}

List<DataJob> _seedDataJobs() {
  return const <DataJob>[
    DataJob(
      id: 'job_seed_roles_export',
      tenantId: 'tenant_demo',
      type: DataJobType.export,
      entity: DataJobEntity.roles,
      format: DataJobFormat.csv,
      status: DataJobStatus.completed,
      fileName: 'roles-seed.csv',
      mapping: <DataJobMappingEntry>[],
      filters: <String, dynamic>{},
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      errors: <DataJobError>[],
      previewRows: <DataJobPreviewRow>[
        DataJobPreviewRow(
          rowNumber: 1,
          values: <String, dynamic>{
            'key': 'platform_admin',
            'name': 'Administrador da plataforma',
          },
          valid: true,
        ),
      ],
      outputPreview: 'key,name\r\nplatform_admin,Administrador da plataforma',
      createdBy: 'user_admin',
      createdAt: '2026-04-26T18:30:00.000Z',
      completedAt: '2026-04-26T18:30:02.000Z',
    ),
  ];
}

extension on Iterable<BaseGovernanceRole> {
  BaseGovernanceRole? firstWhereOrNull(
    bool Function(BaseGovernanceRole item) test,
  ) {
    for (final item in this) {
      if (test(item)) {
        return item;
      }
    }
    return null;
  }
}
