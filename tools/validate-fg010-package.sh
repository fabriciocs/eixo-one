#!/usr/bin/env bash
set -euo pipefail

root="${1:-.}"

required=(
  "contracts/openapi/fg-010-customers.openapi.yaml"
  "backend/typescript/src/modules/customers/customer.types.ts"
  "backend/typescript/src/modules/customers/customer.validators.ts"
  "backend/typescript/src/modules/customers/customer.service.ts"
  "frontend/flutter/lib/features/customers/domain/customer.dart"
  "database/sql/20260427_fg010_customers.sql"
)

for file in "${required[@]}"; do
  if [[ ! -f "${root}/${file}" ]]; then
    echo "Arquivo obrigatório ausente: ${file}" >&2
    exit 1
  fi
done

if grep -RInE '(password\s*=|api[_-]?key\s*=|secret\s*=|private[_-]?key)' "${root}" >/tmp/fg010-secrets.txt; then
  echo "Possível segredo encontrado:" >&2
  cat /tmp/fg010-secrets.txt >&2
  exit 1
fi

risky_pattern='rm -rf /|sudo |chmod 777|curl .*\\| *bash'
if grep -RInE --exclude='validate-fg010-package.sh' "${risky_pattern}" "${root}" >/tmp/fg010-risky.txt; then
  echo "Comando arriscado encontrado:" >&2
  cat /tmp/fg010-risky.txt >&2
  exit 1
fi

echo "Pacote FG-010 validado com sucesso."
