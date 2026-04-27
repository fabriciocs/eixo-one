import { z } from 'zod';

import { successEnvelopeSchema } from '../api-response.js';
import { entityMetadataSchema, paginationQuerySchema, userIdSchema } from '../metadata.js';
import {
  companyIdSchema,
  consolidationRunIdSchema,
  consolidationRunStatusSchema,
  currencyCodeSchema,
  establishmentIdSchema,
  governanceRecordStatusSchema,
  isoDateSchema,
} from './common.js';

export const consolidationIssueSchema = z.object({
  code: z.string().trim().min(2).max(80),
  message: z.string().trim().min(4).max(240),
  blocking: z.boolean(),
  companyId: companyIdSchema.optional(),
  field: z.string().trim().min(2).max(120).optional(),
});

export const consolidationValidationSummarySchema = z.object({
  blockingIssueCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
  issues: z.array(consolidationIssueSchema).default([]),
});

export const consolidationResultSummarySchema = z.object({
  participantCompanyCount: z.number().int().nonnegative(),
  participantEstablishmentCount: z.number().int().nonnegative(),
  includedCompanyIds: z.array(companyIdSchema).default([]),
  totalIssues: z.number().int().nonnegative(),
});

export const consolidationRunSchema = entityMetadataSchema.extend({
  runId: consolidationRunIdSchema,
  participantCompanyIds: z.array(companyIdSchema).min(2).max(200),
  participantEstablishmentIds: z.array(establishmentIdSchema).max(500).default([]),
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  fiscalCalendarId: z.string().trim().min(2).max(64),
  currencyCode: currencyCodeSchema,
  fxPolicy: z.record(z.unknown()),
  percentagePolicy: z.record(z.unknown()),
  eliminationMode: z.string().trim().min(2).max(40),
  status: consolidationRunStatusSchema,
  validationSummary: consolidationValidationSummarySchema,
  resultSummary: consolidationResultSummarySchema.nullable().optional(),
  errorSummary: z.record(z.unknown()).nullable().optional(),
  requestedBy: userIdSchema,
  startedAt: z.string().datetime({ offset: true }).nullable().optional(),
  completedAt: z.string().datetime({ offset: true }).nullable().optional(),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export const createConsolidationRunRequestSchema = z.object({
  participantCompanyIds: z.array(companyIdSchema).min(2).max(200),
  participantEstablishmentIds: z.array(establishmentIdSchema).max(500).default([]),
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  fiscalCalendarId: z.string().trim().min(2).max(64),
  currencyCode: currencyCodeSchema,
  fxPolicy: z.record(z.unknown()),
  percentagePolicy: z.record(z.unknown()),
  eliminationMode: z.string().trim().min(2).max(40),
  notes: z.string().trim().min(4).max(240).optional(),
});

export const listConsolidationRunsQuerySchema = paginationQuerySchema.extend({
  status: consolidationRunStatusSchema.optional(),
  requestedBy: userIdSchema.optional(),
});

export const consolidatedOverviewSchema = z.object({
  writeContextCompanyId: companyIdSchema.nullable().optional(),
  writeContextEstablishmentId: establishmentIdSchema.nullable().optional(),
  selectedReadCompanyIds: z.array(companyIdSchema).default([]),
  selectedReadEstablishmentIds: z.array(establishmentIdSchema).default([]),
  activeCompanyCount: z.number().int().nonnegative(),
  activeEstablishmentCount: z.number().int().nonnegative(),
  latestRunStatus: consolidationRunStatusSchema.nullable().optional(),
  companyStatuses: z.array(
    z.object({
      companyId: companyIdSchema,
      status: governanceRecordStatusSchema,
    }),
  ),
});

export const consolidationRunResponseSchema = successEnvelopeSchema(
  consolidationRunSchema,
);

export const listConsolidationRunsResponseSchema = successEnvelopeSchema(
  z.object({
    items: z.array(consolidationRunSchema),
  }),
);

export const consolidatedOverviewResponseSchema = successEnvelopeSchema(
  consolidatedOverviewSchema,
);

export type ConsolidationIssue = z.infer<typeof consolidationIssueSchema>;
export type ConsolidationValidationSummary = z.infer<
  typeof consolidationValidationSummarySchema
>;
export type ConsolidationResultSummary = z.infer<
  typeof consolidationResultSummarySchema
>;
export type ConsolidationRun = z.infer<typeof consolidationRunSchema>;
export type CreateConsolidationRunRequest = z.infer<
  typeof createConsolidationRunRequestSchema
>;
export type ListConsolidationRunsQuery = z.infer<
  typeof listConsolidationRunsQuerySchema
>;
export type ConsolidatedOverview = z.infer<typeof consolidatedOverviewSchema>;
