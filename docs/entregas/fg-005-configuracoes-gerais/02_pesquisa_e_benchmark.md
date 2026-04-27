# Pesquisa e benchmark

## Fontes utilizadas

- Pesquisa aplicada registrada na planilha da funcionalidade.
- Referencias de ERP e OWASP ja consolidadas na planilha:
  - ERP Microsoft
  - OWASP Input Validation
  - OWASP Authorization
  - OWASP REST Security
  - OWASP Logging

## Sintese

- Parametros administrativos devem ser centralizados, versionados e reversiveis.
- Configuracoes sensiveis precisam de RBAC forte e mascaramento em trilhas de auditoria.
- O menor fluxo utilizavel combina:
  - listagem paginada
  - atualizacao versionada
  - reset ao padrao
  - filtros por escopo/modulo
  - auditoria append-only
