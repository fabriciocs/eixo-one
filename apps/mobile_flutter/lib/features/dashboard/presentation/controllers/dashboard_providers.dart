import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../shared/models/dashboard_summary.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';
import '../../application/dashboard_repository.dart';
import '../../infrastructure/in_memory_dashboard_repository.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return const InMemoryDashboardRepository();
});

class DashboardSummaryNotifier
    extends AutoDisposeAsyncNotifier<DashboardSummary> {
  @override
  Future<DashboardSummary> build() async {
    final session = ref.watch(authSessionProvider);
    final selectedOrganizationId = session?.selectedOrganizationId;

    if (selectedOrganizationId == null) {
      throw const AppFailure(
        title: 'Organizacao nao selecionada',
        message:
            'Escolha uma organizacao antes de carregar o dashboard principal.',
      );
    }

    return ref
        .watch(dashboardRepositoryProvider)
        .fetchSummary(selectedOrganizationId);
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(build);
  }
}

final dashboardSummaryProvider = AutoDisposeAsyncNotifierProvider<
    DashboardSummaryNotifier, DashboardSummary>(
  DashboardSummaryNotifier.new,
);
