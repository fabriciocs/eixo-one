import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/app_failure.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';
import '../../application/governance_repository.dart';
import '../../domain/models/governance_commands.dart';
import '../../domain/models/governance_models.dart';
import '../../infrastructure/api_governance_repository.dart';
import '../../infrastructure/in_memory_governance_repository.dart';

class GovernanceWorkspace {
  const GovernanceWorkspace({
    required this.accessibleScopes,
    required this.overview,
  });

  final AccessibleScopesSummary accessibleScopes;
  final ConsolidatedOverview overview;

  UserContext? get context => accessibleScopes.context;
}

final governanceRepositoryProvider = Provider<GovernanceRepository>((ref) {
  final useApi =
      AppConfig.useGovernanceApi &&
      Firebase.apps.isNotEmpty &&
      FirebaseAuth.instance.currentUser != null;

  if (useApi) {
    return ApiGovernanceRepository();
  }

  return InMemoryGovernanceRepository();
});

class GovernanceWorkspaceNotifier
    extends AsyncNotifier<GovernanceWorkspace?> {
  @override
  Future<GovernanceWorkspace?> build() async {
    final session = ref.watch(authSessionProvider);
    if (session == null) {
      return null;
    }

    final repository = ref.watch(governanceRepositoryProvider);
    final results = await Future.wait<Object>([
      repository.fetchAccessibleScopes(session),
      repository.getConsolidatedOverview(session),
    ]);

    return GovernanceWorkspace(
      accessibleScopes: results[0] as AccessibleScopesSummary,
      overview: results[1] as ConsolidatedOverview,
    );
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(build);
  }

  Future<void> switchContext(SwitchOperationalContextInput input) async {
    final session = ref.read(authSessionProvider);
    if (session == null) {
      throw const AppFailure(
        title: 'Sessao indisponivel',
        message: 'Faca login novamente para atualizar o contexto operacional.',
        code: 'UNAUTHENTICATED',
      );
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(governanceRepositoryProvider);
      await repository.switchContext(session, input);
      final results = await Future.wait<Object>([
        repository.fetchAccessibleScopes(session),
        repository.getConsolidatedOverview(session),
      ]);
      return GovernanceWorkspace(
        accessibleScopes: results[0] as AccessibleScopesSummary,
        overview: results[1] as ConsolidatedOverview,
      );
    });
  }
}

final governanceWorkspaceProvider = AsyncNotifierProvider<
    GovernanceWorkspaceNotifier, GovernanceWorkspace?>(
  GovernanceWorkspaceNotifier.new,
);
