import 'package:flutter/material.dart';

import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/empty_state.dart';

class AuditPage extends StatelessWidget {
  const AuditPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const ResponsivePage(
      title: 'Auditoria',
      subtitle: 'Rastreabilidade das acoes criticas do sistema.',
      child: EmptyState(
        title: 'Auditoria pronta para integrar',
        message: 'Conecte a API Node.js e a colecao audit_logs para listar eventos.',
      ),
    );
  }
}
