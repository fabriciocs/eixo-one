import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/primary_button.dart';

class SelectOrganizationPage extends StatelessWidget {
  const SelectOrganizationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Selecionar organizacao',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Etapa pronta para usar memberships vindas do Firestore.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                const AppCard(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('EixoOne Demo'),
                    subtitle: Text('Organizacao padrao para desenvolvimento'),
                    trailing: Icon(Icons.chevron_right),
                  ),
                ),
                const SizedBox(height: 16),
                PrimaryButton(
                  label: 'Continuar',
                  icon: Icons.arrow_forward,
                  onPressed: () => context.go('/dashboard'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
