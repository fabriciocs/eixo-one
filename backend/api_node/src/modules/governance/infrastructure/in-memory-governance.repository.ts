import {
  companySchema,
  consolidationRunSchema,
  establishmentSchema,
  sharingPolicySchema,
  userContextSchema,
  userScopeGrantSchema,
  type Company,
  type ConsolidationRun,
  type Establishment,
  type SharingPolicy,
  type UserContext,
  type UserScopeGrant,
} from '@eixoone/shared-contracts';

import { AppError } from '../../../core/errors/app-error.js';
import type {
  CompanyUpdatePatch,
  EstablishmentUpdatePatch,
  GovernanceRepository,
  SharingPolicyUpdatePatch,
} from '../application/governance-repository.js';

const seedCompanies: Company[] = [
  companySchema.parse({
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
  }),
  companySchema.parse({
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
  }),
  companySchema.parse({
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
  }),
];

const seedEstablishments: Establishment[] = [
  establishmentSchema.parse({
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
  }),
  establishmentSchema.parse({
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
  }),
  establishmentSchema.parse({
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
  }),
  establishmentSchema.parse({
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
  }),
];

const seedGrants: UserScopeGrant[] = [
  userScopeGrantSchema.parse({
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
  }),
  userScopeGrantSchema.parse({
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
  }),
];

const seedContexts: UserContext[] = [
  userContextSchema.parse({
    tenantId: 'tenant_demo',
    userId: 'user_admin',
    activeCompanyId: 'cmp_demo',
    activeEstablishmentId: 'est_demo_matrix',
    selectedReadCompanyIds: ['cmp_demo', 'cmp_ops'],
    selectedReadEstablishmentIds: ['est_demo_matrix', 'est_ops_matrix'],
    writeEnabled: true,
    lastSwitchedAt: '2026-04-26T18:15:00.000Z',
    contextVersion: 1,
  }),
  userContextSchema.parse({
    tenantId: 'tenant_demo',
    userId: 'user_operator',
    activeCompanyId: 'cmp_demo',
    activeEstablishmentId: 'est_demo_branch',
    selectedReadCompanyIds: ['cmp_demo'],
    selectedReadEstablishmentIds: ['est_demo_branch'],
    writeEnabled: true,
    lastSwitchedAt: '2026-04-26T18:15:00.000Z',
    contextVersion: 1,
  }),
];

const seedSharingPolicies: SharingPolicy[] = [
  sharingPolicySchema.parse({
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
  }),
];

const seedRuns: ConsolidationRun[] = [
  consolidationRunSchema.parse({
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
  }),
];

export class InMemoryGovernanceRepository implements GovernanceRepository {
  private readonly companies = new Map<string, Company>(
    seedCompanies.map((item) => [this.keyOf(item.tenantId, item.companyId), item]),
  );

  private readonly establishments = new Map<string, Establishment>(
    seedEstablishments.map((item) => [
      this.keyOf(item.tenantId, item.establishmentId),
      item,
    ]),
  );

  private readonly grants = new Map<string, UserScopeGrant>(
    seedGrants.map((item) => [this.keyOf(item.tenantId, item.userId), item]),
  );

  private readonly contexts = new Map<string, UserContext>(
    seedContexts.map((item) => [this.keyOf(item.tenantId, item.userId), item]),
  );

  private readonly sharingPolicies = new Map<string, SharingPolicy>(
    seedSharingPolicies.map((item) => [
      this.keyOf(item.tenantId, item.policyId),
      item,
    ]),
  );

  private readonly consolidationRuns = new Map<string, ConsolidationRun>(
    seedRuns.map((item) => [this.keyOf(item.tenantId, item.runId), item]),
  );

  private keyOf(tenantId: string, entityId: string) {
    return `${tenantId}:${entityId}`;
  }

  async findAllCompanies(tenantId: string) {
    return [...this.companies.values()].filter((item) => item.tenantId === tenantId);
  }

  async findCompanyById(tenantId: string, companyId: string) {
    return this.companies.get(this.keyOf(tenantId, companyId)) ?? null;
  }

  async findCompanyByRootRegistration(
    tenantId: string,
    companyRootRegistration: string,
  ) {
    return (
      [...this.companies.values()].find(
        (item) =>
          item.tenantId === tenantId &&
          item.companyRootRegistration === companyRootRegistration,
      ) ?? null
    );
  }

  async createCompany(company: Company) {
    const key = this.keyOf(company.tenantId, company.companyId);

    if (this.companies.has(key)) {
      throw new AppError(409, 'DUPLICATE_RECORD', 'Empresa ja cadastrada.');
    }

    const parsed = companySchema.parse(company);
    this.companies.set(key, parsed);
    return parsed;
  }

  async updateCompany(input: {
    tenantId: string;
    companyId: string;
    expectedVersion: number;
    patch: CompanyUpdatePatch;
  }) {
    const key = this.keyOf(input.tenantId, input.companyId);
    const current = this.companies.get(key);

    if (!current) {
      throw new AppError(404, 'NOT_FOUND', 'Empresa nao encontrada.');
    }

    if (current.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao da empresa desatualizada.',
      );
    }

    const updated = companySchema.parse({
      ...current,
      ...input.patch,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    });

    this.companies.set(key, updated);
    return updated;
  }

  async findAllEstablishments(tenantId: string) {
    return [...this.establishments.values()].filter(
      (item) => item.tenantId === tenantId,
    );
  }

  async findEstablishmentById(tenantId: string, establishmentId: string) {
    return this.establishments.get(this.keyOf(tenantId, establishmentId)) ?? null;
  }

  async findEstablishmentByRegistrationNumber(
    tenantId: string,
    registrationNumber: string,
  ) {
    return (
      [...this.establishments.values()].find(
        (item) =>
          item.tenantId === tenantId &&
          item.registrationNumber === registrationNumber,
      ) ?? null
    );
  }

  async createEstablishment(establishment: Establishment) {
    const key = this.keyOf(establishment.tenantId, establishment.establishmentId);

    if (this.establishments.has(key)) {
      throw new AppError(
        409,
        'DUPLICATE_RECORD',
        'Estabelecimento ja cadastrado.',
      );
    }

    const parsed = establishmentSchema.parse(establishment);
    this.establishments.set(key, parsed);
    return parsed;
  }

  async updateEstablishment(input: {
    tenantId: string;
    establishmentId: string;
    expectedVersion: number;
    patch: EstablishmentUpdatePatch;
  }) {
    const key = this.keyOf(input.tenantId, input.establishmentId);
    const current = this.establishments.get(key);

    if (!current) {
      throw new AppError(404, 'NOT_FOUND', 'Estabelecimento nao encontrado.');
    }

    if (current.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao do estabelecimento desatualizada.',
      );
    }

    const updated = establishmentSchema.parse({
      ...current,
      ...input.patch,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    });

    this.establishments.set(key, updated);
    return updated;
  }

  async findUserScopeGrant(tenantId: string, userId: string) {
    return this.grants.get(this.keyOf(tenantId, userId)) ?? null;
  }

  async saveUserScopeGrant(grant: UserScopeGrant) {
    const parsed = userScopeGrantSchema.parse(grant);
    this.grants.set(this.keyOf(parsed.tenantId, parsed.userId), parsed);
    return parsed;
  }

  async findUserContext(tenantId: string, userId: string) {
    return this.contexts.get(this.keyOf(tenantId, userId)) ?? null;
  }

  async saveUserContext(context: UserContext) {
    const parsed = userContextSchema.parse(context);
    this.contexts.set(this.keyOf(parsed.tenantId, parsed.userId), parsed);
    return parsed;
  }

  async findAllSharingPolicies(tenantId: string) {
    return [...this.sharingPolicies.values()].filter(
      (item) => item.tenantId === tenantId,
    );
  }

  async findSharingPolicyById(tenantId: string, policyId: string) {
    return this.sharingPolicies.get(this.keyOf(tenantId, policyId)) ?? null;
  }

  async createSharingPolicy(policy: SharingPolicy) {
    const key = this.keyOf(policy.tenantId, policy.policyId);

    if (this.sharingPolicies.has(key)) {
      throw new AppError(409, 'DUPLICATE_RECORD', 'Politica ja cadastrada.');
    }

    const parsed = sharingPolicySchema.parse(policy);
    this.sharingPolicies.set(key, parsed);
    return parsed;
  }

  async updateSharingPolicy(input: {
    tenantId: string;
    policyId: string;
    expectedVersion: number;
    patch: SharingPolicyUpdatePatch;
  }) {
    const key = this.keyOf(input.tenantId, input.policyId);
    const current = this.sharingPolicies.get(key);

    if (!current) {
      throw new AppError(404, 'NOT_FOUND', 'Politica nao encontrada.');
    }

    if (current.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        'Versao da politica desatualizada.',
      );
    }

    const updated = sharingPolicySchema.parse({
      ...current,
      ...input.patch,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    });

    this.sharingPolicies.set(key, updated);
    return updated;
  }

  async findAllConsolidationRuns(tenantId: string) {
    return [...this.consolidationRuns.values()].filter(
      (item) => item.tenantId === tenantId,
    );
  }

  async findConsolidationRunById(tenantId: string, runId: string) {
    return this.consolidationRuns.get(this.keyOf(tenantId, runId)) ?? null;
  }

  async createConsolidationRun(run: ConsolidationRun) {
    const key = this.keyOf(run.tenantId, run.runId);

    if (this.consolidationRuns.has(key)) {
      throw new AppError(
        409,
        'DUPLICATE_RECORD',
        'Run de consolidacao ja cadastrada.',
      );
    }

    const parsed = consolidationRunSchema.parse(run);
    this.consolidationRuns.set(key, parsed);
    return parsed;
  }

  async isReady() {
    return true;
  }
}
