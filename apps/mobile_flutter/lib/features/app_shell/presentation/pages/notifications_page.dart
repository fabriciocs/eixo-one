import 'package:flutter/material.dart';

import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/empty_state.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const ResponsivePage(
      title: 'Notificacoes',
      subtitle: 'Alertas operacionais e mensagens relevantes por usuario.',
      child: EmptyState(
        title: 'Nenhuma notificacao no momento',
        message: 'Quando houver eventos importantes, eles aparecerao aqui.',
      ),
    );
  }
}
