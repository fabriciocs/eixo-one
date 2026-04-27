import type { BaseGovernanceRole, PermissionCatalogEntry } from '@eixoone/shared-contracts';

export const BASE_GOVERNANCE_PERMISSIONS = {
  rolesRead: 'roles.read',
  rolesManage: 'roles.manage',
  settingsRead: 'settings.read',
  settingsManage: 'settings.manage',
  auditRead: 'audit.read',
} as const;

export const permissionCatalog: PermissionCatalogEntry[] = [
  {
    key: 'users.read',
    label: 'Listar usuarios',
    description: 'Consulta usuarios do tenant e seus estados operacionais.',
    moduleKey: 'users',
    actionKey: 'read',
    scopeTypes: ['TENANT'],
  },
  {
    key: 'users.manage',
    label: 'Gerenciar usuarios',
    description: 'Ativa, suspende e arquiva usuarios com trilha de auditoria.',
    moduleKey: 'users',
    actionKey: 'manage',
    scopeTypes: ['TENANT'],
  },
  {
    key: 'roles.read',
    label: 'Listar perfis',
    description: 'Consulta o catalogo administravel de perfis e permissoes.',
    moduleKey: 'roles',
    actionKey: 'read',
    scopeTypes: ['TENANT'],
  },
  {
    key: 'roles.manage',
    label: 'Gerenciar perfis',
    description: 'Cria, edita e desativa perfis administraveis por tenant.',
    moduleKey: 'roles',
    actionKey: 'manage',
    scopeTypes: ['TENANT'],
  },
  {
    key: 'settings.read',
    label: 'Consultar configuracoes',
    description: 'Lista parametros versionados por modulo, empresa e filial.',
    moduleKey: 'settings',
    actionKey: 'read',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'settings.manage',
    label: 'Gerenciar configuracoes',
    description:
      'Atualiza parametros sensiveis, reverte para padrao e registra auditoria.',
    moduleKey: 'settings',
    actionKey: 'manage',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'audit.read',
    label: 'Consultar auditoria',
    description: 'Lê eventos auditaveis por entidade, usuario e correlacao.',
    moduleKey: 'audit',
    actionKey: 'read',
    scopeTypes: ['TENANT'],
  },
  {
    key: 'governance.company.read',
    label: 'Consultar empresas',
    description: 'Lista e detalha empresas do escopo autorizado.',
    moduleKey: 'governance',
    actionKey: 'read',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.company.create',
    label: 'Criar empresas',
    description: 'Cria novas empresas com validacoes e idempotencia.',
    moduleKey: 'governance',
    actionKey: 'create',
    scopeTypes: ['TENANT'],
  },
  {
    key: 'governance.company.update',
    label: 'Editar empresas',
    description: 'Atualiza dados de empresas respeitando versao e auditoria.',
    moduleKey: 'governance',
    actionKey: 'update',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.company.activate',
    label: 'Ativar empresas',
    description: 'Executa transicoes de ativacao de empresas.',
    moduleKey: 'governance',
    actionKey: 'activate',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.company.inactivate',
    label: 'Inativar empresas',
    description: 'Executa transicoes de inativacao de empresas.',
    moduleKey: 'governance',
    actionKey: 'inactivate',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.company.archive',
    label: 'Arquivar empresas',
    description: 'Arquiva empresas bloqueando operacoes sensiveis.',
    moduleKey: 'governance',
    actionKey: 'archive',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.establishment.read',
    label: 'Consultar estabelecimentos',
    description: 'Lista e detalha matriz e filiais do escopo autorizado.',
    moduleKey: 'governance',
    actionKey: 'read',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'governance.establishment.create',
    label: 'Criar estabelecimentos',
    description: 'Cria estabelecimentos vinculados a empresas autorizadas.',
    moduleKey: 'governance',
    actionKey: 'create',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.establishment.update',
    label: 'Editar estabelecimentos',
    description: 'Atualiza estabelecimentos com versao e regras de negocio.',
    moduleKey: 'governance',
    actionKey: 'update',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'governance.establishment.activate',
    label: 'Ativar estabelecimentos',
    description: 'Ativa matriz ou filial respeitando integridade do cadastro.',
    moduleKey: 'governance',
    actionKey: 'activate',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'governance.establishment.inactivate',
    label: 'Inativar estabelecimentos',
    description: 'Inativa matriz ou filial respeitando grants vigentes.',
    moduleKey: 'governance',
    actionKey: 'inactivate',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'governance.establishment.archive',
    label: 'Arquivar estabelecimentos',
    description: 'Arquiva estabelecimentos bloqueando o uso operacional.',
    moduleKey: 'governance',
    actionKey: 'archive',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'governance.user_scope.manage',
    label: 'Gerenciar grants',
    description: 'Define escopos, papeis e sobrescritas de permissao por usuario.',
    moduleKey: 'governance',
    actionKey: 'manage_scope',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'governance.context.switch',
    label: 'Trocar contexto',
    description: 'Alterna empresa e filial ativas para escrita e leitura.',
    moduleKey: 'governance',
    actionKey: 'switch_context',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
  {
    key: 'governance.sharing.policy.manage',
    label: 'Gerenciar compartilhamento',
    description: 'Configura politicas explicitas de compartilhamento entre empresas.',
    moduleKey: 'governance',
    actionKey: 'manage_sharing',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.consolidation.read',
    label: 'Consultar consolidacao',
    description: 'Lista e detalha execucoes formais de consolidacao.',
    moduleKey: 'governance',
    actionKey: 'read_consolidation',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.consolidation.run',
    label: 'Criar consolidacao',
    description: 'Dispara novas execucoes de consolidacao multiempresa.',
    moduleKey: 'governance',
    actionKey: 'run_consolidation',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'governance.consolidation.reprocess',
    label: 'Reprocessar consolidacao',
    description: 'Reagenda runs bloqueadas ou com divergencia.',
    moduleKey: 'governance',
    actionKey: 'reprocess_consolidation',
    scopeTypes: ['TENANT', 'COMPANY'],
  },
  {
    key: 'reporting.consolidated.read',
    label: 'Ler visao consolidada',
    description: 'Consulta indicadores consolidados do escopo selecionado.',
    moduleKey: 'reporting',
    actionKey: 'read_consolidated',
    scopeTypes: ['TENANT', 'COMPANY', 'ESTABLISHMENT'],
  },
];

const permissionCatalogMap = new Map(
  permissionCatalog.map((permission) => [permission.key, permission]),
);

export function isKnownPermissionKey(permissionKey: string) {
  return permissionCatalogMap.has(permissionKey);
}

export function buildEffectivePermissionKeys(input: {
  claimPermissionKeys: string[];
  grantPermissionOverrides?: string[];
  roles?: BaseGovernanceRole[];
}) {
  const effective = new Set(input.claimPermissionKeys);

  for (const permissionKey of input.grantPermissionOverrides ?? []) {
    effective.add(permissionKey);
  }

  for (const role of input.roles ?? []) {
    if (role.status !== 'active') {
      continue;
    }

    for (const permissionKey of role.permissionKeys) {
      effective.add(permissionKey);
    }
  }

  return effective;
}
