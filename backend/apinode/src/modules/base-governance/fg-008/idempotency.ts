import {
  FG008_ERROR_MESSAGES,
  type Envelope,
  validateIdempotencyKey
} from "../../../../../../packages/sharedcontracts/src";
import type { IntegrationRepository, RequestContext } from "./types";
import { Fg008HttpError } from "./types";

export interface IdempotencyInput<T> {
  repository: IntegrationRepository;
  context: RequestContext;
  key: string | undefined;
  method: string;
  path: string;
  body: unknown;
  run: () => Promise<Envelope<T>>;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Hash determinístico para comparar replay de payload.
 * No repositório real, pode ser substituído por SHA-256/HMAC do runtime Node.
 */
export function deterministicBodyHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16)}`;
}

export async function withIdempotency<T>(input: IdempotencyInput<T>): Promise<Envelope<T>> {
  if (!validateIdempotencyKey(input.key)) {
    throw new Fg008HttpError(400, {
      code: "IDEMPOTENCY_KEY_REQUIRED",
      message: FG008_ERROR_MESSAGES.IDEMPOTENCY_KEY_REQUIRED
    });
  }

  const bodyHash = deterministicBodyHash(input.body);
  const existing = await input.repository.getIdempotency(input.key!);
  if (existing) {
    if (existing.bodyHash !== bodyHash) {
      throw new Fg008HttpError(409, {
        code: "IDEMPOTENCY_REPLAY_MISMATCH",
        message: FG008_ERROR_MESSAGES.IDEMPOTENCY_REPLAY_MISMATCH
      });
    }
    return existing.response as Envelope<T>;
  }

  const response = await input.run();
  const expires = new Date(Date.parse(input.context.now) + 24 * 60 * 60 * 1000).toISOString();
  await input.repository.putIdempotency({
    key: input.key!,
    tenantId: input.context.actor.tenantId,
    method: input.method,
    path: input.path,
    bodyHash,
    response: response as Envelope<unknown>,
    createdAt: input.context.now,
    expiresAt: expires
  });

  return response;
}
