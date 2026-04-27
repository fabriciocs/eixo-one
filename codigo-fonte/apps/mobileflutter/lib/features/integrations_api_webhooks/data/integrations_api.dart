import 'dart:convert';

import '../models/integration_models.dart';

abstract class EixoOneHttpClient {
  Future<Map<String, dynamic>> getJson(String path, {Map<String, String>? query});
  Future<Map<String, dynamic>> postJson(String path, Map<String, dynamic> body, {Map<String, String>? headers});
  Future<Map<String, dynamic>> patchJson(String path, Map<String, dynamic> body, {Map<String, String>? headers});
}

class IntegrationsApi {
  const IntegrationsApi(this._client);

  final EixoOneHttpClient _client;

  Future<IntegrationListResult> list({
    required IntegrationScope scope,
    String? status,
    String? search,
  }) async {
    final envelope = await _client.getJson(
      '/v1/base-governance/integrations',
      query: {
        ...scope.toQuery().map((key, value) => MapEntry(key, value.toString())),
        if (status != null) 'status': status,
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
        'limit': '50',
      },
    );
    _assertEnvelope(envelope);
    return IntegrationListResult.fromEnvelope(envelope);
  }

  Future<void> changeStatus(CriticalActionInput input, String idempotencyKey) async {
    final envelope = await _client.patchJson(
      '/v1/base-governance/integrations/status',
      input.toJson(),
      headers: {'x-idempotency-key': idempotencyKey},
    );
    _assertEnvelope(envelope);
  }

  Future<String> export(IntegrationScope scope, String reason, String idempotencyKey) async {
    final envelope = await _client.postJson(
      '/v1/base-governance/integrations/export',
      {...scope.toQuery(), 'reason': reason},
      headers: {'x-idempotency-key': idempotencyKey},
    );
    _assertEnvelope(envelope);
    return jsonEncode(envelope['data']);
  }

  void _assertEnvelope(Map<String, dynamic> envelope) {
    if (envelope['ok'] != true) {
      final error = envelope['error'] as Map<String, dynamic>? ?? const {};
      throw IntegrationsApiException(
        code: error['code'] as String? ?? 'UNKNOWN_ERROR',
        message: error['message'] as String? ?? 'Não foi possível concluir a operação.',
      );
    }
  }
}

class IntegrationsApiException implements Exception {
  const IntegrationsApiException({required this.code, required this.message});

  final String code;
  final String message;

  bool get isForbidden => code == 'PERMISSION_DENIED' || code == 'MODULE_NOT_ALLOWED';

  @override
  String toString() => '$code: $message';
}
