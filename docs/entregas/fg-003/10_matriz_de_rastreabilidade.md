# FG-003 - Matriz de Rastreabilidade

| Requisito | Implementacao | Evidencia automatizada | Status |
| --- | --- | --- | --- |
| Criar perfis | API `POST /v1/governance/roles` + editor Flutter | `base-governance.integration.test.ts`, `governance_pages_test.dart` | Concluido |
| Editar perfis | API `PATCH /v1/governance/roles/:roleId` + editor Flutter | `base-governance.service.test.ts`, `base-governance.integration.test.ts` | Concluido |
| Catalogo de permissoes | `permissionCatalog` backend + aba `Catalogo` no Flutter | `contracts.test.ts`, `governance_pages_test.dart` | Concluido |
| Validar permissao no backend | `authorizationMiddleware` com claims + grant + role persistida | `base-governance.integration.test.ts` | Concluido |
| Exibir/ocultar acoes conforme perfil | estados `forbidden` e `canManage` no Flutter | `governance_pages_test.dart` | Concluido no MVP |
| Associar permissoes por empresa/filial | role editor com `companyIds` e `establishmentIds` | validacao de tela + contratos | Concluido |
| Associar roles a usuario | `grants_page.dart` com `roleKeys`/`permissionOverrides` editaveis | `governance_pages_test.dart` | Concluido |
| Rastreabilidade/auditoria | `audit_logs` + `GET /v1/governance/audit-events` + `/audit` | `base-governance.integration.test.ts`, `governance_pages_test.dart` | Concluido |
| Menor privilegio | deny-by-default + calculo por role ativa | revisao de codigo + testes de permissao | Concluido |
| Centro de custo detalhado | campo livre `costCenterIds`, sem catalogo dedicado | sem teste dedicado | Parcial |
