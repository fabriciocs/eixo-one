# Especificacao tecnica frontend

## Modelos

- `BaseGovernanceSetting`
- `SettingScopeType`
- `SettingValueType`
- `UpdateBaseGovernanceSettingInput`
- `ResetBaseGovernanceSettingInput`

## Repositorio

- `listSettings`
- `updateSetting`
- `resetSetting`

## Comportamento

- Consumo da API quando `AppConfig.useGovernanceApi` estiver ativo.
- Fallback para repositório em memoria nos ambientes locais/teste.
- Controle de permissao via `AuthSession`.
