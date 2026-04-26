import 'package:flutter/material.dart';

import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/empty_state.dart';

class RolesPage extends StatelessWidget {
  const RolesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const ResponsivePage(
      title: 'Papeis e permissoes',
      subtitle: 'Controle de acesso por organizacao, modulo e escopo.',
      child: EmptyState(
        title: 'Papeis ainda nao cadastrados',
        message: 'A API podera gerir roles, permissions e custom claims daqui.',
      ),
    );
  }
}
