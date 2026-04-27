import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';
import '../../../governance/presentation/governance_routes.dart';

class ModulesPage extends StatelessWidget {
  const ModulesPage({super.key});

  static const _modules = <
      ({String title, String description, IconData icon, String? route})>[
    (
      title: 'Governanca',
      description: 'Multiempresa, grants, contexto e consolidacao.',
      icon: Icons.account_tree_outlined,
      route: GovernanceRoutes.overview,
    ),
    (
      title: 'CRM',
      description: 'Relacionamento e atendimento.',
      icon: Icons.support_agent_outlined,
      route: null,
    ),
    (title: 'Vendas', description: 'Pedidos, propostas e conversao.', icon: Icons.point_of_sale_outlined, route: null),
    (title: 'Estoque', description: 'Movimentacao, WMS e inventario.', icon: Icons.inventory_2_outlined, route: null),
    (title: 'Financeiro', description: 'Fluxo de caixa, contas e conciliacao.', icon: Icons.account_balance_wallet_outlined, route: null),
  ];

  @override
  Widget build(BuildContext context) {
    return ResponsivePage(
      title: 'Modulos',
      subtitle: 'Mapa inicial dos blocos funcionais do EixoOne.',
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 280,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.2,
        ),
        itemCount: _modules.length,
        itemBuilder: (context, index) {
          final item = _modules[index];

          return AppCard(
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: item.route == null ? null : () => context.go(item.route!),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(item.icon),
                  const SizedBox(height: 16),
                  Text(item.title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(item.description),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
