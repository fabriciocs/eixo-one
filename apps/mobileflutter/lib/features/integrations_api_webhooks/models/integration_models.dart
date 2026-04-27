enum IntegrationStatus { active, suspended, archived, pendingReview }

enum IntegrationTargetType { apiClient, webhookSubscription }

class IntegrationScope {
  const IntegrationScope({
    required this.tenantId,
    this.empresaId,
    this.filialId,
  });

  final String tenantId;
  final String? empresaId;
  final String? filialId;

  Map<String, dynamic> toQuery() => {
        'tenantId': tenantId,
        if (empresaId != null) 'empresaId': empresaId,
        if (filialId != null) 'filialId': filialId,
      };
}

class IntegrationSummary {
  const IntegrationSummary({
    required this.id,
    required this.code,
    required this.name,
    required this.type,
    required this.status,
    required this.updatedAt,
    this.description,
  });

  final String id;
  final String code;
  final String name;
  final IntegrationTargetType type;
  final IntegrationStatus status;
  final DateTime updatedAt;
  final String? description;

  factory IntegrationSummary.fromJson(Map<String, dynamic> json, IntegrationTargetType type) {
    return IntegrationSummary(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      type: type,
      status: _statusFromString(json['status'] as String? ?? 'pending_review'),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
      description: json['description'] as String?,
    );
  }
}

class IntegrationListResult {
  const IntegrationListResult({
    required this.apiClients,
    required this.webhooks,
  });

  final List<IntegrationSummary> apiClients;
  final List<IntegrationSummary> webhooks;

  List<IntegrationSummary> get all => [...apiClients, ...webhooks];

  factory IntegrationListResult.fromEnvelope(Map<String, dynamic> envelope) {
    final data = envelope['data'] as Map<String, dynamic>? ?? const {};
    final apiClients = (data['apiClients'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((item) => IntegrationSummary.fromJson(item, IntegrationTargetType.apiClient))
        .toList(growable: false);
    final webhooks = (data['webhooks'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((item) => IntegrationSummary.fromJson(item, IntegrationTargetType.webhookSubscription))
        .toList(growable: false);
    return IntegrationListResult(apiClients: apiClients, webhooks: webhooks);
  }
}

class CriticalActionInput {
  const CriticalActionInput({
    required this.scope,
    required this.targetType,
    required this.targetId,
    required this.status,
    required this.reason,
    required this.confirmationText,
  });

  final IntegrationScope scope;
  final IntegrationTargetType targetType;
  final String targetId;
  final IntegrationStatus status;
  final String reason;
  final String confirmationText;

  Map<String, dynamic> toJson() => {
        ...scope.toQuery(),
        'targetType': targetType == IntegrationTargetType.apiClient ? 'api_client' : 'webhook_subscription',
        'targetId': targetId,
        'status': _statusToString(status),
        'reason': reason,
        'confirmationText': confirmationText,
      };
}

IntegrationStatus _statusFromString(String value) {
  switch (value) {
    case 'active':
      return IntegrationStatus.active;
    case 'suspended':
      return IntegrationStatus.suspended;
    case 'archived':
      return IntegrationStatus.archived;
    default:
      return IntegrationStatus.pendingReview;
  }
}

String statusLabel(IntegrationStatus status) {
  switch (status) {
    case IntegrationStatus.active:
      return 'Ativo';
    case IntegrationStatus.suspended:
      return 'Suspenso';
    case IntegrationStatus.archived:
      return 'Arquivado';
    case IntegrationStatus.pendingReview:
      return 'Em revisão';
  }
}

String _statusToString(IntegrationStatus status) {
  switch (status) {
    case IntegrationStatus.active:
      return 'active';
    case IntegrationStatus.suspended:
      return 'suspended';
    case IntegrationStatus.archived:
      return 'archived';
    case IntegrationStatus.pendingReview:
      return 'pending_review';
  }
}
