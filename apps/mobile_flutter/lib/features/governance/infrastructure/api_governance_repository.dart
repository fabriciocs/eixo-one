import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../../../core/config/app_config.dart';
import '../../../core/errors/app_failure.dart';
import '../../../shared/models/auth_session.dart';
import '../application/governance_repository.dart';
import '../domain/models/governance_commands.dart';
import '../domain/models/governance_models.dart';

class ApiGovernanceRepository implements GovernanceRepository {
  ApiGovernanceRepository({
    http.Client? client,
    FirebaseAuth? auth,
  })  : _client = client ?? http.Client(),
        _auth = auth ?? FirebaseAuth.instance;

  final http.Client _client;
  final FirebaseAuth _auth;
  final Random _random = Random();

  Future<Map<String, String>> _headers({
    String? idempotencyKey,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw const AppFailure(
        title: 'Sessao sem integracao de API',
        message:
            'A API de governanca exige autenticacao Firebase ativa neste ambiente.',
        code: 'UNAUTHENTICATED',
      );
    }

    final token = await user.getIdToken();
    final headers = <String, String>{
      'authorization': 'Bearer $token',
      'content-type': 'application/json',
    };
    if (idempotencyKey != null) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, String>? queryParameters]) {
    final baseUri = Uri.parse(AppConfig.apiBaseUrl);
    final hasQueryParameters =
        queryParameters != null && queryParameters.isNotEmpty;
    return baseUri.replace(
      path: '${baseUri.path}$path',
      queryParameters: hasQueryParameters ? queryParameters : null,
    );
  }

  Future<JsonMap> _send({
    required String method,
    required String path,
    Map<String, String>? queryParameters,
    JsonMap? body,
    String? idempotencyKey,
  }) async {
    try {
      final headers = await _headers(idempotencyKey: idempotencyKey);
      final uri = _uri(path, queryParameters);
      late final http.Response response;

      switch (method) {
        case 'GET':
          response = await _client
              .get(uri, headers: headers)
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
        case 'PUT':
          response = await _client
              .put(uri, headers: headers, body: jsonEncode(body ?? const {}))
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
            'A API de governanca retornou uma falha.',
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

  AppFailure _mapApiFailure({
    required String code,
    required String message,
  }) {
    switch (code) {
      case 'UNAUTHENTICATED':
        return const AppFailure(
          title: 'Sessao expirada',
          message: 'Sua sessao expirou. Entre novamente para continuar.',
          code: 'UNAUTHENTICATED',
        );
      case 'FORBIDDEN':
      case 'COMPANY_ACCESS_DENIED':
      case 'BRANCH_ACCESS_DENIED':
      case 'CONTEXT_SCOPE_INVALID':
        return AppFailure(
          title: 'Acesso negado',
          message: message,
          code: code,
        );
      case 'VALIDATION_ERROR':
      case 'INVALID_ESTABLISHMENT_TYPE':
      case 'CONSOLIDATION_PARAMETERS_INCOMPLETE':
      case 'CONSOLIDATION_MAPPING_MISSING':
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
      case 'COMPANY_ALREADY_HAS_PRIMARY_MATRIX':
      case 'GRANT_SCOPE_INCONSISTENT':
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

  String _idempotencyKey(String scope, AuthSession session) {
    final tenantId = session.selectedOrganizationId ?? session.organizations.first.id;
    return '$scope-$tenantId-${DateTime.now().millisecondsSinceEpoch}-${_random.nextInt(9999)}';
  }

  GovernanceListResult<T> _parseListResult<T>(
    JsonMap envelope,
    T Function(JsonMap json) parser,
  ) {
    final data = envelope['data'] as Map<String, dynamic>? ?? const {};
    final meta = envelope['meta'] as Map<String, dynamic>? ?? const {};
    final items = (data['items'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => parser(item.cast<String, dynamic>()))
        .toList(growable: false);
    final pagination = PaginationInfo.fromJson(
      (meta['pagination'] as Map<String, dynamic>? ?? const {}),
    );
    return GovernanceListResult(items: items, pagination: pagination);
  }

  @override
  Future<AccessibleScopesSummary> fetchAccessibleScopes(AuthSession session) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/me/accessible-scopes',
    );
    return AccessibleScopesSummary.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<UserContext> fetchUserContext(AuthSession session) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/me/context',
    );
    return UserContext.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<UserContext> switchContext(
    AuthSession session,
    SwitchOperationalContextInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/me/context/switch',
      body: input.toJson(),
    );
    return UserContext.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<GovernanceListResult<Company>> listCompanies(
    AuthSession session,
    CompanyFilters filters,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/companies',
      queryParameters: filters.toQueryParameters(),
    );
    return _parseListResult(envelope, Company.fromJson);
  }

  @override
  Future<Company> getCompany(AuthSession session, String companyId) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/companies/$companyId',
    );
    return Company.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<Company> createCompany(
    AuthSession session,
    CreateCompanyInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/companies',
      idempotencyKey: _idempotencyKey('company', session),
      body: input.toJson(),
    );
    return Company.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<Company> updateCompany(
    AuthSession session,
    String companyId,
    UpdateCompanyInput input,
  ) async {
    final envelope = await _send(
      method: 'PATCH',
      path: '/v1/governance/companies/$companyId',
      body: input.toJson(),
    );
    return Company.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<GovernanceListResult<Establishment>> listEstablishments(
    AuthSession session,
    EstablishmentFilters filters,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/establishments',
      queryParameters: filters.toQueryParameters(),
    );
    return _parseListResult(envelope, Establishment.fromJson);
  }

  @override
  Future<Establishment> getEstablishment(
    AuthSession session,
    String establishmentId,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/establishments/$establishmentId',
    );
    return Establishment.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<Establishment> createEstablishment(
    AuthSession session,
    CreateEstablishmentInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/establishments',
      idempotencyKey: _idempotencyKey('establishment', session),
      body: input.toJson(),
    );
    return Establishment.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<Establishment> updateEstablishment(
    AuthSession session,
    String establishmentId,
    UpdateEstablishmentInput input,
  ) async {
    final envelope = await _send(
      method: 'PATCH',
      path: '/v1/governance/establishments/$establishmentId',
      body: input.toJson(),
    );
    return Establishment.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<GovernanceListResult<GovernanceUserSummary>> listUsers(
    AuthSession session,
    GovernanceUserFilters filters,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/users',
      queryParameters: filters.toQueryParameters(),
    );
    return _parseListResult(envelope, GovernanceUserSummary.fromJson);
  }

  @override
  Future<UserScopeGrant> getUserScopeGrant(
    AuthSession session,
    String userId,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/users/$userId/scope-grants',
    );
    return UserScopeGrant.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<UserScopeGrant> upsertUserScopeGrant(
    AuthSession session,
    String userId,
    UpsertUserScopeGrantInput input,
  ) async {
    final envelope = await _send(
      method: 'PUT',
      path: '/v1/governance/users/$userId/scope-grants',
      body: input.toJson(),
    );
    return UserScopeGrant.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<ConsolidatedOverview> getConsolidatedOverview(AuthSession session) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/consolidated/overview',
    );
    return ConsolidatedOverview.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<GovernanceListResult<ConsolidationRun>> listConsolidationRuns(
    AuthSession session,
    ConsolidationRunFilters filters,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/consolidation-runs',
      queryParameters: filters.toQueryParameters(),
    );
    return _parseListResult(envelope, ConsolidationRun.fromJson);
  }

  @override
  Future<ConsolidationRun> createConsolidationRun(
    AuthSession session,
    CreateConsolidationRunInput input,
  ) async {
    final envelope = await _send(
      method: 'POST',
      path: '/v1/governance/consolidation-runs',
      idempotencyKey: _idempotencyKey('consolidation-run', session),
      body: input.toJson(),
    );
    return ConsolidationRun.fromJson(
      (envelope['data'] as Map<String, dynamic>? ?? const {}),
    );
  }

  @override
  Future<GovernanceListResult<SharingPolicy>> listSharingPolicies(
    AuthSession session,
  ) async {
    final envelope = await _send(
      method: 'GET',
      path: '/v1/governance/sharing-policies',
      queryParameters: const {'page': '1', 'pageSize': '20'},
    );
    return _parseListResult(envelope, SharingPolicy.fromJson);
  }
}
