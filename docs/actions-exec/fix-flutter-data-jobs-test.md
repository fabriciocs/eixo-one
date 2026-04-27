# Execução operacional — fix Flutter Data Jobs test

**Slug:** `fix-flutter-data-jobs-test`  
**Branch sugerida:** `fix/flutter-data-jobs-test`  
**Erro:** `data jobs page loads seeded jobs and workspace`  
**Data:** 2026-04-27

## Escopo

Corrigir falha do `flutter test` na página de Data Jobs sem pular teste e sem alterar regra de negócio.

## Arquivos no ZIP

- `codigo-fonte/tools/fix_flutter_data_jobs_test.py`
- `codigo-fonte/docs/01-definicao-produto.md`
- `codigo-fonte/docs/02-ux-arquitetura.md`
- `codigo-fonte/docs/03-qa-relatorio.md`

## Comandos seguros

<!-- actions-exec:run -->
```bash
set -euo pipefail

slug="fix-flutter-data-jobs-test"
zip_path="docs/actions-exec/${slug}.zip"
work_dir="tmp/actions-exec/${slug}"
evidence_dir="docs/actions-exec/${slug}"

git fetch origin main
git checkout main
git pull --ff-only origin main
git checkout -B fix/flutter-data-jobs-test

mkdir -p "${work_dir}" "${evidence_dir}"

python - <<'PY'
from pathlib import Path
import zipfile

slug = "fix-flutter-data-jobs-test"
zip_path = Path("docs/actions-exec") / f"{slug}.zip"
work_dir = Path("tmp/actions-exec") / slug

with zipfile.ZipFile(zip_path) as zf:
    for name in zf.namelist():
        p = Path(name)
        if p.is_absolute() or ".." in p.parts:
            raise SystemExit(f"Caminho inseguro no ZIP: {name}")
        if not name.startswith("codigo-fonte/"):
            raise SystemExit(f"Entrada fora de codigo-fonte/: {name}")
    zf.extractall(work_dir)
PY

cd apps/mobile_flutter
flutter test -r expanded test/features/governance/governance_pages_test.dart > "../../${evidence_dir}/flutter-test-before.log" 2>&1 || true
cd ../..

python "${work_dir}/codigo-fonte/tools/fix_flutter_data_jobs_test.py"

cd apps/mobile_flutter
flutter test -r expanded test/features/governance/governance_pages_test.dart > "../../${evidence_dir}/flutter-test-after.log" 2>&1
flutter test
cd ../..

cp -R "${work_dir}/codigo-fonte/docs/"* "${evidence_dir}/"

git status --short
git add apps/mobile_flutter/test/features/governance/governance_pages_test.dart "${evidence_dir}"
git commit -m "test(flutter): estabiliza teste de data jobs"
git push -u origin fix/flutter-data-jobs-test
```

## Observações

O log fornecido não inclui `Expected/Actual`, por isso o patch evita mudar assertions. Ele estabiliza renderização assíncrona e conteúdo scrollável do teste específico.
