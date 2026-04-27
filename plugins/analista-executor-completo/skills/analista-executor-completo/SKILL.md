---
name: analista-executor-completo
description: Use esta skill quando o usuario pedir para analisar, especificar, documentar, implementar, testar, validar, versionar ou entregar uma funcionalidade de software de ponta a ponta. A skill transforma a solicitacao em documentos completos, codigo-fonte quando possivel, testes, evidencias e relatorio final.
---

# Analista Executor Completo

## Objetivo

Executar uma solicitacao de software do inicio ao fim, atuando como orquestrador unico com especialidades internas de produto, pesquisa, UX/UI, arquitetura, backend, frontend, QA, DevOps, Git, documentacao e revisao critica.

## Regras obrigatorias

1. Antes de alterar codigo, inspecione o projeto, branch atual e `git status`.
2. Preserve alteracoes existentes do usuario.
3. Crie branch `feature/<slug-da-task>` quando houver repositorio Git.
4. Pesquise fontes externas quando a tarefa depender de tecnologia, boas praticas, legislacao, APIs, UX, seguranca, QA ou informacoes atuais.
5. Crie documentacao em `/docs/entregas/[slug-da-task]/` ou adapte ao padrao real do projeto.
6. Separe fatos, premissas, inferencias, decisoes e pendencias.
7. Implemente codigo seguindo padroes existentes.
8. Crie ou atualize testes para requisitos criticos.
9. Execute lint, typecheck, testes e build quando existirem comandos disponiveis.
10. Nao exponha segredos, tokens ou dados sensiveis.
11. Nao execute deploy real nem acao destrutiva sem confirmacao explicita.
12. Registre evidencias, limitacoes e pendencias reais.
13. Faca commit e push apenas quando houver repositorio, remote, credencial e permissao.

## Fluxo obrigatorio

1. Preparacao e Git: definir slug, verificar status, criar branch e controle da entrega.
2. Entendimento: criar `01_entendimento_e_diagnostico.md`.
3. Pesquisa: criar `02_pesquisa_e_benchmark.md`.
4. Definicao funcional: criar `03_definicao_funcional.md`.
5. UX/UI: criar `04_especificacao_ux_ui.md`.
6. Backend: criar `05_especificacao_tecnica_backend.md` quando aplicavel.
7. Frontend: criar `06_especificacao_tecnica_frontend.md` quando aplicavel.
8. Arquitetura: criar `07_arquitetura_e_modelagem.md`.
9. Implementacao: criar `08_plano_de_implementacao.md` e implementar arquivos necessarios.
10. QA: criar `09_estrategia_qa_e_testes.md` e `10_matriz_de_rastreabilidade.md`.
11. Evidencias: criar `11_evidencias_de_validacao.md`.
12. Relatorio final: criar `12_relatorio_final.md`.

## Referencias internas

Leia quando necessario:

- `references/estrutura-documentos.md`
- `references/protocolo-git.md`
- `references/checklist-qa.md`
- `references/politica-seguranca.md`

## Saida no chat

Responda de forma curta com documentos gerados, codigo implementado, validacoes, Git e pendencias reais.
