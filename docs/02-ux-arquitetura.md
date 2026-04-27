# FG-012 — UX e Arquitetura: Cadastro de produtos

## Experiência UX/UI
A experiência deve ser mobile-first, Material Design 3, orientada a páginas e sem modais para fluxos principais. O objetivo é permitir cadastro rápido, seguro e rastreável de produtos, reduzindo erro operacional e retrabalho.

## Jornada do usuário
### Antes
O usuário precisa incluir ou revisar um produto para venda, compra, estoque ou fiscal. Pode chegar pela busca global, menu Cadastros Mestres, alerta de pendência ou tentativa de lançar item inexistente.

### Durante
Consulta a lista, aplica filtros, abre detalhe ou cria novo produto. O formulário é dividido por seções com progresso visual: dados principais, classificação, fiscal, preços, estoque, imagens e kit. Validações inline aparecem próximas aos campos.

### Depois
O produto fica disponível para módulos dependentes conforme status e permissões. Alterações críticas ficam na timeline de auditoria.

## Arquitetura de informação
- `/products`: lista, busca, filtros e ações.
- `/products/new`: criação por seções.
- `/products/:id`: detalhe com abas/âncoras.
- `/products/:id/edit`: edição por seções.
- `/products/:id/history`: auditoria e histórico de preço.
- `/products/:id/review-conflict`: revisão de conflito de concorrência.
- `/products/:id/delete-check`: página de verificação antes de inativar/excluir.

## Wireframe textual mobile-first
### Lista
Top app bar com título "Produtos", busca contextual e CTA "Novo". Conteúdo em cards com SKU, nome, categoria, unidade, preço, status e chips fiscais/estoque. Filtros por status, categoria, unidade, controle de estoque e divergência fiscal. Bottom navigation mantém contexto.

### Criação/Edição
Top app bar com voltar e título. Stepper/progresso discreto. Seções em cards expansíveis:
1. Dados principais: SKU, GTIN, nome, descrição, categoria, unidade.
2. Fiscal: NCM, CEST, origem.
3. Preços: custo, venda, margem calculada.
4. Estoque: controla estoque, mínimo, lote/série/validade.
5. Imagens: upload com formatos permitidos.
6. Kit: componentes, quantidades e validações.
CTA persistente no mobile: "Salvar produto". Ação secundária: "Salvar rascunho".

### Detalhe
Header com nome, SKU, status e ações permitidas. Cards de resumo e abas/âncoras para fiscal, preço, estoque, imagens, kit e auditoria.

### Conflito
Página dedicada compara versão atual e versão enviada, com ações "Recarregar", "Aplicar novamente" ou "Cancelar".

## Responsividade
- Compact/mobile: cards, CTA fixo inferior, busca em página dedicada, filtros em bottom sheet auxiliar não crítico.
- Medium/tablet: lista em duas colunas ou tabela compacta, formulário com resumo lateral simples.
- Expanded/desktop: tabela com densidade configurável, navigation rail/drawer, formulário em duas colunas e resumo lateral fixo.

## Componentização
### Foundations
Tokens de cor, tipografia, spacing, shape, elevation, motion e breakpoints Material 3.

### Atoms
TextField, MoneyField, GtinField, NcmField, StatusChip, PermissionHint, LoadingSkeleton.

### Molecules
ProductCard, ProductFilterBar, FiscalFields, PriceFields, StockFields, ImageUploader, KitItemRow.

### Organisms
ProductList, ProductFormSections, ProductDetailHeader, ProductAuditTimeline, ProductPriceHistory.

### Templates
MasterListPage, MasterFormPage, MasterDetailPage, ConflictReviewPage.

### Pages
ProductsListPage, ProductCreatePage, ProductEditPage, ProductDetailPage, ProductHistoryPage.

## Formulários e validação
- SKU: obrigatório, 2–30 caracteres, único, uppercase/trim.
- GTIN: opcional, validar dígito quando informado.
- Nome: obrigatório, 2–150 caracteres.
- Descrição: opcional, até 1000 caracteres, saída escapada.
- Categoria: obrigatória quando política do tenant exigir.
- Unidade: obrigatória e ativa.
- Preço de custo/venda: número monetário >= 0.
- NCM: formato de 8 dígitos quando informado.
- CEST: formato fiscal aceito quando informado.
- Origem: enum permitido.
- Estoque mínimo: número >= 0.
- Lote/série/validade: compatível com controle de estoque.
- Imagens: tipos allowlist, tamanho limite e metadados seguros.

## APIs
- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /products/:id/audit-events`
- `GET /products/:id/price-history`

## Modelo de dados
- `products`
- `product_fiscal_data`
- `product_prices`
- `product_stock_rules`
- `product_images`
- `product_kit_components`
- `audit_events`

## Segurança
- Autenticação obrigatória.
- Autorização deny-by-default por ação, recurso, tenant, empresa, filial e escopo.
- Validação allowlist no backend.
- Escapar saída contra XSS.
- Rate limit para endpoints expostos.
- Auditoria estruturada com correlationId.
- Logs sem dados sensíveis.

## LGPD
Cadastro de produto não deve exigir dado pessoal. Caso imagens ou observações contenham dados pessoais indevidamente, aplicar minimização, orientação de uso e exclusão lógica/retention. Logs e auditoria devem evitar conteúdo desnecessário e preservar rastreabilidade operacional.

## Plano técnico
1. Criar migrations com constraints e índices.
2. Implementar entidades/DTOs/validators/policies.
3. Implementar services transacionais com auditoria.
4. Criar frontend por services/hooks e componentes.
5. Criar testes unitários, integração e frontend.
6. Documentar operação no Markdown `docs/actions-exec/fg-012-cadastro-produtos.md`.
