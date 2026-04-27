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

- `dry_run`: por padrão `true`. Valida e lista tudo, mas não extrai nem executa comandos.
- `extract_destination`: destino da extração, relativo à raiz do repositório.
- `execute_bash_from_markdown`: por padrão `false`. Executa blocos `bash` do Markdown somente quando ativado.
- `commit_extracted_files`: por padrão `false`. Cria commit e push somente quando ativado.
- `commit_message_prefix`: prefixo do commit automático.

## Segurança

Use primeiro com `dry_run = true`.

O workflow valida:

- caminho do ZIP;
- caminho do Markdown;
- existência dos arquivos;
- integridade do ZIP;
- caminhos internos do ZIP para reduzir risco de Zip Slip;
- destino de extração relativo ao workspace.

Por segurança, blocos `bash` do Markdown não são executados por padrão.
