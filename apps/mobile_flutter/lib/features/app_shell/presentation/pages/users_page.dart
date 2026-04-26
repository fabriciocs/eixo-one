import 'package:flutter/material.dart';

import '../../../../core/layout/responsive_page.dart';
import '../../../../design_system/components/app_card.dart';

class UsersPage extends StatelessWidget {
  const UsersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsivePage(
      title: 'Usuarios',
      subtitle: 'Base inicial para administracao de usuarios e acessos.',
      child: ListView.separated(
        itemCount: 3,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          return AppCard(
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                child: Text('${index + 1}'),
              ),
              title: Text('Usuario ${index + 1}'),
              subtitle: const Text('Perfil operacional'),
              trailing: const Icon(Icons.chevron_right),
            ),
          );
        },
      ),
    );
  }
}
