# FG-003 - Pesquisa e Benchmark

## Fontes primarias consultadas
- OWASP Authorization Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- OWASP Input Validation Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html>
- OWASP Logging Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html>
- OWASP API1:2019 Broken Object Level Authorization: <https://owasp.org/API-Security/editions/2019/en/0xa1-broken-object-level-authorization/>
- OWASP API3:2023 Broken Object Property Level Authorization: <https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/>
- Firebase Authentication - Custom Claims: <https://firebase.google.com/docs/auth/admin/custom-claims>
- Firebase Security Rules and Authentication: <https://firebase.google.com/docs/rules/rules-and-auth>
- Flutter Material component widgets: <https://docs.flutter.dev/ui/widgets/material>
- Flutter text input cookbook: <https://docs.flutter.dev/cookbook/forms/text-input>
- Flutter `FilterChip`: <https://api.flutter.dev/flutter/material/FilterChip-class.html>
- Flutter `TabBar`: <https://api.flutter.dev/flutter/material/TabBar/TabBar.html>
- Flutter accessibility: <https://docs.flutter.dev/ui/accessibility>
- Flutter accessibility testing: <https://docs.flutter.dev/ui/accessibility/accessibility-testing>

## Principais achados
- OWASP recomenda `deny by default`, validacao de permissao em toda requisicao e preferencia por ABAC/ReBAC quando RBAC isolado nao cobre granularidade de objeto e contexto.
- OWASP API1 e API3 reforcam que endpoints que recebem IDs ou aceitam mutacao de propriedades precisam verificar autorizacao por objeto e por propriedade, nao apenas autenticacao.
- OWASP Input Validation reforca a combinacao correta: validacao client-side para UX e server-side para seguranca.
- OWASP Logging recomenda registrar eventos de seguranca, padronizar atributos correlacionaveis e mascarar tokens, segredos e PII nos logs.
- Firebase recomenda usar custom claims apenas para controle de acesso, validar o ID token no backend e evitar payloads grandes em claims.
- Firebase Rules expõem `auth.uid`, `auth.token` e custom claims, o que sustenta a estrategia de rules para leitura controlada em `roles` e `audit_logs`.
- Flutter Material 3 oferece `Card`, `TabBar`, `TextField` e `FilterChip` como primitives adequadas para uma tela administrativa responsiva; Flutter tambem recomenda testes de acessibilidade para contraste, tamanho de alvo e rotulacao.

## Aplicacao pratica no FG-003
- A autorizacao principal ficou no backend, com enriquecimento por grant persistido.
- O frontend passou a ocultar/limitar acoes de edicao conforme permissao efetiva calculada localmente e sempre trata erro do backend como fonte de verdade.
- O catalogo de permissao e o editor de grants adotam `FilterChip`, `TabBar`, `TextField`, `Card` e mensagens de erro inline.
- O modelo de auditoria evita gravar segredos e concentra `actorUserId`, `entityType`, `entityId`, `action`, `correlationId`, `requestId`, `before` e `after`.

## Decisoes decorrentes da pesquisa
- Nao usar custom claims para armazenar toda a matriz de escopo; claims ficaram como resumo de identidade e grants persistidos complementam a autorizacao.
- Manter as verificacoes por rota no backend e ampliar com lookup de role/grant.
- Tratar owner-level e property-level authorization completa como incremento posterior, documentado em pendencias.
