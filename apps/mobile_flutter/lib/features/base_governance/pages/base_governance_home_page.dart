import 'package:flutter/material.dart';

class BaseGovernanceHomePage extends StatelessWidget {
  const BaseGovernanceHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Base e Governança')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Funcionalidades FG-003 a FG-010', style: textTheme.headlineSmall),
          const SizedBox(height: 12),
          const _FeatureTile(
            title: 'Perfis e permissões',
            description: 'Controle RBAC/ABAC por módulo, ação, empresa, filial e centro de custo.',
          ),
          const _FeatureTile(
            title: 'Auditoria',
            description: 'Trilha de alterações protegida para ações sensíveis.',
          ),
          const _FeatureTile(
            title: 'Configurações gerais',
            description: 'Parâmetros globais e por módulo com versionamento.',
          ),
          const _FeatureTile(
            title: 'Importação e exportação',
            description: 'Jobs de CSV/XLSX/PDF com validação e prévia.',
          ),
          const _FeatureTile(
            title: 'Notificações',
            description: 'Templates, canais, preferências e consentimento.',
          ),
          const _FeatureTile(
            title: 'Integrações',
            description: 'APIs e webhooks com idempotência e monitoramento.',
          ),
          const _FeatureTile(
            title: 'Segurança, LGPD e privacidade',
            description: 'Consentimentos, retenção, direitos do titular e anonimização.',
          ),
          const _FeatureTile(
            title: 'Cadastro de clientes',
            description: 'PF/PJ, contatos, endereços, crédito e histórico.',
          ),
        ],
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.verified_user_outlined),
        title: Text(title),
        subtitle: Text(description),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
