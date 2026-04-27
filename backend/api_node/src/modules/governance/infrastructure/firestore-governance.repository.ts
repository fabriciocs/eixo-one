import {
  FieldPath,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase-admin/firestore';
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
import { sanitizeFirestoreData } from '../../../integrations/firebase/firestore-sanitize.js';
import type {
  CompanyUpdatePatch,
  EstablishmentUpdatePatch,
  GovernanceRepository,
  SharingPolicyUpdatePatch,
} from '../application/governance-repository.js';

type VersionedRecord = {
  tenantId: string;
  version: number;
  updatedAt: string;
};

export class FirestoreGovernanceRepository implements GovernanceRepository {
  constructor(private readonly firestore: Firestore) {}

  private isAlreadyExistsError(error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
    return code === '6' || code === 'already-exists';
  }

  private isFailedPreconditionError(error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
    return code === '9' || code === 'failed-precondition';
  }

  private domainDocument(tenantId: string) {
    return this.firestore
      .collection('tenants')
      .doc(tenantId)
      .collection('domains')
      .doc('governance');
  }

  private companiesCollection(tenantId: string) {
    return this.domainDocument(tenantId).collection('companies');
  }

  private establishmentsCollection(tenantId: string) {
    return this.domainDocument(tenantId).collection('establishments');
  }

  private userScopeGrantsCollection(tenantId: string) {
    return this.domainDocument(tenantId).collection('user_scope_grants');
  }

  private userContextsCollection(tenantId: string) {
    return this.domainDocument(tenantId).collection('user_contexts');
  }

  private sharingPoliciesCollection(tenantId: string) {
    return this.domainDocument(tenantId).collection('sharing_policies');
  }

  private consolidationRunsCollection(tenantId: string) {
    return this.domainDocument(tenantId).collection('consolidation_runs');
  }

  private async listCollection<T>(
    collectionReference: CollectionReference,
    parser: (data: DocumentData | undefined) => T,
  ) {
    const snapshot = await collectionReference.get();
    return snapshot.docs.map((documentSnapshot) => parser(documentSnapshot.data()));
  }

  private async findById<T>(
    documentReference: DocumentReference,
    parser: (data: DocumentData | undefined) => T,
  ) {
    const snapshot = await documentReference.get();

    if (!snapshot.exists) {
      return null;
    }

    return parser(snapshot.data());
  }

  private async updateVersionedDocument<T extends VersionedRecord>(
    input: {
      documentReference: DocumentReference;
      parser: (data: DocumentData | undefined) => T;
      expectedVersion: number;
      patch: Record<string, unknown>;
      notFoundMessage: string;
      versionConflictMessage: string;
    },
  ) {
    const snapshot = await input.documentReference.get();

    if (!snapshot.exists) {
      throw new AppError(404, 'NOT_FOUND', input.notFoundMessage);
    }

    const current = input.parser(snapshot.data());

    if (current.version !== input.expectedVersion) {
      throw new AppError(
        409,
        'VERSION_CONFLICT',
        input.versionConflictMessage,
      );
    }

    const updated = input.parser({
      ...current,
      ...input.patch,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    });

    try {
      await input.documentReference.update(
        sanitizeFirestoreData(updated) as unknown as DocumentData,
        { lastUpdateTime: snapshot.updateTime },
      );
    } catch (error) {
      if (this.isFailedPreconditionError(error)) {
        throw new AppError(
          409,
          'VERSION_CONFLICT',
          input.versionConflictMessage,
        );
      }

      throw error;
    }

    return updated;
  }

  private async createDocument<T>(
    documentReference: DocumentReference,
    parser: (data: DocumentData | undefined) => T,
    entity: T,
    duplicateMessage: string,
  ) {
    const parsed = parser(entity as DocumentData);

    try {
      await documentReference.create(
        sanitizeFirestoreData(parsed) as unknown as DocumentData,
      );
    } catch (error) {
      if (this.isAlreadyExistsError(error)) {
        throw new AppError(409, 'DUPLICATE_RECORD', duplicateMessage);
      }

      throw error;
    }

    return parsed;
  }

  async findAllCompanies(tenantId: string): Promise<Company[]> {
    return this.listCollection(this.companiesCollection(tenantId), (data) =>
      companySchema.parse(data) as Company,
    );
  }

  async findCompanyById(
    tenantId: string,
    companyId: string,
  ): Promise<Company | null> {
    return this.findById(
      this.companiesCollection(tenantId).doc(companyId),
      (data) => companySchema.parse(data) as Company,
    );
  }

  async findCompanyByRootRegistration(
    tenantId: string,
    companyRootRegistration: string,
  ): Promise<Company | null> {
    const snapshot = await this.companiesCollection(tenantId)
      .where('companyRootRegistration', '==', companyRootRegistration)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return companySchema.parse(snapshot.docs[0]?.data()) as Company;
  }

  async createCompany(company: Company): Promise<Company> {
    return this.createDocument(
      this.companiesCollection(company.tenantId).doc(company.companyId),
      (data) => companySchema.parse(data) as Company,
      company,
      'Empresa ja cadastrada.',
    );
  }

  async updateCompany(input: {
    tenantId: string;
    companyId: string;
    expectedVersion: number;
    patch: CompanyUpdatePatch;
  }): Promise<Company> {
    return this.updateVersionedDocument({
      documentReference: this.companiesCollection(input.tenantId).doc(
        input.companyId,
      ),
      parser: (data) => companySchema.parse(data) as Company,
      expectedVersion: input.expectedVersion,
      patch: input.patch as Record<string, unknown>,
      notFoundMessage: 'Empresa nao encontrada.',
      versionConflictMessage: 'Versao da empresa desatualizada.',
    });
  }

  async findAllEstablishments(tenantId: string): Promise<Establishment[]> {
    return this.listCollection(
      this.establishmentsCollection(tenantId),
      (data) => establishmentSchema.parse(data) as Establishment,
    );
  }

  async findEstablishmentById(
    tenantId: string,
    establishmentId: string,
  ): Promise<Establishment | null> {
    return this.findById(
      this.establishmentsCollection(tenantId).doc(establishmentId),
      (data) => establishmentSchema.parse(data) as Establishment,
    );
  }

  async findEstablishmentByRegistrationNumber(
    tenantId: string,
    registrationNumber: string,
  ): Promise<Establishment | null> {
    const snapshot = await this.establishmentsCollection(tenantId)
      .where('registrationNumber', '==', registrationNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return establishmentSchema.parse(snapshot.docs[0]?.data()) as Establishment;
  }

  async createEstablishment(
    establishment: Establishment,
  ): Promise<Establishment> {
    return this.createDocument(
      this.establishmentsCollection(establishment.tenantId).doc(
        establishment.establishmentId,
      ),
      (data) => establishmentSchema.parse(data) as Establishment,
      establishment,
      'Estabelecimento ja cadastrado.',
    );
  }

  async updateEstablishment(input: {
    tenantId: string;
    establishmentId: string;
    expectedVersion: number;
    patch: EstablishmentUpdatePatch;
  }): Promise<Establishment> {
    return this.updateVersionedDocument({
      documentReference: this.establishmentsCollection(input.tenantId).doc(
        input.establishmentId,
      ),
      parser: (data) => establishmentSchema.parse(data) as Establishment,
      expectedVersion: input.expectedVersion,
      patch: input.patch as Record<string, unknown>,
      notFoundMessage: 'Estabelecimento nao encontrado.',
      versionConflictMessage: 'Versao do estabelecimento desatualizada.',
    });
  }

  async findUserScopeGrant(
    tenantId: string,
    userId: string,
  ): Promise<UserScopeGrant | null> {
    return this.findById(
      this.userScopeGrantsCollection(tenantId).doc(userId),
      (data) => userScopeGrantSchema.parse(data) as UserScopeGrant,
    );
  }

  async saveUserScopeGrant(grant: UserScopeGrant): Promise<UserScopeGrant> {
    const parsed = userScopeGrantSchema.parse(grant) as UserScopeGrant;
    await this.userScopeGrantsCollection(parsed.tenantId)
      .doc(parsed.userId)
      .set(sanitizeFirestoreData(parsed) as unknown as DocumentData, {
        merge: false,
      });
    return parsed;
  }

  async findUserContext(
    tenantId: string,
    userId: string,
  ): Promise<UserContext | null> {
    return this.findById(
      this.userContextsCollection(tenantId).doc(userId),
      (data) => userContextSchema.parse(data) as UserContext,
    );
  }

  async saveUserContext(context: UserContext): Promise<UserContext> {
    const parsed = userContextSchema.parse(context) as UserContext;
    await this.userContextsCollection(parsed.tenantId)
      .doc(parsed.userId)
      .set(sanitizeFirestoreData(parsed) as unknown as DocumentData, {
        merge: false,
      });
    return parsed;
  }

  async findAllSharingPolicies(tenantId: string): Promise<SharingPolicy[]> {
    return this.listCollection(
      this.sharingPoliciesCollection(tenantId),
      (data) => sharingPolicySchema.parse(data) as SharingPolicy,
    );
  }

  async findSharingPolicyById(
    tenantId: string,
    policyId: string,
  ): Promise<SharingPolicy | null> {
    return this.findById(
      this.sharingPoliciesCollection(tenantId).doc(policyId),
      (data) => sharingPolicySchema.parse(data) as SharingPolicy,
    );
  }

  async createSharingPolicy(policy: SharingPolicy): Promise<SharingPolicy> {
    return this.createDocument(
      this.sharingPoliciesCollection(policy.tenantId).doc(policy.policyId),
      (data) => sharingPolicySchema.parse(data) as SharingPolicy,
      policy,
      'Politica ja cadastrada.',
    );
  }

  async updateSharingPolicy(input: {
    tenantId: string;
    policyId: string;
    expectedVersion: number;
    patch: SharingPolicyUpdatePatch;
  }): Promise<SharingPolicy> {
    return this.updateVersionedDocument({
      documentReference: this.sharingPoliciesCollection(input.tenantId).doc(
        input.policyId,
      ),
      parser: (data) => sharingPolicySchema.parse(data) as SharingPolicy,
      expectedVersion: input.expectedVersion,
      patch: input.patch as Record<string, unknown>,
      notFoundMessage: 'Politica nao encontrada.',
      versionConflictMessage: 'Versao da politica desatualizada.',
    });
  }

  async findAllConsolidationRuns(
    tenantId: string,
  ): Promise<ConsolidationRun[]> {
    return this.listCollection(
      this.consolidationRunsCollection(tenantId),
      (data) => consolidationRunSchema.parse(data) as ConsolidationRun,
    );
  }

  async findConsolidationRunById(
    tenantId: string,
    runId: string,
  ): Promise<ConsolidationRun | null> {
    return this.findById(
      this.consolidationRunsCollection(tenantId).doc(runId),
      (data) => consolidationRunSchema.parse(data) as ConsolidationRun,
    );
  }

  async createConsolidationRun(
    run: ConsolidationRun,
  ): Promise<ConsolidationRun> {
    return this.createDocument(
      this.consolidationRunsCollection(run.tenantId).doc(run.runId),
      (data) => consolidationRunSchema.parse(data) as ConsolidationRun,
      run,
      'Run de consolidacao ja cadastrada.',
    );
  }

  async isReady() {
    try {
      await this.firestore
        .collection('tenants')
        .limit(1)
        .select(FieldPath.documentId())
        .get();
      return true;
    } catch {
      return false;
    }
  }
}
