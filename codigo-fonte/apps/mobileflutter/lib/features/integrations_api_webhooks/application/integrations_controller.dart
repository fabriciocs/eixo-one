import '../data/integrations_repository.dart';
import '../models/integration_models.dart';

class IntegrationsState {
  const IntegrationsState({
    required this.scope,
    this.isLoading = false,
    this.items = const [],
    this.search = '',
    this.errorMessage,
    this.canManage = false,
  });

  final IntegrationScope scope;
  final bool isLoading;
  final List<IntegrationSummary> items;
  final String search;
  final String? errorMessage;
  final bool canManage;

  bool get isEmpty => !isLoading && errorMessage == null && items.isEmpty;

  IntegrationsState copyWith({
    bool? isLoading,
    List<IntegrationSummary>? items,
    String? search,
    String? errorMessage,
    bool? canManage,
  }) {
    return IntegrationsState(
      scope: scope,
      isLoading: isLoading ?? this.isLoading,
      items: items ?? this.items,
      search: search ?? this.search,
      errorMessage: errorMessage,
      canManage: canManage ?? this.canManage,
    );
  }
}

/// Controller sem dependência direta de UI para facilitar teste unitário.
/// No app real, expor via Riverpod StateNotifier/AsyncNotifier.
class IntegrationsController {
  IntegrationsController({
    required IntegrationsRepository repository,
    required IntegrationScope scope,
    required bool canManage,
  })  : _repository = repository,
        state = IntegrationsState(scope: scope, canManage: canManage);

  final IntegrationsRepository _repository;
  IntegrationsState state;

  Future<void> load({String? search}) async {
    state = state.copyWith(isLoading: true, errorMessage: null, search: search ?? state.search);
    try {
      final result = await _repository.list(state.scope, search: state.search);
      state = state.copyWith(isLoading: false, items: result.all, errorMessage: null);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Não foi possível carregar integrações. Tente novamente.',
      );
    }
  }

  Future<void> suspend(IntegrationSummary target, String reason, String idempotencyKey) async {
    if (!state.canManage) {
      state = state.copyWith(errorMessage: 'Você não tem permissão para alterar integrações.');
      return;
    }
    await _repository.suspend(scope: state.scope, target: target, reason: reason, idempotencyKey: idempotencyKey);
    await load();
  }

  Future<void> reactivate(IntegrationSummary target, String reason, String idempotencyKey) async {
    if (!state.canManage) {
      state = state.copyWith(errorMessage: 'Você não tem permissão para alterar integrações.');
      return;
    }
    await _repository.reactivate(scope: state.scope, target: target, reason: reason, idempotencyKey: idempotencyKey);
    await load();
  }
}
