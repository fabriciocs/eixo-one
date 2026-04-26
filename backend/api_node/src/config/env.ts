import 'dotenv/config';

import { z } from 'zod';

const explicitDataMode = process.env.DATA_MODE?.trim();
const defaultDataMode: 'memory' | 'firebase' =
  explicitDataMode === 'memory' || explicitDataMode === 'firebase'
    ? explicitDataMode
    : process.env.FIREBASE_AUTH_EMULATOR_HOST ||
        process.env.FIRESTORE_EMULATOR_HOST ||
        process.env.STORAGE_EMULATOR_HOST ||
        process.env.APP_ENV === 'development'
      ? 'firebase'
      : 'memory';

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default(
    'development',
  ),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FIREBASE_PROJECT_ID: z.string().trim().min(3).default('eixoone-dev'),
  GOOGLE_CLOUD_PROJECT: z.string().trim().min(3).optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().trim().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().trim().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().trim().optional(),
  STORAGE_EMULATOR_HOST: z.string().trim().optional(),
  DATA_MODE: z.enum(['memory', 'firebase']).default(defaultDataMode),
  CORS_ORIGIN: z.string().trim().default('http://localhost:5000'),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).default(1048576),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export function resolveCorsOrigins(rawOrigins: string) {
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
