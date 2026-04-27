# Guia - Workflow para ler ZIP e Markdown do ultimo commit

Este arquivo acompanha o workflow `run-bash-from-last-commit-md.yml`.

## Objetivo

O workflow detecta arquivos alterados em `docs/actions-exec/` no ultimo commit e identifica:

1. O primeiro arquivo ou caminho terminado em `.zip`, opcional.
2. O primeiro arquivo ou caminho terminado em `.md`, opcional.

Com isso, ele consegue validar e extrair um ZIP de codigo-fonte e, quando houver comandos reais a executar, extrair blocos `bash` do Markdown correspondente.

## Exemplo de arquivos no commit

```bash
docs/actions-exec/fg-008-integracoes-api-webhooks.zip
docs/actions-exec/feature-fg-008-integracoes-api-webhooks.md
```

## Exemplo de comandos

Use `<!-- actions-exec:run -->` imediatamente antes de um bloco `bash` quando voce quiser que o workflow execute aquele bloco. Sem esse marcador, o bloco continua sendo apenas exemplo em Markdown.
  
```bash
git add docs/actions-exec/fg-008-integracoes-api-webhooks.zip
git add docs/actions-exec/feature-fg-008-integracoes-api-webhooks.md
git commit -m "feat: aplicar docs/actions-exec/fg-008-integracoes-api-webhooks.zip usando docs/actions-exec/feature-fg-008-integracoes-api-webhooks.md"
git push
```

## Inputs principais

- `dry_run`: por padrao `false`. Aplica o fluxo completo; ative `true` quando quiser apenas validar e listar tudo antes.
- `extract_destination`: destino da extracao, relativo a raiz do repositorio.
- `execute_bash_from_markdown`: por padrao `true`. Executa os blocos `bash` do Markdown quando um `.md` valido for detectado no commit.
- `commit_extracted_files`: por padrao `true`. Cria commit e push automaticamente quando houver alteracoes.
- `commit_message_prefix`: prefixo do commit automatico.

## Seguranca

Se quiser uma rodada de inspecao antes de aplicar mudancas, execute primeiro com `dry_run = true`.

O workflow valida:

- caminho do ZIP;
- caminho do Markdown;
- existencia dos arquivos;
- integridade do ZIP;
- caminhos internos do ZIP para reduzir risco de Zip Slip;
- destino de extracao relativo ao workspace.

Em cenarios mais sensiveis, prefira uma primeira execucao com `dry_run = true` para revisar o ZIP e os comandos antes da aplicacao real.
