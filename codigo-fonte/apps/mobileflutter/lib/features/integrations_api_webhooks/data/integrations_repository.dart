import '../models/integration_models.dart';
import 'integrations_api.dart';

class IntegrationsRepository {
  const IntegrationsRepository(this._api);

  final IntegrationsApi _api;

  Future<IntegrationListResult> list(IntegrationScope scope, {String? status, String? search}) {
    return _api.list(scope: scope, status: status, search: search);
  }

  Future<void> suspend({
    required IntegrationScope scope,
    required IntegrationSummary target,
    required String reason,
    required String idempotencyKey,
  }) {
    return _api.changeStatus(
      CriticalActionInput(
        scope: scope,
        targetType: target.type,
        targetId: target.id,
        status: IntegrationStatus.suspended,
        reason: reason,
        confirmationText: target.id,
      ),
      idempotencyKey,
    );
  }

  Future<void> reactivate({
    required IntegrationScope scope,
    required IntegrationSummary target,
    required String reason,
    required String idempotencyKey,
  }) {
    return _api.changeStatus(
      CriticalActionInput(
        scope: scope,
        targetType: target.type,
        targetId: target.id,
        status: IntegrationStatus.active,
        reason: reason,
        confirmationText: target.id,
      ),
      idempotencyKey,
    );
  }

  Future<String> export(IntegrationScope scope, String reason, String idempotencyKey) {
    return _api.export(scope, reason, idempotencyKey);
  }
}
