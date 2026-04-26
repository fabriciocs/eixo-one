import 'package:flutter/material.dart';

import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsivePage(
      title: 'Configuracoes',
      subtitle: 'Parametros da organizacao e preferencias do sistema.',
      child: ListView(
        children: const [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Ambiente'),
                SizedBox(height: 8),
                Text('Desenvolvimento local'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
