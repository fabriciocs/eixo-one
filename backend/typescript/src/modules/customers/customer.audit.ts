import { AuditEventInput } from "./customer.types";

export interface AuditWriter {
  write(event: AuditEventInput): Promise<void>;
}

export function redactCustomerForAudit(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  const obj = { ...(value as Record<string, unknown>) };
  if (typeof obj.cpfCnpj === "string") obj.cpfCnpj = mask(obj.cpfCnpj);
  if (typeof obj.cpfCnpjNormalizado === "string") obj.cpfCnpjNormalizado = mask(obj.cpfCnpjNormalizado);
  if (typeof obj.email === "string") obj.email = maskEmail(obj.email);
  if (typeof obj.emailNormalizado === "string") obj.emailNormalizado = maskEmail(obj.emailNormalizado);
  if (typeof obj.telefone === "string") obj.telefone = "********";
  if (typeof obj.telefoneNormalizado === "string") obj.telefoneNormalizado = "********";
  return obj;
}

export function diffObjects(before: Record<string, unknown>, after: Record<string, unknown>): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { before: before[key], after: after[key] };
    }
  }
  return diff;
}

function mask(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${digits.slice(0, 3)}********${digits.slice(-2)}`;
}

function maskEmail(value: string): string {
  const [name, domain] = value.split("@");
  if (!domain) return "********";
  return `${name.slice(0, 2)}***@${domain}`;
}
