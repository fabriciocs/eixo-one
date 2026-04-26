import 'package:flutter/material.dart';

import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsivePage(
      title: 'Perfil',
      subtitle: 'Informacoes pessoais, sessao e preferencias.',
      child: ListView(
        children: const [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nome'),
                SizedBox(height: 8),
                Text('Usuario de demonstração'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
