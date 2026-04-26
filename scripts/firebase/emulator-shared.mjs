import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(moduleDir, '..', '..');

function trimOrDefault(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeStorageHost(rawValue) {
  const normalized = trimOrDefault(rawValue, '127.0.0.1:9199');
  return normalized.replace(/^https?:\/\//, '');
}

export const emulatorConfig = {
  projectId: trimOrDefault(
    process.env.EIXOONE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID,
    'eixoone-dev',
  ),
  authHost: trimOrDefault(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099'),
  firestoreHost: trimOrDefault(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8088'),
  storageHost: normalizeStorageHost(process.env.STORAGE_EMULATOR_HOST),
  storageBucket: trimOrDefault(
    process.env.FIREBASE_STORAGE_BUCKET,
    `${trimOrDefault(process.env.EIXOONE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID, 'eixoone-dev')}.firebasestorage.app`,
  ),
  apiKey: 'demo-eixoone-api-key',
};

export function applyEmulatorEnvironment(extraEnv = {}) {
  process.env.GCLOUD_PROJECT = emulatorConfig.projectId;
  process.env.GOOGLE_CLOUD_PROJECT = emulatorConfig.projectId;
  process.env.FIREBASE_PROJECT_ID = emulatorConfig.projectId;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = emulatorConfig.authHost;
  process.env.FIRESTORE_EMULATOR_HOST = emulatorConfig.firestoreHost;
  process.env.STORAGE_EMULATOR_HOST = `http://${emulatorConfig.storageHost}`;

  for (const [key, value] of Object.entries(extraEnv)) {
    process.env[key] = String(value);
  }

  return emulatorConfig;
}

export const seedOrganizations = [
  {
    id: 'tenant_demo',
    tenantId: 'tenant_demo',
    name: 'EixoOne Demo',
    legalName: 'EixoOne Demo LTDA',
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 1,
  },
  {
    id: 'tenant_ops',
    tenantId: 'tenant_ops',
    name: 'Operacao Piloto',
    legalName: 'Operacao Piloto LTDA',
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 1,
  },
];

export const seedUsers = [
  {
    id: 'user_admin',
    tenantId: 'tenant_demo',
    email: 'admin@eixo.one',
    displayName: 'Admin EixoOne',
    status: 'active',
    roleKeys: ['platform_admin'],
    permissionKeys: [
      'users.read',
      'users.manage',
      'audit.read',
      'roles.read',
      'settings.read',
      'files.read',
      'integrations.read',
    ],
    moduleKeys: ['dashboard', 'users', 'roles', 'audit', 'settings', 'files'],
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    lastLoginAt: '2026-04-26T18:10:00.000Z',
    version: 3,
  },
  {
    id: 'user_operator',
    tenantId: 'tenant_demo',
    email: 'operador@eixo.one',
    displayName: 'Operador',
    status: 'invited',
    roleKeys: ['operator'],
    permissionKeys: ['users.read'],
    moduleKeys: ['dashboard', 'users'],
    createdAt: '2026-04-25T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    lastLoginAt: null,
    version: 1,
  },
  {
    id: 'user_external',
    tenantId: 'tenant_ops',
    email: 'externo@eixo.one',
    displayName: 'Operacao Externa',
    status: 'active',
    roleKeys: ['supervisor'],
    permissionKeys: ['users.read'],
    moduleKeys: ['dashboard'],
    createdAt: '2026-04-24T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    lastLoginAt: '2026-04-26T18:12:00.000Z',
    version: 2,
  },
];

export const seedAuthUsers = [
  {
    uid: 'user_admin',
    email: 'admin@eixo.one',
    password: '12345678',
    displayName: 'Admin EixoOne',
    disabled: false,
    claims: {
      tenantId: 'tenant_demo',
      isAdmin: true,
      role: 'platform_admin',
      roleKeys: ['platform_admin'],
      permissionKeys: [
        'users.read',
        'users.manage',
        'audit.read',
        'roles.read',
        'settings.read',
        'files.read',
        'integrations.read',
      ],
      moduleKeys: ['dashboard', 'users', 'roles', 'audit', 'settings', 'files'],
    },
  },
  {
    uid: 'user_operator',
    email: 'operador@eixo.one',
    password: '12345678',
    displayName: 'Operador',
    disabled: false,
    claims: {
      tenantId: 'tenant_demo',
      role: 'operator',
      roleKeys: ['operator'],
      permissionKeys: ['users.read'],
      moduleKeys: ['dashboard', 'users'],
    },
  },
  {
    uid: 'user_external',
    email: 'externo@eixo.one',
    password: '12345678',
    displayName: 'Operacao Externa',
    disabled: false,
    claims: {
      tenantId: 'tenant_ops',
      role: 'supervisor',
      roleKeys: ['supervisor'],
      permissionKeys: ['users.read'],
      moduleKeys: ['dashboard'],
    },
  },
];

export const seedStorageObject = {
  path: 'organizations/tenant_demo/reports/tenant_demo_bootstrap.csv',
  localFilePath: path.join(
    repoRoot,
    'firebase',
    'emulators',
    'seed-files',
    'tenant_demo_bootstrap.csv',
  ),
  contentType: 'text/csv',
  metadata: {
    tenantId: 'tenant_demo',
    uploadedBy: 'user_admin',
  },
};

export async function readSeedStorageContent() {
  return readFile(seedStorageObject.localFilePath);
}

export async function readFirestoreRules() {
  return readFile(
    path.join(repoRoot, 'firebase', 'rules', 'firestore.rules'),
    'utf8',
  );
}

export async function readStorageRules() {
  return readFile(
    path.join(repoRoot, 'firebase', 'rules', 'storage.rules'),
    'utf8',
  );
}

export async function signInWithPassword(email, password) {
  const response = await fetch(
    `http://${emulatorConfig.authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${emulatorConfig.apiKey}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Auth emulator sign-in failed: ${response.status} ${body}`);
  }

  return response.json();
}
