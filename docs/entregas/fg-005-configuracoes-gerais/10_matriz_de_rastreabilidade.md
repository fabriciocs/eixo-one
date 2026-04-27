# Matriz de rastreabilidade

| Requisito | Implementacao |
| --- | --- |
| Editar parametros | `updateSetting` backend + tela `/settings` |
| Preferencias por escopo | `scopeType`, `companyId`, `establishmentId` |
| Regras padrao por modulo | seeds com `moduleKey` e `defaultValue` |
| Restaurar padroes | endpoint `reset` + botao `Restaurar padrao` |
| Versionamento | `expectedVersion` + incremento de `version` |
| Permissoes restritas | `settings.read` e `settings.manage` |
| Auditoria | eventos `setting.created`, `setting.updated`, `setting.reset` |
