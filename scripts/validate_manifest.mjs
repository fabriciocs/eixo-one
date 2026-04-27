import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const required = [
  "packages/sharedcontracts/src/v1/base-governance/fg-008.ts",
  "backend/apinode/src/modules/base-governance/fg-008/service.ts",
  "backend/apinode/src/modules/base-governance/fg-008/routes.ts",
  "backend/apinode/src/modules/base-governance/fg-008/repository.ts",
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

const firebasePublicConfigFiles = new Set([
  "apps/mobile_flutter/android/app/google-services.json",
  "apps/mobile_flutter/ios/Runner/GoogleService-Info.plist",
  "apps/mobile_flutter/lib/firebase_options.dart"
]);

function scrubKnownSafeValues(file, text) {
  if (firebasePublicConfigFiles.has(file)) {
    return text
      .replace(/AIza[0-9A-Za-z_-]{35}/g, "FIREBASE_PUBLIC_API_KEY")
      .replace(/apiKey\s*:\s*['"][^'"]+['"]/gi, "firebaseClientConfig: true");
  }

  if (file === "scripts/firebase/emulator-shared.mjs") {
    return text
      .replace(/apiKey\s*:\s*['"]demo-eixoone-api-key['"]/g, "demoApiKey: true")
      .replace(/password\s*:\s*['"]12345678['"]/g, "demoPassword: true");
  }

  return text;
}

const ignoredDirectories = new Set([
  ".dart_tool",
  ".git",
  "build",
  "dist",
  "node_modules"
]);

function shouldSkipPath(filePath) {
  return filePath.split(/[\\/]/).some((segment) => ignoredDirectories.has(segment));
}

function listTrackedFiles() {
  try {
    const output = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" });
    return output.split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (ignoredDirectories.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    files.push(full);
  }
  return files;
}

const filesToScan = listTrackedFiles() ?? walk(".");

for (const file of filesToScan) {
  if (file.endsWith("validate_manifest.mjs") || shouldSkipPath(file)) continue;
  const content = readFileSync(file);
  if (content.includes(0)) continue;
  const text = content.toString("utf8");
  const scrubbedText = scrubKnownSafeValues(file, text);
  for (const pattern of secretPatterns) {
    assert.equal(pattern.test(scrubbedText), false, `possible secret in ${file}`);
  }
}

console.log("Manifest and secret scan passed");
