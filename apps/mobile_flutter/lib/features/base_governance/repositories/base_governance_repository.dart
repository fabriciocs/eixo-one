import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/base_governance_models.dart';

class BaseGovernanceRepository {
  const BaseGovernanceRepository({
    required this.apiBaseUrl,
    required this.idTokenProvider,
  });

  final String apiBaseUrl;
  final Future<String> Function() idTokenProvider;

  Future<List<BaseGovernanceRole>> fetchRoles() async {
    final response = await _get('/v1/base-governance/roles');
    final data = response['data'] as List<dynamic>;
    return data.map((item) => BaseGovernanceRole.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<List<CustomerSummary>> fetchCustomers({String? companyId}) async {
    final query = companyId == null ? '' : '?companyId=$companyId';
    final response = await _get('/v1/customers$query');
    final data = response['data'] as List<dynamic>;
    return data.map((item) => CustomerSummary.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Map<String, dynamic>> _get(String path) async {
    final token = await idTokenProvider();
    final response = await http.get(
      Uri.parse('$apiBaseUrl$path'),
      headers: {
        'authorization': 'Bearer $token',
        'accept': 'application/json',
        'x-correlation-id': DateTime.now().microsecondsSinceEpoch.toString(),
      },
    );

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400 || body['ok'] == false) {
      throw StateError(body['error']?['message']?.toString() ?? 'Falha ao consultar dados.');
    }
    return body;
  }
}
