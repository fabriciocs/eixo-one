# Especificacao tecnica backend

## Endpoints

- `GET /v1/governance/settings`
- `PUT /v1/governance/settings/:settingKey`
- `POST /v1/governance/settings/:settingKey/reset`

## Permissoes

- Leitura: `settings.read`
- Gestao: `settings.manage`

## Persistencia

- Repositorio em memoria com seeds de configuracao.
- Repositorio Firestore usando documento composto por tenant/chave/escopo.

## Validacoes

- `settingKey` em allowlist interna.
- `scopeType` coerente com a definicao da configuracao.
- `companyId` obrigatorio para `COMPANY` e `ESTABLISHMENT`.
- `establishmentId` obrigatorio para `ESTABLISHMENT`.
- `value` validado por `valueType`.
- `expectedVersion` obrigatorio para update/reset.
