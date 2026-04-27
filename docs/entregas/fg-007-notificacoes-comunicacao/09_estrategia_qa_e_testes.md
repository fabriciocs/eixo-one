# FG-007 - Estrategia QA e testes

- Validado com:
  - `npm.cmd --prefix packages/shared_contracts run build`
  - `npm.cmd --prefix backend/api_node run build`
- Teste planejado:
  - integracao para criar template, enviar e retentar
- Bloqueios:
  - `vitest` falha no ambiente por `spawn EPERM`
  - `dart analyze` global excede timeout neste sandbox
