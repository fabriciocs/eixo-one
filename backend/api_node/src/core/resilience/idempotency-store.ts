export type IdempotencyRecord<T = unknown> = {
  scope: string;
  fingerprint: string;
  statusCode: number;
  responseBody: T;
  createdAt: string;
};

export interface IdempotencyStore {
  get<T = unknown>(scope: string): Promise<IdempotencyRecord<T> | null>;
  set<T = unknown>(record: IdempotencyRecord<T>): Promise<void>;
  isReady(): Promise<boolean>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  async get<T = unknown>(scope: string) {
    return (this.records.get(scope) as IdempotencyRecord<T> | undefined) ?? null;
  }

  async set<T = unknown>(record: IdempotencyRecord<T>) {
    this.records.set(record.scope, record);
  }

  async isReady() {
    return true;
  }
}

