import crypto from 'node:crypto';

import {
  auditEventSchema,
  companySchema,
  consolidationRunSchema,
  contractVersion,
  establishmentSchema,
  type AccessibleScopesSummary,
  type Company,
  type ConsolidatedOverview,
  type ConsolidationIssue,
  type CreateCompanyRequest,
  type CreateConsolidationRunRequest,
  type CreateEstablishmentRequest,
  type CreateSharingPolicyRequest,
  type Establishment,
  type ListCompaniesQuery,
  type ListConsolidationRunsQuery,
  type ListEstablishmentsQuery,
  type ListSharingPoliciesQuery,
  type SwitchOperationalContextRequest,
  type UpdateCompanyRequest,
  type UpdateEstablishmentRequest,
  type UpdateSharingPolicyRequest,
  type UpsertUserScopeGrantRequest,
  type UserContext,
  type UserScopeGrant,
  userContextSchema,
  userScopeGrantSchema,
} from '@eixoone/shared-contracts';

import type { AuditLogWriter } from '../../../core/audit/audit-log-writer.js';
import { AppError } from '../../../core/errors/app-error.js';
import type {
  IdempotencyRecord,
  IdempotencyStore,
} from '../../../core/resilience/idempotency-store.js';
import type {
  AuthContext,
  RequestContextData,
} from '../../../middlewares/request-types.js';
import {
  resolveConsolidationRunTransition,
  resolveGovernanceStatusTransition,
} from '../domain/governance-state-machine.js';
import type { GovernanceRepository } from './governance-repository.js';

type PaginatedResult<T> = {
  items: T[];
  totalItems: number;
  hasNextPage: boolean;
  page: number;
  pageSize: number;
};

type GovernanceStatusAction = 'activate' | 'inactivate' | 'archive';

type AccessProfile = {
  isPlatformAdmin: boolean;
  grant: UserScopeGrant;
  companies: Company[];
  establishments: Establishment[];
};

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function generateId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}`;
}

function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    totalItems: items.length,
    hasNextPage: startIndex + pageSize < items.length,
    page,
    pageSize,
  };
}

export class GovernanceService {
  constructor(
    private readonly repository: GovernanceRepository,
    private readonly idempotencyStore: IdempotencyStore,
    private readonly auditLogWriter: AuditLogWriter,
  ) {}

  private isPlatformAdmin(auth: AuthContext) {
    return auth.roleKeys.includes('platform_admin');
  }

  private createEmptyGrant(tenantId: string, userId: string): UserScopeGrant {
    const now = new Date().toISOString();

    return userScopeGrantSchema.parse({
      tenantId,
      userId,
      companyScopes: [],
      allowedCompanyIds: [],
      allowedEstablishmentIds: [],
      defaultCompanyId: null,
      defaultEstablishmentId: null,
      roleKeys: [],
      permissionOverrides: [],
      readOnlyAllowed: false,
      grantsVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  private buildAdminGrant(
    auth: AuthContext,
    companies: Company[],
    establishments: Establishment[],
  ): UserScopeGrant {
    const now = new Date().toISOString();

    return userScopeGrantSchema.parse({
      tenantId: auth.tenantId,
      userId: auth.uid,
      companyScopes: companies.map((company) => ({
        companyId: company.companyId,
        establishmentIds: establishments
          .filter((item) => item.companyId === company.companyId)
          .map((item) => item.establishmentId),
      })),
      allowedCompanyIds: companies.map((item) => item.companyId),
      allowedEstablishmentIds: establishments.map((item) => item.establishmentId),
      defaultCompanyId: companies[0]?.companyId ?? null,
      defaultEstablishmentId: establishments[0]?.establishmentId ?? null,
      roleKeys: auth.roleKeys,
      permissionOverrides: auth.permissionKeys,
      readOnlyAllowed: false,
      grantsVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  private isCompanyAllowed(grant: UserScopeGrant, companyId: string) {
    return grant.allowedCompanyIds.includes(companyId);
  }

  private isEstablishmentAllowed(
    grant: UserScopeGrant,
    establishment: Pick<Establishment, 'companyId' | 'establishmentId'>,
  ) {
    const companyScope = grant.companyScopes.find(
      (item) => item.companyId === establishment.companyId,
    );

    if (!companyScope) {
      return false;
    }

    if (companyScope.establishmentIds.length === 0) {
      return true;
    }

    return companyScope.establishmentIds.includes(establishment.establishmentId);
  }

  private async buildAccessProfile(auth: AuthContext): Promise<AccessProfile> {
    const companies = await this.repository.findAllCompanies(auth.tenantId);
    const establishments = await this.repository.findAllEstablishments(
      auth.tenantId,
    );

    if (this.isPlatformAdmin(auth)) {
      return {
        isPlatformAdmin: true,
        grant: this.buildAdminGrant(auth, companies, establishments),
        companies,
        establishments,
      };
    }

    const storedGrant =
      (await this.repository.findUserScopeGrant(auth.tenantId, auth.uid)) ??
      this.createEmptyGrant(auth.tenantId, auth.uid);

    return {
      isPlatformAdmin: false,
      grant: storedGrant,
      companies: companies.filter((company) =>
        this.isCompanyAllowed(storedGrant, company.companyId),
      ),
      establishments: establishments.filter((establishment) =>
        this.isEstablishmentAllowed(storedGrant, establishment),
      ),
    };
  }

  private ensureCompanyAccess(accessProfile: AccessProfile, companyId: string) {
    if (
      !accessProfile.isPlatformAdmin &&
      !this.isCompanyAllowed(accessProfile.grant, companyId)
    ) {
      throw new AppError(
        403,
        'COMPANY_ACCESS_DENIED',
        'Voce nao possui acesso a esta empresa.',
      );
    }
  }

  private ensureEstablishmentAccess(
    accessProfile: AccessProfile,
    establishment: Establishment,
  ) {
    if (
      !accessProfile.isPlatformAdmin &&
      !this.isEstablishmentAllowed(accessProfile.grant, establishment)
    ) {
      throw new AppError(
        403,
        'BRANCH_ACCESS_DENIED',
        'Voce nao possui acesso a este estabelecimento.',
      );
    }
  }

  private async writeAuditEvent(input: {
    tenantId: string;
    actorUserId: string;
    entityType: string;
    entityId: string;
    action: string;
    severity: 'info' | 'warning' | 'critical';
    requestContext: RequestContextData;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    await this.auditLogWriter.write(
      auditEventSchema.parse({
        contractVersion,
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        severity: input.severity,
        correlationId: input.requestContext.correlationId,
        requestId: input.requestContext.requestId,
        before: input.before,
        after: input.after,
        metadata: input.metadata ?? {},
        createdAt: new Date().toISOString(),
      }),
    );
  }

  private async withIdempotency<T>(input: {
    scope: string;
    fingerprint: string;
    statusCode: number;
    factory: () => Promise<T>;
  }) {
    const existingRecord = await this.idempotencyStore.get<T>(input.scope);

    if (existingRecord) {
      if (existingRecord.fingerprint !== input.fingerprint) {
        throw new AppError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Chave de idempotencia reutilizada com payload diferente.',
        );
      }

      return {
        replayed: true,
        result: existingRecord.responseBody,
      };
    }

    const result = await input.factory();

    const record: IdempotencyRecord<T> = {
      scope: input.scope,
      fingerprint: input.fingerprint,
      statusCode: input.statusCode,
      responseBody: result,
      createdAt: new Date().toISOString(),
    };

    await this.idempotencyStore.set(record);

    return {
      replayed: false,
      result,
    };
  }

  private deriveDefaultContext(grant: UserScopeGrant): UserContext {
    const now = new Date().toISOString();
    const canWrite = Boolean(grant.defaultCompanyId && !grant.readOnlyAllowed);

    return userContextSchema.parse({
      tenantId: grant.tenantId,
      userId: grant.userId,
      activeCompanyId: canWrite ? grant.defaultCompanyId : null,
      activeEstablishmentId:
        canWrite && grant.defaultEstablishmentId
          ? grant.defaultEstablishmentId
          : null,
      selectedReadCompanyIds: grant.allowedCompanyIds,
      selectedReadEstablishmentIds: grant.allowedEstablishmentIds,
      writeEnabled: canWrite,
      lastSwitchedAt: now,
      contextVersion: 0,
    });
  }

  private async getCurrentContext(accessProfile: AccessProfile, auth: AuthContext) {
    const persistedContext = await this.repository.findUserContext(
      auth.tenantId,
      auth.uid,
    );

    return persistedContext ?? this.deriveDefaultContext(accessProfile.grant);
  }

  async listCompanies(auth: AuthContext, query: ListCompaniesQuery) {
    const accessProfile = await this.buildAccessProfile(auth);
    const normalizedSearch = query.search ? normalizeName(query.search) : null;
    const filteredItems = accessProfile.companies
      .filter((company) => {
        if (query.status && company.status !== query.status) {
          return false;
        }

        if (query.countryCode && company.countryCode !== query.countryCode) {
          return false;
        }

        if (
          query.regimeTributario &&
          company.regimeTributario !== query.regimeTributario
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          company.legalNameNormalized.includes(normalizedSearch) ||
          company.companyRootRegistration.includes(query.search!.toUpperCase())
        );
      })
      .sort((left, right) =>
        left.legalNameNormalized.localeCompare(right.legalNameNormalized),
      );

    return paginateItems(filteredItems, query.page, query.pageSize);
  }

  async getCompany(auth: AuthContext, companyId: string) {
    const accessProfile = await this.buildAccessProfile(auth);
    const company = await this.repository.findCompanyById(auth.tenantId, companyId);

    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Empresa nao encontrada.');
    }

    this.ensureCompanyAccess(accessProfile, company.companyId);
    return company;
  }

  async createCompany(
    auth: AuthContext,
    payload: CreateCompanyRequest,
    idempotencyKey: string,
    requestContext: RequestContextData,
  ) {
    const fingerprint = JSON.stringify(payload);

    return this.withIdempotency({
      scope: `${auth.tenantId}:company:create:${idempotencyKey}`,
      fingerprint,
      statusCode: 201,
      factory: async () => {
        const existingCompany = await this.repository.findCompanyByRootRegistration(
          auth.tenantId,
          payload.companyRootRegistration,
        );

        if (existingCompany) {
          throw new AppError(
            409,
            'DUPLICATE_RECORD',
            'Ja existe uma empresa com esta raiz cadastral.',
          );
        }

        const now = new Date().toISOString();
        const company = companySchema.parse({
          ...payload,
          companyId: generateId('cmp'),
          tenantId: auth.tenantId,
          legalNameNormalized: normalizeName(payload.legalName),
          primaryEstablishmentId: null,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          version: 1,
        });

        const savedCompany = await this.repository.createCompany(company);

        await this.writeAuditEvent({
          tenantId: auth.tenantId,
          actorUserId: auth.uid,
          entityType: 'company',
          entityId: savedCompany.companyId,
          action: 'company.created',
          severity: 'info',
          requestContext,
          after: {
            status: savedCompany.status,
            companyRootRegistration: savedCompany.companyRootRegistration,
          },
        });

        return savedCompany;
      },
    });
  }

  async updateCompany(
    auth: AuthContext,
    companyId: string,
    payload: UpdateCompanyRequest,
    requestContext: RequestContextData,
  ) {
    const accessProfile = await this.buildAccessProfile(auth);
    const currentCompany = await this.getCompany(auth, companyId);

    this.ensureCompanyAccess(accessProfile, companyId);

    if (currentCompany.status === 'archived') {
      throw new AppError(
        409,
        'INVALID_STATE_TRANSITION',
        'Empresa arquivada nao pode ser alterada.',
      );
    }

    const patch = {
      ...payload,
      legalNameNormalized: payload.legalName
        ? normalizeName(payload.legalName)
        : currentCompany.legalNameNormalized,
    };

    delete (patch as Record<string, unknown>).expectedVersion;

    const updatedCompany = await this.repository.updateCompany({
      tenantId: auth.tenantId,
      companyId,
      expectedVersion: payload.expectedVersion,
      patch,
    });

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'company',
      entityId: updatedCompany.companyId,
      action: 'company.updated',
      severity: 'warning',
      requestContext,
      before: {
        legalName: currentCompany.legalName,
        status: currentCompany.status,
        version: currentCompany.version,
      },
      after: {
        legalName: updatedCompany.legalName,
        status: updatedCompany.status,
        version: updatedCompany.version,
      },
    });

    return updatedCompany;
  }

  async transitionCompanyStatus(
    auth: AuthContext,
    companyId: string,
    action: GovernanceStatusAction,
    expectedVersion: number,
    reason: string | undefined,
    requestContext: RequestContextData,
  ) {
    const currentCompany = await this.getCompany(auth, companyId);

    if ((action === 'inactivate' || action === 'archive') && !reason) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Justificativa obrigatoria para esta operacao.',
      );
    }

    if (action === 'activate' && !currentCompany.primaryEstablishmentId) {
      throw new AppError(
        422,
        'VALIDATION_ERROR',
        'A empresa precisa ter uma matriz principal antes de ser ativada.',
      );
    }

    const nextStatus = resolveGovernanceStatusTransition(
      currentCompany.status,
      action,
    );

    const updatedCompany = await this.repository.updateCompany({
      tenantId: auth.tenantId,
      companyId,
      expectedVersion,
      patch: {
        status: nextStatus,
      },
    });

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'company',
      entityId: updatedCompany.companyId,
      action: `company.${action}`,
      severity: 'critical',
      requestContext,
      before: {
        status: currentCompany.status,
        version: currentCompany.version,
      },
      after: {
        status: updatedCompany.status,
        version: updatedCompany.version,
      },
      metadata: {
        reason,
      },
    });

    return updatedCompany;
  }

  async listEstablishments(auth: AuthContext, query: ListEstablishmentsQuery) {
    const accessProfile = await this.buildAccessProfile(auth);
    const normalizedSearch = query.search ? normalizeName(query.search) : null;
    const filteredItems = accessProfile.establishments
      .filter((establishment) => {
        if (query.companyId && establishment.companyId !== query.companyId) {
          return false;
        }

        if (query.status && establishment.status !== query.status) {
          return false;
        }

        if (
          query.establishmentType &&
          establishment.establishmentType !== query.establishmentType
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          normalizeName(establishment.legalNameAtEstablishment).includes(
            normalizedSearch,
          ) ||
          establishment.registrationNumber.includes(query.search!.toUpperCase())
        );
      })
      .sort((left, right) =>
        left.legalNameAtEstablishment.localeCompare(right.legalNameAtEstablishment),
      );

    return paginateItems(filteredItems, query.page, query.pageSize);
  }

  async getEstablishment(auth: AuthContext, establishmentId: string) {
    const accessProfile = await this.buildAccessProfile(auth);
    const establishment = await this.repository.findEstablishmentById(
      auth.tenantId,
      establishmentId,
    );

    if (!establishment) {
      throw new AppError(404, 'NOT_FOUND', 'Estabelecimento nao encontrado.');
    }

    this.ensureEstablishmentAccess(accessProfile, establishment);
    return establishment;
  }

  async createEstablishment(
    auth: AuthContext,
    payload: CreateEstablishmentRequest,
    idempotencyKey: string,
    requestContext: RequestContextData,
  ) {
    const accessProfile = await this.buildAccessProfile(auth);
    const fingerprint = JSON.stringify(payload);

    return this.withIdempotency({
      scope: `${auth.tenantId}:establishment:create:${idempotencyKey}`,
      fingerprint,
      statusCode: 201,
      factory: async () => {
        const company = await this.repository.findCompanyById(
          auth.tenantId,
          payload.companyId,
        );

        if (!company) {
          throw new AppError(404, 'NOT_FOUND', 'Empresa nao encontrada.');
        }

        this.ensureCompanyAccess(accessProfile, payload.companyId);

        if (
          payload.establishmentType === 'BRANCH' &&
          payload.isPrincipal
        ) {
          throw new AppError(
            422,
            'INVALID_ESTABLISHMENT_TYPE',
            'Filial nao pode ser marcada como matriz principal.',
          );
        }

        if (payload.registrationRoot !== company.companyRootRegistration) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'A raiz do estabelecimento deve pertencer a empresa.',
          );
        }

        const duplicateByRegistration =
          await this.repository.findEstablishmentByRegistrationNumber(
            auth.tenantId,
            payload.registrationNumber,
          );

        if (duplicateByRegistration) {
          throw new AppError(
            409,
            'DUPLICATE_RECORD',
            'Ja existe um estabelecimento com este registro.',
          );
        }

        const tenantEstablishments = await this.repository.findAllEstablishments(
          auth.tenantId,
        );

        if (
          payload.establishmentType === 'MATRIX' &&
          payload.isPrincipal &&
          tenantEstablishments.some(
            (item) =>
              item.companyId === payload.companyId &&
              item.isPrincipal &&
              item.status === 'active',
          )
        ) {
          throw new AppError(
            409,
            'COMPANY_ALREADY_HAS_PRIMARY_MATRIX',
            'A empresa ja possui uma matriz principal ativa.',
          );
        }

        const now = new Date().toISOString();
        const establishment = {
          ...payload,
          establishmentId: generateId('est'),
          tenantId: auth.tenantId,
          status: 'active' as const,
          createdAt: now,
          updatedAt: now,
          version: 1,
        };

        const savedEstablishment = await this.repository.createEstablishment(
          establishmentSchema.parse(establishment),
        );

        if (
          savedEstablishment.establishmentType === 'MATRIX' &&
          savedEstablishment.isPrincipal &&
          company.primaryEstablishmentId !== savedEstablishment.establishmentId
        ) {
          await this.repository.updateCompany({
            tenantId: auth.tenantId,
            companyId: company.companyId,
            expectedVersion: company.version,
            patch: {
              primaryEstablishmentId: savedEstablishment.establishmentId,
            },
          });
        }

        await this.writeAuditEvent({
          tenantId: auth.tenantId,
          actorUserId: auth.uid,
          entityType: 'establishment',
          entityId: savedEstablishment.establishmentId,
          action: 'establishment.created',
          severity: 'info',
          requestContext,
          after: {
            companyId: savedEstablishment.companyId,
            establishmentType: savedEstablishment.establishmentType,
            status: savedEstablishment.status,
          },
        });

        return savedEstablishment;
      },
    });
  }

  async updateEstablishment(
    auth: AuthContext,
    establishmentId: string,
    payload: UpdateEstablishmentRequest,
    requestContext: RequestContextData,
  ) {
    const currentEstablishment = await this.getEstablishment(auth, establishmentId);
    const company = await this.repository.findCompanyById(
      auth.tenantId,
      currentEstablishment.companyId,
    );

    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Empresa nao encontrada.');
    }

    if (currentEstablishment.status === 'archived') {
      throw new AppError(
        409,
        'INVALID_STATE_TRANSITION',
        'Estabelecimento arquivado nao pode ser alterado.',
      );
    }

    const nextType =
      payload.establishmentType ?? currentEstablishment.establishmentType;
    const nextIsPrincipal =
      payload.isPrincipal ?? currentEstablishment.isPrincipal;
    const nextRegistrationRoot =
      payload.registrationRoot ?? currentEstablishment.registrationRoot;
    const nextRegistrationNumber =
      payload.registrationNumber ?? currentEstablishment.registrationNumber;

    if (nextType === 'BRANCH' && nextIsPrincipal) {
      throw new AppError(
        422,
        'INVALID_ESTABLISHMENT_TYPE',
        'Filial nao pode ser marcada como matriz principal.',
      );
    }

    if (nextRegistrationRoot !== company.companyRootRegistration) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'A raiz do estabelecimento deve pertencer a empresa.',
      );
    }

    const duplicateByRegistration =
      await this.repository.findEstablishmentByRegistrationNumber(
        auth.tenantId,
        nextRegistrationNumber,
      );

    if (
      duplicateByRegistration &&
      duplicateByRegistration.establishmentId !== currentEstablishment.establishmentId
    ) {
      throw new AppError(
        409,
        'DUPLICATE_RECORD',
        'Ja existe um estabelecimento com este registro.',
      );
    }

    const tenantEstablishments = await this.repository.findAllEstablishments(
      auth.tenantId,
    );

    if (
      nextType === 'MATRIX' &&
      nextIsPrincipal &&
      tenantEstablishments.some(
        (item) =>
          item.companyId === currentEstablishment.companyId &&
          item.establishmentId !== currentEstablishment.establishmentId &&
          item.isPrincipal &&
          item.status === 'active',
      )
    ) {
      throw new AppError(
        409,
        'COMPANY_ALREADY_HAS_PRIMARY_MATRIX',
        'A empresa ja possui uma matriz principal ativa.',
      );
    }

    const patch = {
      ...payload,
    };

    delete (patch as Record<string, unknown>).expectedVersion;

    const updatedEstablishment = await this.repository.updateEstablishment({
      tenantId: auth.tenantId,
      establishmentId,
      expectedVersion: payload.expectedVersion,
      patch,
    });

    if (
      updatedEstablishment.establishmentType === 'MATRIX' &&
      updatedEstablishment.isPrincipal &&
      company.primaryEstablishmentId !== updatedEstablishment.establishmentId
    ) {
      await this.repository.updateCompany({
        tenantId: auth.tenantId,
        companyId: company.companyId,
        expectedVersion: company.version,
        patch: {
          primaryEstablishmentId: updatedEstablishment.establishmentId,
        },
      });
    }

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'establishment',
      entityId: updatedEstablishment.establishmentId,
      action: 'establishment.updated',
      severity: 'warning',
      requestContext,
      before: {
        status: currentEstablishment.status,
        establishmentType: currentEstablishment.establishmentType,
        version: currentEstablishment.version,
      },
      after: {
        status: updatedEstablishment.status,
        establishmentType: updatedEstablishment.establishmentType,
        version: updatedEstablishment.version,
      },
    });

    return updatedEstablishment;
  }

  async transitionEstablishmentStatus(
    auth: AuthContext,
    establishmentId: string,
    action: GovernanceStatusAction,
    expectedVersion: number,
    reason: string | undefined,
    requestContext: RequestContextData,
  ) {
    const currentEstablishment = await this.getEstablishment(auth, establishmentId);
    const company = await this.repository.findCompanyById(
      auth.tenantId,
      currentEstablishment.companyId,
    );

    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Empresa nao encontrada.');
    }

    if ((action === 'inactivate' || action === 'archive') && !reason) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Justificativa obrigatoria para esta operacao.',
      );
    }

    if (
      currentEstablishment.establishmentId === company.primaryEstablishmentId &&
      currentEstablishment.isPrincipal &&
      company.status === 'active' &&
      (action === 'inactivate' || action === 'archive')
    ) {
      throw new AppError(
        409,
        'ARCHIVE_BLOCKED',
        'A matriz principal ativa nao pode ser removida enquanto a empresa estiver ativa.',
      );
    }

    const nextStatus = resolveGovernanceStatusTransition(
      currentEstablishment.status,
      action,
    );

    const updatedEstablishment = await this.repository.updateEstablishment({
      tenantId: auth.tenantId,
      establishmentId,
      expectedVersion,
      patch: {
        status: nextStatus,
      },
    });

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'establishment',
      entityId: updatedEstablishment.establishmentId,
      action: `establishment.${action}`,
      severity: 'critical',
      requestContext,
      before: {
        status: currentEstablishment.status,
        version: currentEstablishment.version,
      },
      after: {
        status: updatedEstablishment.status,
        version: updatedEstablishment.version,
      },
      metadata: {
        reason,
      },
    });

    return updatedEstablishment;
  }

  async getUserScopeGrant(auth: AuthContext, targetUserId: string) {
    return (
      (await this.repository.findUserScopeGrant(auth.tenantId, targetUserId)) ??
      this.createEmptyGrant(auth.tenantId, targetUserId)
    );
  }

  async upsertUserScopeGrant(
    auth: AuthContext,
    targetUserId: string,
    payload: UpsertUserScopeGrantRequest,
    requestContext: RequestContextData,
  ) {
    const companies = await this.repository.findAllCompanies(auth.tenantId);
    const establishments = await this.repository.findAllEstablishments(auth.tenantId);
    const companyMap = new Map(companies.map((item) => [item.companyId, item]));
    const establishmentMap = new Map(
      establishments.map((item) => [item.establishmentId, item]),
    );

    for (const companyScope of payload.companies) {
      const company = companyMap.get(companyScope.companyId);

      if (!company) {
        throw new AppError(404, 'NOT_FOUND', 'Empresa do grant nao encontrada.');
      }

      for (const establishmentId of companyScope.establishmentIds) {
        const establishment = establishmentMap.get(establishmentId);

        if (!establishment || establishment.companyId !== company.companyId) {
          throw new AppError(
            409,
            'GRANT_SCOPE_INCONSISTENT',
            'O estabelecimento informado nao pertence a empresa concedida.',
          );
        }
      }
    }

    const allowedCompanyIds = payload.companies.map((item) => item.companyId);
    const allowedEstablishmentIds = payload.companies.flatMap(
      (item) => item.establishmentIds,
    );

    if (!payload.readOnlyAllowed && !payload.defaultCompanyId) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Usuarios com escrita habilitada precisam de empresa padrao.',
      );
    }

    if (
      payload.defaultCompanyId &&
      !allowedCompanyIds.includes(payload.defaultCompanyId)
    ) {
      throw new AppError(
        409,
        'GRANT_SCOPE_INCONSISTENT',
        'A empresa padrao precisa fazer parte do grant.',
      );
    }

    if (payload.defaultEstablishmentId) {
      const defaultEstablishment = establishmentMap.get(
        payload.defaultEstablishmentId,
      );

      if (
        !defaultEstablishment ||
        defaultEstablishment.companyId !== payload.defaultCompanyId
      ) {
        throw new AppError(
          409,
          'GRANT_SCOPE_INCONSISTENT',
          'O estabelecimento padrao precisa pertencer a empresa padrao.',
        );
      }
    }

    const currentGrant =
      (await this.repository.findUserScopeGrant(auth.tenantId, targetUserId)) ??
      this.createEmptyGrant(auth.tenantId, targetUserId);
    const now = new Date().toISOString();

    const updatedGrant = await this.repository.saveUserScopeGrant(
      userScopeGrantSchema.parse({
        tenantId: auth.tenantId,
        userId: targetUserId,
        companyScopes: payload.companies,
        allowedCompanyIds,
        allowedEstablishmentIds,
        defaultCompanyId: payload.defaultCompanyId ?? null,
        defaultEstablishmentId: payload.defaultEstablishmentId ?? null,
        roleKeys: payload.roleKeys,
        permissionOverrides: payload.permissionOverrides,
        readOnlyAllowed: payload.readOnlyAllowed,
        grantsVersion: currentGrant.grantsVersion + 1,
        createdAt: currentGrant.createdAt ?? now,
        updatedAt: now,
      }),
    );

    const currentContext = await this.repository.findUserContext(
      auth.tenantId,
      targetUserId,
    );

    if (currentContext) {
      const nextReadCompanyIds = currentContext.selectedReadCompanyIds.filter(
        (companyId) => allowedCompanyIds.includes(companyId),
      );
      const nextReadEstablishmentIds =
        currentContext.selectedReadEstablishmentIds.filter((establishmentId) =>
          allowedEstablishmentIds.includes(establishmentId),
        );
      const currentWriteCompanyAllowed =
        currentContext.activeCompanyId &&
        allowedCompanyIds.includes(currentContext.activeCompanyId);
      const currentWriteEstablishmentAllowed =
        !currentContext.activeEstablishmentId ||
        allowedEstablishmentIds.includes(currentContext.activeEstablishmentId);

      await this.repository.saveUserContext(
        userContextSchema.parse({
          ...currentContext,
          activeCompanyId:
            currentWriteCompanyAllowed && currentWriteEstablishmentAllowed
              ? currentContext.activeCompanyId
              : null,
          activeEstablishmentId:
            currentWriteCompanyAllowed && currentWriteEstablishmentAllowed
              ? currentContext.activeEstablishmentId
              : null,
          selectedReadCompanyIds: nextReadCompanyIds,
          selectedReadEstablishmentIds: nextReadEstablishmentIds,
          writeEnabled:
            Boolean(currentWriteCompanyAllowed && currentWriteEstablishmentAllowed) &&
            currentContext.writeEnabled,
          lastSwitchedAt: now,
          contextVersion: currentContext.contextVersion + 1,
        }),
      );
    }

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'user_scope_grant',
      entityId: targetUserId,
      action: 'grant.updated',
      severity: 'critical',
      requestContext,
      before: {
        companyScopes: currentGrant.companyScopes,
        defaultCompanyId: currentGrant.defaultCompanyId,
        defaultEstablishmentId: currentGrant.defaultEstablishmentId,
      },
      after: {
        companyScopes: updatedGrant.companyScopes,
        defaultCompanyId: updatedGrant.defaultCompanyId,
        defaultEstablishmentId: updatedGrant.defaultEstablishmentId,
      },
      metadata: {
        justification: payload.justification,
      },
    });

    return updatedGrant;
  }

  async getAccessibleScopes(auth: AuthContext): Promise<AccessibleScopesSummary> {
    const accessProfile = await this.buildAccessProfile(auth);
    const context = await this.getCurrentContext(accessProfile, auth);

    return {
      grant: accessProfile.grant,
      context,
      companies: accessProfile.companies.map((company) => ({
        companyId: company.companyId,
        legalName: company.legalName,
        status: company.status,
        establishments: accessProfile.establishments
          .filter((item) => item.companyId === company.companyId)
          .map((item) => ({
            establishmentId: item.establishmentId,
            companyId: item.companyId,
            legalNameAtEstablishment: item.legalNameAtEstablishment,
            establishmentType: item.establishmentType,
            status: item.status,
          })),
      })),
    };
  }

  async getUserContext(auth: AuthContext) {
    const accessProfile = await this.buildAccessProfile(auth);
    return this.getCurrentContext(accessProfile, auth);
  }

  async switchOperationalContext(
    auth: AuthContext,
    payload: SwitchOperationalContextRequest,
    requestContext: RequestContextData,
  ) {
    const accessProfile = await this.buildAccessProfile(auth);

    if (payload.writeEnabled && !payload.activeCompanyId) {
      throw new AppError(
        403,
        'CONTEXT_SCOPE_INVALID',
        'Contexto de escrita exige empresa ativa.',
      );
    }

    if (
      payload.activeCompanyId &&
      !this.isCompanyAllowed(accessProfile.grant, payload.activeCompanyId)
    ) {
      throw new AppError(
        403,
        'CONTEXT_SCOPE_INVALID',
        'A empresa informada nao pertence ao grant do usuario.',
      );
    }

    if (payload.activeEstablishmentId) {
      const establishment = accessProfile.establishments.find(
        (item) => item.establishmentId === payload.activeEstablishmentId,
      );

      if (
        !establishment ||
        establishment.companyId !== payload.activeCompanyId
      ) {
        throw new AppError(
          403,
          'CONTEXT_SCOPE_INVALID',
          'O estabelecimento informado nao pertence ao escopo permitido.',
        );
      }
    }

    for (const companyId of payload.selectedReadCompanyIds) {
      if (!this.isCompanyAllowed(accessProfile.grant, companyId)) {
        throw new AppError(
          403,
          'CONTEXT_SCOPE_INVALID',
          'O escopo de leitura solicitado excede o grant do usuario.',
        );
      }
    }

    for (const establishmentId of payload.selectedReadEstablishmentIds) {
      const establishment = accessProfile.establishments.find(
        (item) => item.establishmentId === establishmentId,
      );

      if (
        !establishment ||
        (payload.selectedReadCompanyIds.length > 0 &&
          !payload.selectedReadCompanyIds.includes(establishment.companyId))
      ) {
        throw new AppError(
          403,
          'CONTEXT_SCOPE_INVALID',
          'O estabelecimento de leitura nao pertence ao escopo selecionado.',
        );
      }
    }

    const currentContext = await this.repository.findUserContext(
      auth.tenantId,
      auth.uid,
    );
    const now = new Date().toISOString();

    const nextContext = await this.repository.saveUserContext(
      userContextSchema.parse({
        tenantId: auth.tenantId,
        userId: auth.uid,
        activeCompanyId: payload.writeEnabled ? payload.activeCompanyId ?? null : null,
        activeEstablishmentId: payload.writeEnabled
          ? payload.activeEstablishmentId ?? null
          : null,
        selectedReadCompanyIds: payload.selectedReadCompanyIds,
        selectedReadEstablishmentIds: payload.selectedReadEstablishmentIds,
        writeEnabled: payload.writeEnabled,
        lastSwitchedAt: now,
        contextVersion: (currentContext?.contextVersion ?? 0) + 1,
      }),
    );

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'user_context',
      entityId: auth.uid,
      action: 'context.switched',
      severity: 'warning',
      requestContext,
      before: currentContext
        ? {
            activeCompanyId: currentContext.activeCompanyId,
            activeEstablishmentId: currentContext.activeEstablishmentId,
            writeEnabled: currentContext.writeEnabled,
          }
        : undefined,
      after: {
        activeCompanyId: nextContext.activeCompanyId,
        activeEstablishmentId: nextContext.activeEstablishmentId,
        writeEnabled: nextContext.writeEnabled,
      },
    });

    return nextContext;
  }

  async listSharingPolicies(auth: AuthContext, query: ListSharingPoliciesQuery) {
    const accessProfile = await this.buildAccessProfile(auth);
    const filteredItems = (await this.repository.findAllSharingPolicies(auth.tenantId))
      .filter((policy) => {
        if (
          !accessProfile.isPlatformAdmin &&
          !policy.participantCompanyIds.every((companyId) =>
            this.isCompanyAllowed(accessProfile.grant, companyId),
          )
        ) {
          return false;
        }

        if (query.domainKey && policy.domainKey !== query.domainKey) {
          return false;
        }

        if (query.status && policy.status !== query.status) {
          return false;
        }

        return true;
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return paginateItems(filteredItems, query.page, query.pageSize);
  }

  async createSharingPolicy(
    auth: AuthContext,
    payload: CreateSharingPolicyRequest,
    requestContext: RequestContextData,
  ) {
    if (
      payload.shareMode === 'SINGLE_MASTER' &&
      (!payload.masterCompanyId ||
        !payload.participantCompanyIds.includes(payload.masterCompanyId))
    ) {
      throw new AppError(
        422,
        'SHARING_POLICY_INVALID',
        'Politica SINGLE_MASTER exige empresa mestre participante.',
      );
    }

    const companies = await this.repository.findAllCompanies(auth.tenantId);
    const companyIds = new Set(companies.map((item) => item.companyId));

    for (const companyId of payload.participantCompanyIds) {
      if (!companyIds.has(companyId)) {
        throw new AppError(
          404,
          'NOT_FOUND',
          'Empresa participante da politica nao encontrada.',
        );
      }
    }

    const now = new Date().toISOString();
    const savedPolicy = await this.repository.createSharingPolicy({
      ...payload,
      policyId: generateId('shp'),
      tenantId: auth.tenantId,
      masterCompanyId: payload.masterCompanyId ?? null,
      policyConfig: payload.policyConfig,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'sharing_policy',
      entityId: savedPolicy.policyId,
      action: 'sharing_policy.created',
      severity: 'critical',
      requestContext,
      after: {
        domainKey: savedPolicy.domainKey,
        scopeType: savedPolicy.scopeType,
        shareMode: savedPolicy.shareMode,
      },
    });

    return savedPolicy;
  }

  async updateSharingPolicy(
    auth: AuthContext,
    policyId: string,
    payload: UpdateSharingPolicyRequest,
    requestContext: RequestContextData,
  ) {
    const currentPolicy = await this.repository.findSharingPolicyById(
      auth.tenantId,
      policyId,
    );

    if (!currentPolicy) {
      throw new AppError(404, 'NOT_FOUND', 'Politica nao encontrada.');
    }

    const nextShareMode = payload.shareMode ?? currentPolicy.shareMode;
    const nextParticipantCompanyIds =
      payload.participantCompanyIds ?? currentPolicy.participantCompanyIds;
    const nextMasterCompanyId =
      payload.masterCompanyId ?? currentPolicy.masterCompanyId;

    if (
      nextShareMode === 'SINGLE_MASTER' &&
      (!nextMasterCompanyId ||
        !nextParticipantCompanyIds.includes(nextMasterCompanyId))
    ) {
      throw new AppError(
        422,
        'SHARING_POLICY_INVALID',
        'Politica SINGLE_MASTER exige empresa mestre participante.',
      );
    }

    const patch = {
      ...payload,
    };

    delete (patch as Record<string, unknown>).expectedVersion;

    const updatedPolicy = await this.repository.updateSharingPolicy({
      tenantId: auth.tenantId,
      policyId,
      expectedVersion: payload.expectedVersion,
      patch,
    });

    await this.writeAuditEvent({
      tenantId: auth.tenantId,
      actorUserId: auth.uid,
      entityType: 'sharing_policy',
      entityId: updatedPolicy.policyId,
      action: 'sharing_policy.updated',
      severity: 'critical',
      requestContext,
      before: {
        shareMode: currentPolicy.shareMode,
        status: currentPolicy.status,
        version: currentPolicy.version,
      },
      after: {
        shareMode: updatedPolicy.shareMode,
        status: updatedPolicy.status,
        version: updatedPolicy.version,
      },
    });

    return updatedPolicy;
  }

  async getConsolidatedOverview(auth: AuthContext): Promise<ConsolidatedOverview> {
    const accessProfile = await this.buildAccessProfile(auth);
    const context = await this.getCurrentContext(accessProfile, auth);
    const selectedReadCompanyIds =
      context.selectedReadCompanyIds.length > 0
        ? context.selectedReadCompanyIds
        : accessProfile.companies.map((company) => company.companyId);
    const selectedReadEstablishmentIds =
      context.selectedReadEstablishmentIds.length > 0
        ? context.selectedReadEstablishmentIds
        : accessProfile.establishments
            .filter((establishment) =>
              selectedReadCompanyIds.includes(establishment.companyId),
            )
            .map((establishment) => establishment.establishmentId);
    const activeCompanies = accessProfile.companies.filter(
      (company) =>
        company.status === 'active' &&
        selectedReadCompanyIds.includes(company.companyId),
    );
    const activeEstablishments = accessProfile.establishments.filter(
      (establishment) =>
        establishment.status === 'active' &&
        selectedReadEstablishmentIds.includes(establishment.establishmentId),
    );
    const latestRun = (await this.repository.findAllConsolidationRuns(auth.tenantId))
      .filter((run) =>
        run.participantCompanyIds.every((companyId) =>
          selectedReadCompanyIds.includes(companyId),
        ),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

    return {
      writeContextCompanyId: context.activeCompanyId ?? null,
      writeContextEstablishmentId: context.activeEstablishmentId ?? null,
      selectedReadCompanyIds,
      selectedReadEstablishmentIds,
      activeCompanyCount: activeCompanies.length,
      activeEstablishmentCount: activeEstablishments.length,
      latestRunStatus: latestRun?.status ?? null,
      companyStatuses: activeCompanies.map((company) => ({
        companyId: company.companyId,
        status: company.status,
      })),
    };
  }

  async listConsolidationRuns(
    auth: AuthContext,
    query: ListConsolidationRunsQuery,
  ) {
    const accessProfile = await this.buildAccessProfile(auth);
    const allowedCompanyIds = accessProfile.companies.map(
      (company) => company.companyId,
    );
    const filteredItems = (await this.repository.findAllConsolidationRuns(auth.tenantId))
      .filter((run) =>
        run.participantCompanyIds.every((companyId) =>
          allowedCompanyIds.includes(companyId),
        ),
      )
      .filter((run) => {
        if (query.status && run.status !== query.status) {
          return false;
        }

        if (query.requestedBy && run.requestedBy !== query.requestedBy) {
          return false;
        }

        return true;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return paginateItems(filteredItems, query.page, query.pageSize);
  }

  async getConsolidationRun(auth: AuthContext, runId: string) {
    const accessProfile = await this.buildAccessProfile(auth);
    const allowedCompanyIds = accessProfile.companies.map(
      (company) => company.companyId,
    );
    const run = await this.repository.findConsolidationRunById(auth.tenantId, runId);

    if (!run) {
      throw new AppError(404, 'NOT_FOUND', 'Run de consolidacao nao encontrada.');
    }

    if (
      !run.participantCompanyIds.every((companyId) =>
        allowedCompanyIds.includes(companyId),
      )
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Voce nao possui acesso a esta consolidacao.',
      );
    }

    return run;
  }

  async createConsolidationRun(
    auth: AuthContext,
    payload: CreateConsolidationRunRequest,
    idempotencyKey: string,
    requestContext: RequestContextData,
  ) {
    const accessProfile = await this.buildAccessProfile(auth);
    const fingerprint = JSON.stringify(payload);

    return this.withIdempotency({
      scope: `${auth.tenantId}:consolidation:create:${idempotencyKey}`,
      fingerprint,
      statusCode: 201,
      factory: async () => {
        const companyMap = new Map(
          accessProfile.companies.map((company) => [company.companyId, company]),
        );
        const accessibleEstablishmentIds = new Set(
          accessProfile.establishments.map((item) => item.establishmentId),
        );

        for (const companyId of payload.participantCompanyIds) {
          if (!companyMap.has(companyId)) {
            throw new AppError(
              403,
              'FORBIDDEN',
              'A consolidacao inclui empresa fora do grant do usuario.',
            );
          }
        }

        for (const establishmentId of payload.participantEstablishmentIds) {
          if (!accessibleEstablishmentIds.has(establishmentId)) {
            throw new AppError(
              403,
              'FORBIDDEN',
              'A consolidacao inclui estabelecimento fora do grant do usuario.',
            );
          }
        }

        const issues: ConsolidationIssue[] = [];

        for (const companyId of payload.participantCompanyIds) {
          const company = companyMap.get(companyId);

          if (!company) {
            continue;
          }

          if (company.status !== 'active') {
            issues.push({
              code: 'COMPANY_INACTIVE',
              message: `A empresa ${company.legalName} precisa estar ativa.`,
              blocking: true,
              companyId,
            });
          }

          if (company.fiscalCalendarId !== payload.fiscalCalendarId) {
            issues.push({
              code: 'CALENDAR_MISMATCH',
              message: `A empresa ${company.legalName} usa calendario fiscal diferente do informado.`,
              blocking: true,
              companyId,
            });
          }

          if (company.consolidationMode !== 'FULL') {
            issues.push({
              code: 'CONSOLIDATION_MODE_INVALID',
              message: `A empresa ${company.legalName} nao esta elegivel para consolidacao FULL.`,
              blocking: true,
              companyId,
            });
          }

          if (!company.primaryEstablishmentId) {
            issues.push({
              code: 'PRIMARY_ESTABLISHMENT_MISSING',
              message: `A empresa ${company.legalName} nao possui matriz principal definida.`,
              blocking: true,
              companyId,
            });
          }
        }

        const validationSummary = {
          blockingIssueCount: issues.filter((item) => item.blocking).length,
          warningCount: issues.filter((item) => !item.blocking).length,
          issues,
        };

        const initialStatus =
          validationSummary.blockingIssueCount > 0
            ? resolveConsolidationRunTransition('draft', 'block')
            : resolveConsolidationRunTransition('draft', 'queue');
        const now = new Date().toISOString();

        const savedRun = await this.repository.createConsolidationRun(
          consolidationRunSchema.parse({
            ...payload,
            runId: generateId('crn'),
            tenantId: auth.tenantId,
            status: initialStatus,
            validationSummary,
            resultSummary:
              initialStatus === 'queued'
                ? {
                    participantCompanyCount: payload.participantCompanyIds.length,
                    participantEstablishmentCount:
                      payload.participantEstablishmentIds.length,
                    includedCompanyIds: payload.participantCompanyIds,
                    totalIssues: validationSummary.issues.length,
                  }
                : null,
            errorSummary: null,
            requestedBy: auth.uid,
            startedAt: null,
            completedAt: null,
            idempotencyKey,
            createdAt: now,
            updatedAt: now,
            version: 1,
          }),
        );

        await this.writeAuditEvent({
          tenantId: auth.tenantId,
          actorUserId: auth.uid,
          entityType: 'consolidation_run',
          entityId: savedRun.runId,
          action: 'consolidation.run.created',
          severity: 'critical',
          requestContext,
          after: {
            status: savedRun.status,
            participantCompanyIds: savedRun.participantCompanyIds,
            periodStart: savedRun.periodStart,
            periodEnd: savedRun.periodEnd,
          },
        });

        return savedRun;
      },
    });
  }
}
