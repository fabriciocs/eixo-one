# FG-003 - Controle da Entrega

## Identificacao
- Item: `FG-003`
- Titulo: `Perfis e permissões`
- Modulo: `Base e Governança`
- Branch de trabalho: `feature/fg-003-perfis-permissoes`
- Data de consolidacao: `2026-04-27`
- Fonte funcional: `C:\Users\Fabricio.Cunha\Downloads\funcionalidades_sistemas_gestao_requisitos_com_prompts_codex_fullstack.xlsx`

## Status da entrega
- Backend Node.js: `concluido`
- Contratos compartilhados: `concluido`
- Frontend Flutter: `concluido no MVP`
- Seeds e emulator flow: `concluido no codigo`
- Documentacao: `concluida`
- Validacao automatizada: `concluida com 1 bloqueio externo`

## Escopo entregue
- CRUD administrativo de perfis via API e UI.
- Catalogo de permissoes por modulo/acao/escopo.
- Auditoria de criacao e atualizacao de perfis.
- Resolucao de permissao efetiva no backend a partir de grant persistido e roles persistidas.
- Edicao de `roleKeys` e `permissionOverrides` no fluxo de grants.
- Seeds de roles e auditoria para o fluxo Firebase/emulator.

## Fora do MVP
- Exclusao logica de perfis.
- Catalogo dedicado de centros de custo.
- Politicas owner-based por registro de dominio fora de governanca.
- Sincronizacao automatica de claims Firebase apos cada alteracao de grant.
- Endpoint de `feature-flags` sugerido no prompt generico.

## Limitacoes registradas
- O menu global do app continua visivel por rota; o bloqueio principal ocorre na tela e no backend.
- O teste `npm run test:emulators:rules` depende do Firestore emulator ativo e falhou por indisponibilidade local (`127.0.0.1:8088`).
- O app Flutter calcula permissao efetiva de forma local nas telas de papeis/grants; a sessao global ainda nao eh reidratada com todas as permissoes derivadas de roles persistidas.
