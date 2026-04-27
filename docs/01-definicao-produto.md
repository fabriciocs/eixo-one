# FG-012 — Definição e Produto: Cadastro de produtos

## Objetivo
Implementar o cadastro mestre de produtos para definir SKUs, códigos de barras, categorias, unidades, preços, tributação, custo, estoque mínimo, lote, validade, imagens, status e produtos compostos/kits.

## Contexto
A funcionalidade pertence ao módulo Cadastros Mestres e tem prioridade Alta e complexidade Alta. Produtos corretos sustentam vendas, compras, estoque, fiscal, produção, margem e relatórios.

## Problema
Sem cadastro confiável de produto, a operação fica sujeita a venda ou compra com item incorreto, divergência fiscal, saldo de estoque inconsistente, erro de margem, duplicidade de SKU/GTIN e baixa rastreabilidade.

## Escopo MVP
- Lista pesquisável e paginada de produtos.
- Criação, edição, detalhe e soft delete controlado.
- Cadastro de SKU, GTIN/código de barras, descrição, categoria, unidade de medida, preço de custo, preço de venda, NCM, CEST, origem, estoque mínimo, controle de lote/série/validade, imagens e status.
- Produto composto/kit com componentes.
- Histórico de preços.
- Auditoria em alterações críticas.
- Validação client-side para UX e validação server-side como fonte de verdade.
- Isolamento por tenant, empresa e filial.

## Fora do MVP
- Integração fiscal automática com fontes oficiais.
- Motor completo de precificação/promos.
- Sincronização com marketplaces.
- Impressão de etiqueta.
- Leitura real de câmera/scanner no navegador, ficando previsto input compatível com scanner.

## Perfis e permissões
- Administrador: criar, editar, inativar, visualizar auditoria.
- Compras/Estoque: criar e editar dados operacionais conforme escopo.
- Fiscal: editar NCM, CEST e origem.
- Vendas: consultar e editar preço de venda quando autorizado.
- Auditor: visualizar detalhes e trilha, sem alterar.

## Regras de negócio
- SKU deve ser único por tenant, empresa e filial quando aplicável.
- GTIN deve ser válido quando informado.
- Nome obrigatório entre 2 e 150 caracteres.
- Código/SKU entre 2 e 30 caracteres, sem HTML/script.
- Preço de custo e preço de venda devem ser maiores ou iguais a zero.
- Unidade base não pode ser alterada após movimentações de estoque.
- Exclusão é bloqueada quando houver saldo, movimentação, venda, compra ou vínculo fiscal relevante.
- Status respeita máquina de estados: rascunho, ativo, inativo, bloqueado.
- Mudanças de preço, fiscal, unidade base, kit e status geram auditoria com before/after/diff.
- Campos inesperados no payload são rejeitados.
- Dados são normalizados antes da validação.

## Fluxo principal
1. Usuário acessa Cadastros Mestres > Produtos.
2. Sistema carrega contexto ativo, permissões, filtros persistidos e lista paginada.
3. Usuário pesquisa produto ou aciona Novo produto.
4. Formulário por seções coleta dados principais, fiscais, estoque, preços, imagens e kit.
5. Validações inline orientam correção sem bloquear navegação indevidamente.
6. Usuário revisa e salva.
7. Backend valida, autoriza, persiste em transação, registra auditoria e retorna detalhe.
8. Interface mostra snackbar/banner, atualiza lista e direciona para página de detalhe.

## Estados
- Loading com skeleton.
- Empty state com CTA "Cadastrar produto".
- Erro recuperável com retry.
- Sem permissão com explicação e rota de retorno.
- Conflito por versão/etag com página de revisão.
- Sucesso com snackbar.
- Offline/instável com banner e prevenção de perda de formulário.

## Critérios de aceite
- Usuário autorizado cria produto com SKU único e campos obrigatórios válidos.
- Produto duplicado por SKU ou GTIN bloqueia gravação com erro claro por campo.
- Usuário sem permissão não vê ações indevidas e recebe 403 no backend.
- Unidade base não é alterada após movimentação.
- Exclusão com saldo ou dependência é bloqueada.
- Mudança crítica gera auditoria.
- Listagem é paginada, filtrável e performática.
- Layout é mobile-first, acessível e não usa modais em fluxo principal.
- Dados não vazam entre tenants, empresas ou filiais.

## Riscos
- Cadastro fiscal incorreto.
- Duplicidade de produtos.
- Alteração indevida de preço/custo.
- Falha de isolamento multi-tenant.
- Relatórios e estoque inconsistentes por alteração sem auditoria.

## Pendências para validação humana
- Fonte oficial e política de atualização de NCM/CEST.
- Regras fiscais por regime tributário.
- Política de retenção para imagens e histórico.
- Permissões finais por perfil real.
- Stack real do repositório e ORM/banco definitivo.
