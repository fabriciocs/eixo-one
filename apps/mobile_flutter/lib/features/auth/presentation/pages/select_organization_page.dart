import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../design_system/components/app_card.dart';
import '../../../../design_system/components/empty_state.dart';
import '../../../../design_system/components/network_status_banner.dart';
import '../../../../design_system/components/primary_button.dart';
import '../controllers/auth_providers.dart';

class SelectOrganizationPage extends ConsumerWidget {
  const SelectOrganizationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authSessionProvider);

    if (session == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const EmptyState(
                title: 'Sessao nao encontrada',
                message:
                    'Faca login antes de escolher a organizacao que deseja acessar.',
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'Voltar para login',
                icon: Icons.arrow_back,
                onPressed: () => context.go('/login'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const NetworkStatusBanner(),
                Text(
                  'Selecionar organizacao',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Escolha o contexto de trabalho antes de entrar no dashboard. Isso ajuda a prevenir erro do usuario e acesso cruzado indevido.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                for (final organization in session.organizations) ...[
                  AppCard(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(
                        session.selectedOrganizationId == organization.id
                            ? Icons.radio_button_checked
                            : Icons.radio_button_unchecked,
                      ),
                      title: Text(organization.name),
                      subtitle: Text(organization.roleLabel),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        ref
                            .read(authSessionProvider.notifier)
                            .selectOrganization(organization.id);
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                PrimaryButton(
                  label: 'Continuar',
                  icon: Icons.arrow_forward,
                  onPressed: session.selectedOrganizationId == null
                      ? null
                      : () => context.go('/dashboard'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
