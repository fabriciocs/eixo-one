import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/firebase/firebase_bootstrap.dart';
import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/error_state.dart';
import '../../../../design_system/components/loading_state.dart';
import '../../../../design_system/components/network_status_banner.dart';
import '../../../../design_system/components/status_badge.dart';
import '../../../../design_system/tokens/app_colors.dart';
import '../../../../shared/models/dashboard_summary.dart';
import '../../../auth/presentation/controllers/auth_providers.dart';
import '../controllers/dashboard_providers.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({
    super.key,
    required this.firebaseState,
  });

  final FirebaseBootstrapState firebaseState;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authSessionProvider);
    final dashboardState = ref.watch(dashboardSummaryProvider);

    return ResponsivePage(
      title: 'Dashboard',
      subtitle:
          session?.selectedOrganization?.name ?? 'Operacao sem organizacao ativa',
      actions: [
        StatusBadge(
          label:
              firebaseState.isConfigured ? 'Firebase configurado' : 'Firebase pendente',
          color:
              firebaseState.isConfigured ? AppColors.success : AppColors.warning,
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const NetworkStatusBanner(),
          Expanded(
            child: dashboardState.when(
              loading: () => ListView(
                children: const [
                  AppCard(
                    child: LoadingState(
                      message: 'Carregando indicadores do dashboard...',
                    ),
                  ),
                ],
              ),
              error: (error, _) {
                final failure = error is AppFailure
                    ? error
                    : const AppFailure(
                        title: 'Falha ao carregar dashboard',
                        message:
                            'Nao foi possivel carregar os dados do dashboard agora.',
                        retryable: true,
                      );

                return ErrorState(
                  failure: failure,
                  onRetry: () {
                    ref.read(dashboardSummaryProvider.notifier).reload();
                  },
                );
              },
              data: (summary) => _DashboardContent(
                firebaseState: firebaseState,
                summary: summary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({
    required this.firebaseState,
    required this.summary,
  });

  final FirebaseBootstrapState firebaseState;
  final DashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Status da plataforma',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(firebaseState.message),
              const SizedBox(height: 12),
              Text(summary.headline),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            for (final item in summary.metrics)
              SizedBox(
                width: 280,
                child: AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        item.value,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      Text(item.subtitle),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Guardrails operacionais',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              for (final notice in summary.notices) ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Icon(Icons.check_circle_outline, size: 18),
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(notice)),
                  ],
                ),
                const SizedBox(height: 10),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
