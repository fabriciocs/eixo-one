import 'package:flutter/material.dart';

import '../../../../core/firebase/firebase_bootstrap.dart';
import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/status_badge.dart';
import '../../../../design_system/tokens/app_colors.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({
    super.key,
    required this.firebaseState,
  });

  final FirebaseBootstrapState firebaseState;

  static const _metrics = <({String title, String value, String subtitle})>[
    (title: 'Vendas do dia', value: 'R\$ 24.500', subtitle: 'Atualizacao em tempo real quando o Firestore estiver ativo'),
    (title: 'Pedidos em aberto', value: '18', subtitle: 'Fila operacional para acompanhamento'),
    (title: 'Alertas', value: '5', subtitle: 'Pendencias que pedem atencao do time'),
  ];

  @override
  Widget build(BuildContext context) {
    return ResponsivePage(
      title: 'Dashboard',
      subtitle: 'Base inicial responsiva para a operacao do EixoOne.',
      actions: [
        StatusBadge(
          label: firebaseState.isConfigured ? 'Firebase configurado' : 'Firebase pendente',
          color: firebaseState.isConfigured ? AppColors.success : AppColors.warning,
        ),
      ],
      child: ListView(
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
              ],
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              for (final item in _metrics)
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
        ],
      ),
    );
  }
}
