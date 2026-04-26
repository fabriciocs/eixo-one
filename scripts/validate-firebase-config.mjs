import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const firebaseJsonPath = path.join(root, 'firebase.json');
const firestoreRulesPath = path.join(root, 'firebase', 'rules', 'firestore.rules');
const storageRulesPath = path.join(root, 'firebase', 'rules', 'storage.rules');
const indexesPath = path.join(root, 'firebase', 'firestore.indexes.json');

function fail(message) {
  console.error(`[firebase-config] ${message}`);
  process.exit(1);
}

for (const filePath of [
  firebaseJsonPath,
  firestoreRulesPath,
  storageRulesPath,
  indexesPath,
]) {
  if (!existsSync(filePath)) {
    fail(`Arquivo obrigatorio ausente: ${path.relative(root, filePath)}`);
  }
}

const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf8'));
const firestoreRules = readFileSync(firestoreRulesPath, 'utf8');
const storageRules = readFileSync(storageRulesPath, 'utf8');
const indexesJson = JSON.parse(readFileSync(indexesPath, 'utf8'));

if (firebaseJson.firestore?.rules !== 'firebase/rules/firestore.rules') {
  fail('firebase.json deve apontar para firebase/rules/firestore.rules');
}

if (firebaseJson.storage?.rules !== 'firebase/rules/storage.rules') {
  fail('firebase.json deve apontar para firebase/rules/storage.rules');
}

if (firebaseJson.firestore?.indexes !== 'firebase/firestore.indexes.json') {
  fail('firebase.json deve apontar para firebase/firestore.indexes.json');
}

if (!firestoreRules.includes("rules_version = '2'")) {
  fail('firestore.rules deve usar rules_version = \'2\'');
}

if (firestoreRules.includes('allow read, write: if true')) {
  fail('firestore.rules nao pode liberar leitura e escrita totais');
}

if (!firestoreRules.includes('request.auth != null')) {
  fail('firestore.rules precisa exigir autenticacao em pelo menos uma funcao auxiliar');
}

if (!storageRules.includes('request.auth != null')) {
  fail('storage.rules precisa exigir autenticacao');
}

if (storageRules.includes('allow read, write: if true')) {
  fail('storage.rules nao pode liberar leitura e escrita totais');
}

if (!Array.isArray(indexesJson.indexes)) {
  fail('firestore.indexes.json deve conter um array indexes');
}

console.log('[firebase-config] Validacao estatica concluida com sucesso.');

