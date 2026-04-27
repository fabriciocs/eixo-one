# Politica de seguranca

- Nunca gravar tokens, segredos ou credenciais no plugin, no repositorio ou em arquivos de exemplo.
- Usar variaveis de ambiente para autenticacao externa.
- Pedir confirmacao explicita antes de deploy, exclusao, reset, migracao destrutiva ou rotacao de segredo.
- Revisar `git status` e `git diff` antes de commit para evitar incluir arquivos indevidos.
- Registrar riscos, limitacoes e validacoes pendentes em `11_evidencias_de_validacao.md`.
- Se houver duvida sobre permissao, impacto ou seguranca, interromper a acao e explicar o bloqueio no chat e na documentacao.
