import type {
  Company,
  ConsolidationRun,
  Establishment,
  SharingPolicy,
  UserContext,
  UserScopeGrant,
} from '@eixoone/shared-contracts';

export type CompanyUpdatePatch = Partial<
  Omit<
    Company,
    | 'companyId'
    | 'tenantId'
    | 'createdAt'
    | 'updatedAt'
    | 'version'
  >
>;

export type EstablishmentUpdatePatch = Partial<
  Omit<
    Establishment,
    | 'establishmentId'
    | 'tenantId'
    | 'companyId'
    | 'createdAt'
    | 'updatedAt'
    | 'version'
  >
>;

export type SharingPolicyUpdatePatch = Partial<
  Omit<
    SharingPolicy,
    | 'policyId'
    | 'tenantId'
    | 'createdAt'
    | 'updatedAt'
    | 'version'
  >
>;

export interface GovernanceRepository {
  findAllCompanies(tenantId: string): Promise<Company[]>;
  findCompanyById(tenantId: string, companyId: string): Promise<Company | null>;
  findCompanyByRootRegistration(
    tenantId: string,
    companyRootRegistration: string,
  ): Promise<Company | null>;
  createCompany(company: Company): Promise<Company>;
  updateCompany(input: {
    tenantId: string;
    companyId: string;
    expectedVersion: number;
    patch: CompanyUpdatePatch;
  }): Promise<Company>;

  findAllEstablishments(tenantId: string): Promise<Establishment[]>;
  findEstablishmentById(
    tenantId: string,
    establishmentId: string,
  ): Promise<Establishment | null>;
  findEstablishmentByRegistrationNumber(
    tenantId: string,
    registrationNumber: string,
  ): Promise<Establishment | null>;
  createEstablishment(establishment: Establishment): Promise<Establishment>;
  updateEstablishment(input: {
    tenantId: string;
    establishmentId: string;
    expectedVersion: number;
    patch: EstablishmentUpdatePatch;
  }): Promise<Establishment>;

  findUserScopeGrant(
    tenantId: string,
    userId: string,
  ): Promise<UserScopeGrant | null>;
  saveUserScopeGrant(grant: UserScopeGrant): Promise<UserScopeGrant>;

  findUserContext(tenantId: string, userId: string): Promise<UserContext | null>;
  saveUserContext(context: UserContext): Promise<UserContext>;

  findAllSharingPolicies(tenantId: string): Promise<SharingPolicy[]>;
  findSharingPolicyById(
    tenantId: string,
    policyId: string,
  ): Promise<SharingPolicy | null>;
  createSharingPolicy(policy: SharingPolicy): Promise<SharingPolicy>;
  updateSharingPolicy(input: {
    tenantId: string;
    policyId: string;
    expectedVersion: number;
    patch: SharingPolicyUpdatePatch;
  }): Promise<SharingPolicy>;

  findAllConsolidationRuns(tenantId: string): Promise<ConsolidationRun[]>;
  findConsolidationRunById(
    tenantId: string,
    runId: string,
  ): Promise<ConsolidationRun | null>;
  createConsolidationRun(run: ConsolidationRun): Promise<ConsolidationRun>;

  isReady(): Promise<boolean>;
}
