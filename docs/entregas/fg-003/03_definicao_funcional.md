# FG-003 - Definicao Funcional

## Objetivo do MVP
Permitir que administradores criem perfis, associem permissoes e atribuam esses perfis a usuarios via grant, com validacao server-side, rastreabilidade e UI administrativa utilizavel.

## Fluxos principais
1. Consultar catalogo de perfis.
2. Criar novo perfil com chave tecnica, nome, descricao, status, permissoes e escopo.
3. Editar perfil existente com controle de versao.
4. Consultar catalogo de permissoes.
5. Consultar eventos de auditoria relacionados a perfis e grants.
6. Editar grant de usuario, selecionando empresas, filiais, `roleKeys` e `permissionOverrides`.
7. Consumir rotas protegidas usando permissao derivada de role persistida, mesmo quando a claim do token nao contem a permissao final.

## Fluxos alternativos
- Usuario sem `roles.read`: recebe estado de acesso negado na UI e `403` no backend.
- Tentativa de salvar perfil com permissao desconhecida: recebe `VALIDATION_ERROR`.
- Tentativa de editar perfil com versao desatualizada: recebe `VERSION_CONFLICT`.
- Tentativa de autoelevacao via grant pelo proprio usuario nao-admin: bloqueada no backend.

## Regras de negocio
- Chave de role deve ser unica por tenant.
- Permissoes de role devem existir no catalogo conhecido.
- Roles inativas nao participam da resolucao de permissao efetiva.
- O grant do usuario pode conter `roleKeys` e `permissionOverrides`.
- O backend resolve permissao efetiva combinando claims, overrides e permissoes de roles persistidas.

## Criterios de aceite
- Dado um usuario administrador, quando ele cria um perfil valido, entao o perfil fica disponivel no catalogo e gera evento de auditoria.
- Dado um usuario com grant persistido contendo role com `roles.read`, quando ele chama `GET /v1/governance/roles`, entao a rota responde com sucesso mesmo sem a permissao na claim.
- Dado um payload com permissao inexistente, quando o backend recebe a criacao/edicao de role, entao a operacao eh recusada e nada eh gravado parcialmente.
- Dado um usuario sem permissao de leitura de roles, quando ele abre a tela de papeis, entao nao visualiza o catalogo e recebe mensagem clara de acesso negado.
- Dado um grant em edicao, quando o administrador seleciona roles e overrides, entao o preview de permissao efetiva eh atualizado na UI antes do salvamento.

## Incrementos recomendados para V2
- Exclusao logica de perfis com bloqueio por dependencias.
- Catalogo de centros de custo e filtros por centro de custo.
- Endpoint de feature flags e politicas versionadas por modulo.
- Rehidratacao global da sessao Flutter com permissao efetiva derivada de grants.
