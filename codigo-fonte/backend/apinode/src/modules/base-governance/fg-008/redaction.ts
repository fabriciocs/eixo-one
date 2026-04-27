const SENSITIVE_KEYS = new Set([
  "secret",
  "secretRef",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "password",
  "credential",
  "authorization",
  "cpf",
  "cnpj",
  "email",
  "phone"
]);

export function redactSensitiveData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item)) as T;
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      const shouldMask = SENSITIVE_KEYS.has(key) || Array.from(SENSITIVE_KEYS).some((sensitive) => lower.includes(sensitive.toLowerCase()));
      output[key] = shouldMask ? "***REDACTED***" : redactSensitiveData(child);
    }
    return output as T;
  }

  return value;
}

export function sanitizeLogText(value: string): string {
  return value.replace(/[\r\n\t]/g, " ").slice(0, 500);
}
