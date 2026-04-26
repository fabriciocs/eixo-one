# Observabilidade e Troubleshooting

## Base implementada

- Logs estruturados em JSON via Fastify/Pino.
- `correlationId` e `requestId` em respostas e logs.
- Campos adicionais quando disponiveis: `userId` e `tenantId`.
- Endpoints `/health` e `/ready`.
- Eventos de auditoria padronizados em `shared_contracts`.

## O que observar

- `statusCode`
- `latencyMs`
- `correlationId`
- `requestId`
- `userId`
- `tenantId`

## Troubleshooting rapido

### API sobe, mas `/ready` fica degradado

- Verifique `DATA_MODE`.
- Se `firebase`, confirme emuladores ou credenciais.

### Erro `UNAUTHENTICATED`

- Confirme header `Authorization: Bearer <idToken>`.
- Valide se o token carrega `tenantId`.

### Erro `CONFLICT` ou `INVALID_STATE_TRANSITION`

- Recarregue a entidade para obter `version` atual.
- Verifique se a transicao respeita a maquina de estados.

### Resposta duplicada em operacao critica

- Verifique `x-idempotency-key`.
- Se a chave repetida tiver payload diferente, a API deve retornar conflito.
