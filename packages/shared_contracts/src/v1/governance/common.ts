import { z } from 'zod';

const governanceIdentifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{2,63}$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const governanceRecordStatusSchema = z.enum([
  'draft',
  'active',
  'inactive',
  'archived',
]);

export const establishmentTypeSchema = z.enum(['MATRIX', 'BRANCH']);

export const sharingScopeTypeSchema = z.enum([
  'GLOBAL',
  'COMPANY',
  'ESTABLISHMENT',
]);

export const shareModeSchema = z.enum([
  'NONE',
  'SINGLE_MASTER',
  'REPLICATED',
]);

export const sharingPolicyStatusSchema = z.enum([
  'draft',
  'active',
  'inactive',
]);

export const consolidationRunStatusSchema = z.enum([
  'draft',
  'queued',
  'blocked',
  'processing',
  'completed',
  'completed_with_divergences',
  'failed',
]);

export const companyIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(governanceIdentifierPattern, 'companyId invalido.');

export const establishmentIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(governanceIdentifierPattern, 'establishmentId invalido.');

export const sharingPolicyIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(governanceIdentifierPattern, 'sharingPolicyId invalido.');

export const consolidationRunIdSchema = z
  .string()
  .trim()
  .min(5)
  .max(64)
  .regex(governanceIdentifierPattern, 'consolidationRunId invalido.');

export const governanceDomainKeySchema = z.string().trim().min(2).max(80);

export const legalNameSchema = z.string().trim().min(3).max(200);
export const tradeNameSchema = z.string().trim().min(2).max(120);
export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'countryCode invalido.');
export const isoDateSchema = z
  .string()
  .trim()
  .regex(isoDatePattern, 'Data invalida. Use YYYY-MM-DD.');
export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3, 'currencyCode invalido.');
export const registrationCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .transform((value) => value.replace(/\s+/g, '').toUpperCase());

export const governanceSearchSchema = z.string().trim().min(2).max(120);

export const governanceStatusTransitionBodySchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  reason: z.string().trim().min(8).max(240).optional(),
});

export const governancePermissionValues = [
  'governance.company.read',
  'governance.company.create',
  'governance.company.update',
  'governance.company.activate',
  'governance.company.inactivate',
  'governance.company.archive',
  'governance.establishment.read',
  'governance.establishment.create',
  'governance.establishment.update',
  'governance.establishment.activate',
  'governance.establishment.inactivate',
  'governance.establishment.archive',
  'governance.user_scope.manage',
  'governance.context.switch',
  'governance.sharing.policy.manage',
  'governance.consolidation.read',
  'governance.consolidation.run',
  'governance.consolidation.reprocess',
  'reporting.consolidated.read',
  'audit.read',
] as const;

export const governancePermissionSchema = z.enum(governancePermissionValues);

export const governancePermissions = {
  companyRead: 'governance.company.read',
  companyCreate: 'governance.company.create',
  companyUpdate: 'governance.company.update',
  companyActivate: 'governance.company.activate',
  companyInactivate: 'governance.company.inactivate',
  companyArchive: 'governance.company.archive',
  establishmentRead: 'governance.establishment.read',
  establishmentCreate: 'governance.establishment.create',
  establishmentUpdate: 'governance.establishment.update',
  establishmentActivate: 'governance.establishment.activate',
  establishmentInactivate: 'governance.establishment.inactivate',
  establishmentArchive: 'governance.establishment.archive',
  userScopeManage: 'governance.user_scope.manage',
  contextSwitch: 'governance.context.switch',
  sharingPolicyManage: 'governance.sharing.policy.manage',
  consolidationRead: 'governance.consolidation.read',
  consolidationRun: 'governance.consolidation.run',
  consolidationReprocess: 'governance.consolidation.reprocess',
  consolidatedRead: 'reporting.consolidated.read',
  auditRead: 'audit.read',
} as const;

export type GovernanceRecordStatus = z.infer<
  typeof governanceRecordStatusSchema
>;
export type EstablishmentType = z.infer<typeof establishmentTypeSchema>;
export type SharingScopeType = z.infer<typeof sharingScopeTypeSchema>;
export type ShareMode = z.infer<typeof shareModeSchema>;
export type SharingPolicyStatus = z.infer<typeof sharingPolicyStatusSchema>;
export type ConsolidationRunStatus = z.infer<
  typeof consolidationRunStatusSchema
>;
export type GovernancePermission = z.infer<typeof governancePermissionSchema>;
