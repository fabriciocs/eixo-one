# Guia — Workflow para ler ZIP e Markdown da mensagem do último commit

Este arquivo acompanha o workflow `extract-source-zip-and-optional-bash-from-last-commit.yml`.

## Objetivo

O workflow lê a mensagem do último commit e identifica:

1. O primeiro arquivo ou caminho terminado em `.zip`, obrigatório.
2. O primeiro arquivo ou caminho terminado em `.md`, opcional.

Com isso, ele consegue validar e extrair um ZIP de código-fonte informado no commit e, se necessário, manter o comportamento anterior de extrair blocos `bash` de um Markdown.

## Exemplo de mensagem de commit

```text
feat: aplicar fg-008-integracoes-api-webhooks_codigo-fonte_atualizado.zip usando guia-criacao-branch-feature-fg-008-integracoes-api-webhooks.md
```

## Exemplo de comandos

```bash
git add fg-008-integracoes-api-webhooks_codigo-fonte_atualizado.zip
git add guia-criacao-branch-feature-fg-008-integracoes-api-webhooks.md
git commit -m "feat: aplicar fg-008-integracoes-api-webhooks_codigo-fonte_atualizado.zip usando guia-criacao-branch-feature-fg-008-integracoes-api-webhooks.md"
git push
```

## Inputs principais

- `dry_run`: por padrão `false`. Aplica o fluxo completo; ative `true` quando quiser apenas validar e listar tudo antes.
- `extract_destination`: destino da extração, relativo à raiz do repositório.
- `execute_bash_from_markdown`: por padrão `true`. Executa os blocos `bash` do Markdown quando um `.md` válido for detectado no commit.
- `commit_extracted_files`: por padrão `true`. Cria commit e push automaticamente quando houver alterações.
- `commit_message_prefix`: prefixo do commit automático.

## Segurança

Se quiser uma rodada de inspeção antes de aplicar mudanças, execute primeiro com `dry_run = true`.

O workflow valida:

- caminho do ZIP;
- caminho do Markdown;
- existência dos arquivos;
- integridade do ZIP;
- caminhos internos do ZIP para reduzir risco de Zip Slip;
- destino de extração relativo ao workspace.

Em cenários mais sensíveis, prefira uma primeira execução com `dry_run = true` para revisar o ZIP e os comandos antes da aplicação real. 
