# FG-012 — QA e Relatório: Cadastro de produtos

## Estratégia de testes
Cobrir validações críticas, isolamento multi-tenant, autorização, concorrência, auditoria, duplicidade, bloqueios por dependência, UI mobile-first e estados de interface.

## Rastreabilidade
| Requisito | Teste |
|---|---|
| SKU único | unitário + integração POST |
| GTIN válido | unitário |
| Preços >= 0 | unitário + formulário |
| Unidade não alterável com movimento | unitário regra de negócio |
| Bloquear exclusão com saldo | integração DELETE |
| Auditoria em mudança crítica | integração PATCH |
| Usuário sem permissão | integração 403 + frontend |
| Lista paginada/filtrável | integração GET + frontend |
| Estados loading/empty/error | frontend |
| Sem vazamento entre tenants | integração |

## Casos de teste automatizados
1. Cria produto válido.
2. Rejeita payload com campo inesperado.
3. Rejeita SKU duplicado no mesmo tenant/empresa/filial.
4. Permite mesmo SKU em tenant diferente quando regra permitir.
5. Rejeita GTIN inválido.
6. Rejeita preço negativo.
7. Bloqueia alteração de unidade base com movimentação.
8. Bloqueia exclusão com saldo.
9. Gera auditoria ao alterar preço, fiscal, status e kit.
10. Retorna 403 para usuário sem escopo.
11. Frontend mostra erro inline por campo.
12. Frontend mostra empty state com CTA.
13. Frontend mantém dados após erro recuperável.
14. Conflito de versão direciona para revisão.

## Evidências esperadas
- Resultado de `npm test`.
- Resultado de `npm run lint`.
- Resultado de `npm run typecheck`, se existir no repositório.
- Screenshot ou gravação dos estados principais em QA manual.
- Registro do commit e branch.

## Testes exploratórios
- Navegação por teclado.
- Leitor de tela nos campos e erros.
- Layout mobile em 360px.
- Layout desktop com tabela.
- Busca com acentos, case e caracteres especiais.
- Upload de imagem inválida.
- Operação sem internet durante preenchimento.
- Troca de tenant/filial durante sessão.

## Limitações desta entrega
- Não houve acesso a um repositório real, portanto os arquivos foram gerados como implementação base/portável.
- Não foi possível executar git, build ou testes reais do projeto final.
- A stack foi assumida como TypeScript/Node/Nest-like no backend e React no frontend, conforme entrega anterior e prompt fullstack.
- Integrações fiscais oficiais não foram implementadas.

## Validações realizadas
- Leitura das duas planilhas enviadas.
- Localização da FG-012 no catálogo funcional.
- Uso das regras UX/UI transversais da planilha EixoOne.
- Geração de Markdown operacional.
- Geração de ZIP com `codigo-fonte/`, sem dependências e sem segredos.

## Entregas Git previstas
```bash
git status
git checkout -b feature/fg-012-cadastro-produtos
git add docs/actions-exec/fg-012-cadastro-produtos.md docs/actions-exec/fg-012-cadastro-produtos.zip
git commit -m "feat: entrega FG-012 cadastro de produtos"
git push origin feature/fg-012-cadastro-produtos
```
