# Seguranca e Permissoes

## Principios

- Nunca exponha service account no Flutter.
- Use `Firebase Admin SDK` somente no backend.
- Valide `ID Token` em toda rota protegida.
- Nao confie em permissao somente no frontend.
- Aplique `tenantId` em cada leitura e escrita relevante.

## Implementado

- Claims esperadas: `tenantId`, `roleKeys`, `permissionKeys`, `moduleKeys`.
- Firestore Rules fechadas por default.
- Storage Rules exigindo `tenantId` e `uploadedBy` na metadata.
- `helmet`, `cors`, `rate-limit` e body limit na API.
- `AppError` + error envelope padronizado.

## Acoes sensiveis

Sempre via backend:

- mudanca de estado;
- atualizacao de permissao;
- integracoes externas;
- acoes auditaveis;
- operacoes com idempotencia.
