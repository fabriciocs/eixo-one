# FG-006 - Pesquisa e benchmark

## Referencias consideradas

- ERP Microsoft para comportamento esperado de migracao e extracao operacional.
- OWASP Input Validation, REST Security e Logging para allowlist, validacao server-side e trilha de auditoria.
- O padrao do proprio repositorio para endpoints Fastify, contratos Zod e telas Flutter administrativas.

## Decisoes derivadas

- Sanitizar saida de exportacao para reduzir risco de CSV injection.
- Validar novamente no backend tudo que o frontend pre-valida.
- Persistir jobs e resultados de preview para rastreabilidade e reexecucao.
