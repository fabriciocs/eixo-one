# Estrategia QA e testes

## Cobertura planejada

- Contratos:
  - payload valido de update de configuracao
- Backend:
  - listagem de settings
  - update versionado
  - reset para padrao
  - auditoria de configuracao
- Frontend:
  - renderizacao da tela
  - estado sem permissao

## Execucao real

- `npm.cmd --prefix packages/shared_contracts run build`: OK
- `npm.cmd --prefix backend/api_node run build`: OK
- `vitest`: bloqueado por `spawn EPERM` no sandbox
- `dart analyze` / `flutter test`: timeout no sandbox
