# Recuperabilidade e Falhas

## Estrategia minima

- Operacoes criticas devem ser idempotentes.
- Integracoes externas devem usar retry com backoff e timeout.
- Leitura e escrita criticas precisam de auditoria.
- Backup/restore do Firestore deve ser tratado por rotina de ambiente gerenciado.

## Implementado na base

- `withRetry` para falhas temporarias.
- `withTimeout` para operacoes externas.
- Idempotencia com `x-idempotency-key`.
- Maquina de estados para impedir inconsistencias.

## Recomendacoes de producao

- Habilitar export recorrente de Firestore.
- Versionar regras e indices junto do codigo.
- Registrar procedimento de rollback por ambiente.
- Persistir idempotencia e auditoria em storage duravel.
