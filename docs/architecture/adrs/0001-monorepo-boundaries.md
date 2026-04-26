# ADR 0001 - Shared Contracts + Modular API + Flutter desacoplado

## Status

Aceito.

## Contexto

O projeto precisava de uma base que evitasse mistura de UI com regra de negocio, drift entre contratos de API e clientes, e crescimento desorganizado do backend.

## Decisao

- Criar `packages/shared_contracts` como fonte versionada de contratos.
- Organizar a API por modulo e camadas (`domain`, `application`, `infrastructure`, `interfaces`).
- Manter o Flutter com paginas/componentes separados de servicos e repositores.
- Tratar operacoes criticas com idempotencia e auditoria desde a fundacao.

## Consequencias

- Mais arquivos na base inicial, mas evolucao mais previsivel.
- Validacoes e erros padronizados reaproveitaveis.
- Menos risco de regressao cross-tenant e de acoplamento entre UI e negocio.
