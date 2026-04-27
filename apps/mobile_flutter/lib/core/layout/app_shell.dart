import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design_system/tokens/app_breakpoints.dart';
import '../../features/auth/presentation/controllers/auth_providers.dart';

class AppShell extends ConsumerWidget {
  const AppShell({
    super.key,
    required this.child,
  });

  final Widget child;

  static const _destinations = <_NavDestination>[
    _NavDestination('Dashboard', '/dashboard', Icons.dashboard_outlined, Icons.dashboard),
    _NavDestination(
      'Governanca',
      '/governance',
      Icons.account_tree_outlined,
      Icons.account_tree,
    ),
    _NavDestination('Modulos', '/modules', Icons.grid_view_outlined, Icons.grid_view),
    _NavDestination('Usuarios', '/users', Icons.group_outlined, Icons.group),
    _NavDestination('Papeis', '/roles', Icons.verified_user_outlined, Icons.verified_user),
    _NavDestination('Notificacoes', '/notifications', Icons.notifications_outlined, Icons.notifications),
    _NavDestination('Perfil', '/profile', Icons.person_outline, Icons.person),
    _NavDestination('Configuracoes', '/settings', Icons.settings_outlined, Icons.settings),
    _NavDestination('Auditoria', '/audit', Icons.fact_check_outlined, Icons.fact_check),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final session = ref.watch(authSessionProvider);
    final selectedIndex = _destinations.indexWhere(
      (destination) => location.startsWith(destination.route),
    );

    final width = MediaQuery.sizeOf(context).width;
    final isCompact = width < AppBreakpoints.tablet;
    final railExtended = width >= AppBreakpoints.desktop;

    return Scaffold(
      appBar: isCompact ? AppBar(title: const Text('EixoOne')) : null,
      drawer: isCompact ? Drawer(child: _MobileNavigation(currentRoute: location)) : null,
      body: Row(
        children: [
          if (!isCompact)
            NavigationRail(
              extended: railExtended,
              selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
              onDestinationSelected: (index) => context.go(_destinations[index].route),
              leading: Padding(
                padding: const EdgeInsets.fromLTRB(12, 16, 12, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'EixoOne',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      session?.selectedOrganization?.name ?? 'Sem organizacao',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              destinations: [
                for (final destination in _destinations)
                  NavigationRailDestination(
                    icon: Icon(destination.icon),
                    selectedIcon: Icon(destination.selectedIcon),
                    label: Text(destination.label),
                  ),
              ],
            ),
          if (!isCompact) const VerticalDivider(width: 1),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _MobileNavigation extends StatelessWidget {
  const _MobileNavigation({
    required this.currentRoute,
  });

  final String currentRoute;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              'EixoOne',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          for (final destination in AppShell._destinations)
            ListTile(
              selected: currentRoute.startsWith(destination.route),
              leading: Icon(destination.icon),
              title: Text(destination.label),
              onTap: () {
                Navigator.of(context).pop();
                context.go(destination.route);
              },
            ),
        ],
      ),
    );
  }
}

class _NavDestination {
  const _NavDestination(
    this.label,
    this.route,
    this.icon,
    this.selectedIcon,
  );

  final String label;
  final String route;
  final IconData icon;
  final IconData selectedIcon;
}
