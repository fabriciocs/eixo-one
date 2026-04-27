# FG-003 - Entendimento e Diagnostico

## Problema de negocio
- A organizacao precisa separar responsabilidades operacionais e administrativas.
- O sistema deve impedir acesso horizontal e vertical indevido entre tenant, empresa, filial e, futuramente, centro de custo.
- A autorizacao nao pode depender apenas do frontend nem apenas de claims estaticas.

## Fatos observados no repositorio
- Ja existia um modulo de governanca multiempresa com grants persistidos por usuario.
- Ja existia um modulo `base-governance` em construcao, com placeholders para perfis e auditoria.
- O backend validava a maioria das rotas com `permissionKeys` vindas do token.
- O grant do usuario ja persistia `roleKeys` e `permissionOverrides`, mas isso nao alterava a autorizacao global do backend.
- No Flutter, `roles_page.dart` e `audit_page.dart` ainda eram apenas `EmptyState`.
- O `grants_page.dart` mostrava `roleKeys` e `permissionOverrides`, mas sem permitir edicao.

## Diagnostico principal
- Havia desalinhamento entre:
  - identidade autenticada por claims;
  - autorizacao efetiva persistida em grants;
  - experiencia administrativa no frontend.
- Sem integrar roles persistidas ao middleware, o cadastro de perfis seria apenas cosmetico.
- Sem UI para atribuicao de roles a usuarios, o fluxo de negocio do FG-003 ficaria incompleto.

## Premissas adotadas
- O MVP deveria priorizar RBAC com pontos de ABAC por escopo (`tenant`, empresa, filial e centro de custo parametrico).
- O backend permaneceria como fonte de verdade da autorizacao.
- A colecao raiz `roles` e a colecao raiz `audit_logs` seriam adequadas para o modulo base-governance no modo Firestore.

## Inferencias
- A navegacao global pode permanecer simples no MVP desde que as telas mostrem estado de acesso negado e o backend responda corretamente com `403`.
- O fluxo mais valioso de ponta a ponta para este ciclo eh: criar role -> atribuir role no grant -> consumir rota protegida -> auditar.
