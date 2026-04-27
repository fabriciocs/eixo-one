import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const required = [
  "packages/sharedcontracts/src/v1/base-governance/fg-008.ts",
  "backend/apinode/src/modules/base-governance/fg-008/service.ts",
  "backend/apinode/src/modules/base-governance/fg-008/routes.ts",
  "backend/apinode/src/modules/base-governance/fg-008/repository.ts",
  "apps/mobileflutter/lib/features/integrations_api_webhooks/presentation/integrations_page.dart",
  "firebase/rules/firestore.rules",
  "openapi/fg-008-integrations.openapi.yaml"
];

for (const file of required) {
  assert.equal(existsSync(file), true, `missing required file: ${file}`);
}

const secretPatterns = [
  /AIza[0-9A-Za-z_-]{35}/,
  /-----BEGIN PRIVATE KEY-----/,
  /password\s*[:=]\s*['"][^'"]+['"]/i,
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i
];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (["dist", "node_modules", ".git"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else {
      if (full.endsWith("validate_manifest.mjs")) continue;
      const text = readFileSync(full, "utf8");
      for (const pattern of secretPatterns) {
        assert.equal(pattern.test(text), false, `possible secret in ${full}`);
      }
    }
  }
}

walk(".");
console.log("Manifest and secret scan passed");
