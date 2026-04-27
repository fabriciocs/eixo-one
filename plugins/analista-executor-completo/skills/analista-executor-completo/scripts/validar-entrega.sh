#!/usr/bin/env bash
set -euo pipefail
SLUG="${1:-}"
if [ -z "$SLUG" ]; then echo "Uso: validar-entrega.sh <slug-da-task>"; exit 1; fi
BASE="docs/entregas/${SLUG}"
for f in 00_controle_da_entrega.md 01_entendimento_e_diagnostico.md 02_pesquisa_e_benchmark.md 03_definicao_funcional.md 04_especificacao_ux_ui.md 05_especificacao_tecnica_backend.md 06_especificacao_tecnica_frontend.md 07_arquitetura_e_modelagem.md 08_plano_de_implementacao.md 09_estrategia_qa_e_testes.md 10_matriz_de_rastreabilidade.md 11_evidencias_de_validacao.md 12_relatorio_final.md; do
  if [ ! -s "$BASE/$f" ]; then echo "Pendente ou vazio: $BASE/$f"; exit 1; fi
done
echo "Entrega documental mínima validada: $BASE"
