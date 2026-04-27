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

export const seedGovernanceCompanies = [
  {
    companyId: 'cmp_demo',
    tenantId: 'tenant_demo',
    legalName: 'Empresa Demo LTDA',
    tradeName: 'Demo',
    legalNameNormalized: 'empresa demo ltda',
    companyRootRegistration: '12345678',
    countryCode: 'BR',
    legalNatureCode: '2062',
    openingDate: '2024-01-15',
    regimeTributario: 'LUCRO_REAL',
    defaultCurrency: 'BRL',
    fiscalCalendarId: 'cal_br_default',
    consolidationMode: 'FULL',
    primaryEstablishmentId: 'est_demo_matrix',
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 3,
  },
  {
    companyId: 'cmp_ops',
    tenantId: 'tenant_demo',
    legalName: 'Operacao Piloto LTDA',
    tradeName: 'Piloto',
    legalNameNormalized: 'operacao piloto ltda',
    companyRootRegistration: '87654321',
    countryCode: 'BR',
    legalNatureCode: '2062',
    openingDate: '2024-05-10',
    regimeTributario: 'LUCRO_PRESUMIDO',
    defaultCurrency: 'BRL',
    fiscalCalendarId: 'cal_br_default',
    consolidationMode: 'FULL',
    primaryEstablishmentId: 'est_ops_matrix',
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 2,
  },
  {
    companyId: 'cmp_external',
    tenantId: 'tenant_ops',
    legalName: 'Empresa Externa LTDA',
    tradeName: 'Externa',
    legalNameNormalized: 'empresa externa ltda',
    companyRootRegistration: '99887766',
    countryCode: 'BR',
    legalNatureCode: '2062',
    openingDate: '2023-10-01',
    regimeTributario: 'LUCRO_REAL',
    defaultCurrency: 'BRL',
    fiscalCalendarId: 'cal_br_default',
    consolidationMode: 'FULL',
    primaryEstablishmentId: 'est_external_matrix',
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 1,
  },
];

export const seedGovernanceEstablishments = [
  {
    establishmentId: 'est_demo_matrix',
    tenantId: 'tenant_demo',
    companyId: 'cmp_demo',
    establishmentType: 'MATRIX',
    isPrincipal: true,
    registrationNumber: '12345678000100',
    registrationRoot: '12345678',
    establishmentOrder: '0001',
    legalNameAtEstablishment: 'Empresa Demo Matriz',
    tradeNameAtEstablishment: 'Demo Matriz',
    cnaePrincipal: '6201500',
    cnaesSecundarios: ['6202300'],
    address: {
      countryCode: 'BR',
      postalCode: '01310-100',
      stateCode: 'SP',
      cityCode: '3550308',
      cityName: 'Sao Paulo',
      district: 'Bela Vista',
      line1: 'Av. Paulista, 1000',
    },
    localTaxRegistrations: [],
    localLicenses: [],
    contactEmail: 'matriz@demo.eixo.one',
    contactPhone: '5511999999999',
    isAdministrative: true,
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 2,
  },
  {
    establishmentId: 'est_demo_branch',
    tenantId: 'tenant_demo',
    companyId: 'cmp_demo',
    establishmentType: 'BRANCH',
    isPrincipal: false,
    registrationNumber: '12345678000291',
    registrationRoot: '12345678',
    establishmentOrder: '0002',
    legalNameAtEstablishment: 'Empresa Demo Filial',
    tradeNameAtEstablishment: 'Demo Filial',
    cnaePrincipal: '4751201',
    cnaesSecundarios: [],
    address: {
      countryCode: 'BR',
      postalCode: '20040-001',
      stateCode: 'RJ',
      cityCode: '3304557',
      cityName: 'Rio de Janeiro',
      district: 'Centro',
      line1: 'Rua do Ouvidor, 20',
    },
    localTaxRegistrations: [],
    localLicenses: [],
    contactEmail: 'filial@demo.eixo.one',
    contactPhone: '5521999999999',
    isAdministrative: false,
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 1,
  },
  {
    establishmentId: 'est_ops_matrix',
    tenantId: 'tenant_demo',
    companyId: 'cmp_ops',
    establishmentType: 'MATRIX',
    isPrincipal: true,
    registrationNumber: '87654321000155',
    registrationRoot: '87654321',
    establishmentOrder: '0001',
    legalNameAtEstablishment: 'Operacao Piloto Matriz',
    tradeNameAtEstablishment: 'Piloto Matriz',
    cnaePrincipal: '7020400',
    cnaesSecundarios: [],
    address: {
      countryCode: 'BR',
      postalCode: '30110-012',
      stateCode: 'MG',
      cityCode: '3106200',
      cityName: 'Belo Horizonte',
      district: 'Centro',
      line1: 'Av. Afonso Pena, 200',
    },
    localTaxRegistrations: [],
    localLicenses: [],
    contactEmail: 'ops@eixo.one',
    contactPhone: '5531999999999',
    isAdministrative: true,
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 1,
  },
  {
    establishmentId: 'est_external_matrix',
    tenantId: 'tenant_ops',
    companyId: 'cmp_external',
    establishmentType: 'MATRIX',
    isPrincipal: true,
    registrationNumber: '99887766000177',
    registrationRoot: '99887766',
    establishmentOrder: '0001',
    legalNameAtEstablishment: 'Empresa Externa Matriz',
    tradeNameAtEstablishment: 'Externa Matriz',
    cnaePrincipal: '6201500',
    cnaesSecundarios: [],
    address: {
      countryCode: 'BR',
      postalCode: '40020-000',
      stateCode: 'BA',
      cityCode: '2927408',
      cityName: 'Salvador',
      district: 'Comercio',
      line1: 'Av. Estados Unidos, 100',
    },
    localTaxRegistrations: [],
    localLicenses: [],
    contactEmail: 'externa@eixo.one',
    contactPhone: '5571999999999',
    isAdministrative: true,
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 1,
  },
];

export const seedGovernanceGrants = [
  {
    tenantId: 'tenant_demo',
    userId: 'user_admin',
    companyScopes: [
      {
        companyId: 'cmp_demo',
        establishmentIds: [],
      },
      {
        companyId: 'cmp_ops',
        establishmentIds: [],
      },
    ],
    allowedCompanyIds: ['cmp_demo', 'cmp_ops'],
    allowedEstablishmentIds: [
      'est_demo_matrix',
      'est_demo_branch',
      'est_ops_matrix',
    ],
    defaultCompanyId: 'cmp_demo',
    defaultEstablishmentId: 'est_demo_matrix',
    roleKeys: ['platform_admin'],
    permissionOverrides: [],
    readOnlyAllowed: false,
    grantsVersion: 1,
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
  },
  {
    tenantId: 'tenant_demo',
    userId: 'user_operator',
    companyScopes: [
      {
        companyId: 'cmp_demo',
        establishmentIds: ['est_demo_branch'],
      },
    ],
    allowedCompanyIds: ['cmp_demo'],
    allowedEstablishmentIds: ['est_demo_branch'],
    defaultCompanyId: 'cmp_demo',
    defaultEstablishmentId: 'est_demo_branch',
    roleKeys: ['operator'],
    permissionOverrides: [],
    readOnlyAllowed: false,
    grantsVersion: 1,
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
  },
];

export const seedGovernanceContexts = [
  {
    tenantId: 'tenant_demo',
    userId: 'user_admin',
    activeCompanyId: 'cmp_demo',
    activeEstablishmentId: 'est_demo_matrix',
    selectedReadCompanyIds: ['cmp_demo', 'cmp_ops'],
    selectedReadEstablishmentIds: ['est_demo_matrix', 'est_ops_matrix'],
    writeEnabled: true,
    lastSwitchedAt: '2026-04-26T18:15:00.000Z',
    contextVersion: 1,
  },
  {
    tenantId: 'tenant_demo',
    userId: 'user_operator',
    activeCompanyId: 'cmp_demo',
    activeEstablishmentId: 'est_demo_branch',
    selectedReadCompanyIds: ['cmp_demo'],
    selectedReadEstablishmentIds: ['est_demo_branch'],
    writeEnabled: true,
    lastSwitchedAt: '2026-04-26T18:15:00.000Z',
    contextVersion: 1,
  },
];

export const seedGovernanceSharingPolicies = [
  {
    policyId: 'shp_catalog',
    tenantId: 'tenant_demo',
    domainKey: 'catalog',
    scopeType: 'COMPANY',
    shareMode: 'SINGLE_MASTER',
    participantCompanyIds: ['cmp_demo', 'cmp_ops'],
    masterCompanyId: 'cmp_demo',
    policyConfig: {
      syncPriceLists: false,
    },
    status: 'active',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
    version: 1,
  },
];

export const seedGovernanceConsolidationRuns = [
  {
    runId: 'crn_demo_001',
    tenantId: 'tenant_demo',
    participantCompanyIds: ['cmp_demo', 'cmp_ops'],
    participantEstablishmentIds: ['est_demo_matrix', 'est_ops_matrix'],
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    fiscalCalendarId: 'cal_br_default',
    currencyCode: 'BRL',
    fxPolicy: {
      type: 'FIXED',
    },
    percentagePolicy: {
      type: 'FULL',
    },
    eliminationMode: 'MANUAL_REVIEW',
    status: 'completed',
    validationSummary: {
      blockingIssueCount: 0,
      warningCount: 0,
      issues: [],
    },
    resultSummary: {
      participantCompanyCount: 2,
      participantEstablishmentCount: 2,
      includedCompanyIds: ['cmp_demo', 'cmp_ops'],
      totalIssues: 0,
    },
    errorSummary: null,
    requestedBy: 'user_admin',
    startedAt: '2026-04-26T18:30:00.000Z',
    completedAt: '2026-04-26T18:31:00.000Z',
    idempotencyKey: 'seed-run-001',
    createdAt: '2026-04-26T18:29:00.000Z',
    updatedAt: '2026-04-26T18:31:00.000Z',
    version: 1,
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
