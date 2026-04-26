# Template de Novo Dominio

## Estrutura recomendada

```text
src/modules/<domain>
  /domain
    entity.ts
    state-machine.ts
  /application
    repository.ts
    service.ts
  /infrastructure
    firestore-<domain>.repository.ts
    in-memory-<domain>.repository.ts
  /interfaces/http
    <domain>.controller.ts
  /tests
    <domain>.test.ts
```

## Convencoes

- Nome do dominio em minusculo e singular.
- Entidades e DTOs com nomes explicitos: `UserEntity`, `ChangeUserStatusCommand`.
- Schemas compartilhados primeiro em `packages/shared_contracts`.
- Regras de transicao dentro de `domain`.
- Adaptadores de banco/SDK fora da camada de dominio.

## Checklist minimo

- Schema de entrada.
- Schema de saida.
- Error codes aplicaveis.
- Teste de fluxo feliz.
- Teste de erro de validacao.
- Teste de permissao.
- Teste de transicao invalida, quando houver estados.
- Documentacao curta no arquivo do dominio ou ADR, se houver impacto arquitetural.
