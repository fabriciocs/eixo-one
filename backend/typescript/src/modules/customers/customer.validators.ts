import {
  CustomerAddress,
  CustomerContact,
  CustomerMutableInput,
  CustomerStatus,
  DomainError,
  PersonType,
} from "./customer.types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_TEXT_RE = /^[^<>]*$/;
const PERSON_TYPES: PersonType[] = ["PF", "PJ", "ESTRANGEIRO"];
const STATUSES: CustomerStatus[] = ["rascunho", "ativo", "bloqueado", "inativo"];

export function onlyDigits(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizeEmail(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

export function normalizePhone(value?: string): string | undefined {
  const normalized = value?.replace(/[^\d+]/g, "");
  return normalized || undefined;
}

export function normalizeName(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function maskDocument(value?: string): string | undefined {
  const digits = onlyDigits(value);
  if (digits.length === 11) return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
  if (digits.length === 14) return `${digits.slice(0, 2)}.***.***/****-${digits.slice(12)}`;
  return value ? "********" : undefined;
}

export function assertNoHtml(field: string, value?: string): void {
  if (value && !SAFE_TEXT_RE.test(value)) {
    throw new DomainError("VALIDATION_ERROR", "Campos de texto não podem conter HTML/script.", 422, [
      { field, message: "Remova caracteres HTML/script." },
    ]);
  }
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;

  return digit === Number(cpf[10]);
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (base: string, weights: number[]): number => {
    const sum = base.split("").reduce((acc, digit, idx) => acc + Number(digit) * weights[idx], 0);
    const result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  };

  const digit1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const digit2 = calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digit1 === Number(cnpj[12]) && digit2 === Number(cnpj[13]);
}

export function assertAllowedKeys(payload: Record<string, unknown>, allowed: string[]): void {
  const unexpected = Object.keys(payload).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new DomainError("VALIDATION_ERROR", "Payload contém campos não permitidos.", 422, [
      { field: unexpected.join(","), message: "Remova campos não permitidos." },
    ]);
  }
}

function assertStringLength(field: string, value: string | undefined, min: number, max: number, required = false): void {
  const trimmed = value?.trim();
  if (required && !trimmed) {
    throw new DomainError("VALIDATION_ERROR", "Campos obrigatórios ausentes.", 422, [
      { field, message: "Campo obrigatório." },
    ]);
  }
  if (!trimmed) return;
  if (trimmed.length < min || trimmed.length > max) {
    throw new DomainError("VALIDATION_ERROR", "Campo fora do tamanho permitido.", 422, [
      { field, message: `Informe entre ${min} e ${max} caracteres.` },
    ]);
  }
  assertNoHtml(field, trimmed);
}

function assertPrimaryUniqueness<T extends { isPrimary: boolean }>(field: string, items?: T[]): void {
  const total = (items ?? []).filter((item) => item.isPrimary).length;
  if (total > 1) {
    throw new DomainError("VALIDATION_ERROR", "Somente um item principal é permitido.", 422, [
      { field, message: "Marque apenas um item como principal." },
    ]);
  }
}

export function validateAddress(address: CustomerAddress, index: number): void {
  assertStringLength(`addresses.${index}.label`, address.label, 2, 80, true);
  assertStringLength(`addresses.${index}.street`, address.street, 1, 150);
  assertStringLength(`addresses.${index}.number`, address.number, 1, 20);
  assertStringLength(`addresses.${index}.city`, address.city, 2, 80, true);
  assertStringLength(`addresses.${index}.state`, address.state, 1, 40);
  if (!/^[A-Z]{2}$/i.test(address.country)) {
    throw new DomainError("VALIDATION_ERROR", "País deve usar código ISO-3166 alfa-2.", 422, [
      { field: `addresses.${index}.country`, message: "Informe país com 2 letras." },
    ]);
  }
}

export function validateContact(contact: CustomerContact, index: number): void {
  assertStringLength(`contacts.${index}.name`, contact.name, 2, 120, true);
  assertStringLength(`contacts.${index}.role`, contact.role, 1, 80);
  if (contact.email && !EMAIL_RE.test(contact.email)) {
    throw new DomainError("VALIDATION_ERROR", "E-mail inválido.", 422, [
      { field: `contacts.${index}.email`, message: "Informe um e-mail válido." },
    ]);
  }
}

export function validateCustomerInput(input: CustomerMutableInput): CustomerMutableInput & {
  nomeNormalizado: string;
  cpfCnpjNormalizado?: string;
  emailNormalizado?: string;
  telefoneNormalizado?: string;
} {
  if (!PERSON_TYPES.includes(input.tipoPessoa)) {
    throw new DomainError("VALIDATION_ERROR", "Tipo de pessoa inválido.", 422, [
      { field: "tipoPessoa", message: "Use PF, PJ ou ESTRANGEIRO." },
    ]);
  }

  assertStringLength("empresaId", input.empresaId, 8, 80, true);
  assertStringLength("filialId", input.filialId, 8, 80);
  assertStringLength("codigo", input.codigo, 2, 30);
  assertStringLength("nome", input.nome, 2, 150, true);
  assertStringLength("nomeFantasia", input.nomeFantasia, 1, 150);
  assertStringLength("observacao", input.observacao, 0, 2000);

  const status = input.status ?? "rascunho";
  if (!STATUSES.includes(status)) {
    throw new DomainError("VALIDATION_ERROR", "Status inválido.", 422, [
      { field: "status", message: "Status não permitido." },
    ]);
  }

  const cpfCnpjNormalizado = onlyDigits(input.cpfCnpj);

  if (input.tipoPessoa === "PF" && !isValidCpf(cpfCnpjNormalizado)) {
    throw new DomainError("VALIDATION_ERROR", "CPF inválido.", 422, [
      { field: "cpfCnpj", message: "Informe um CPF válido." },
    ]);
  }

  if (input.tipoPessoa === "PJ" && !isValidCnpj(cpfCnpjNormalizado)) {
    throw new DomainError("VALIDATION_ERROR", "CNPJ inválido.", 422, [
      { field: "cpfCnpj", message: "Informe um CNPJ válido." },
    ]);
  }

  if (input.tipoPessoa === "ESTRANGEIRO") {
    assertStringLength("documentoEstrangeiro", input.documentoEstrangeiro, 3, 60, true);
  }

  const emailNormalizado = normalizeEmail(input.email);
  if (emailNormalizado && !EMAIL_RE.test(emailNormalizado)) {
    throw new DomainError("VALIDATION_ERROR", "E-mail inválido.", 422, [
      { field: "email", message: "Informe um e-mail válido." },
    ]);
  }

  if (input.limiteCreditoCentavos !== undefined) {
    if (!Number.isInteger(input.limiteCreditoCentavos) || input.limiteCreditoCentavos < 0) {
      throw new DomainError("VALIDATION_ERROR", "Limite de crédito inválido.", 422, [
        { field: "limiteCreditoCentavos", message: "Informe valor inteiro maior ou igual a zero." },
      ]);
    }
  }

  if ((input.tags ?? []).length > 20) {
    throw new DomainError("VALIDATION_ERROR", "Máximo de 20 tags.", 422, [
      { field: "tags", message: "Reduza a quantidade de tags." },
    ]);
  }

  for (const [idx, tag] of (input.tags ?? []).entries()) {
    assertStringLength(`tags.${idx}`, tag, 2, 32, true);
  }

  if ((input.addresses ?? []).length > 20) {
    throw new DomainError("VALIDATION_ERROR", "Máximo de 20 endereços.", 422);
  }
  if ((input.contacts ?? []).length > 50) {
    throw new DomainError("VALIDATION_ERROR", "Máximo de 50 contatos.", 422);
  }

  assertPrimaryUniqueness("addresses", input.addresses);
  assertPrimaryUniqueness("contacts", input.contacts);

  input.addresses?.forEach(validateAddress);
  input.contacts?.forEach(validateContact);

  return {
    ...input,
    status,
    nome: input.nome.trim().replace(/\s+/g, " "),
    nomeNormalizado: normalizeName(input.nome),
    cpfCnpjNormalizado: cpfCnpjNormalizado || undefined,
    emailNormalizado,
    telefoneNormalizado: normalizePhone(input.telefone),
  };
}

export function assertStatusTransition(current: CustomerStatus, next: CustomerStatus, allowReactivation: boolean): void {
  const transitions: Record<CustomerStatus, CustomerStatus[]> = {
    rascunho: ["ativo", "inativo"],
    ativo: ["bloqueado", "inativo"],
    bloqueado: ["ativo"],
    inativo: allowReactivation ? ["ativo"] : [],
  };

  if (!transitions[current].includes(next)) {
    throw new DomainError("INVALID_STATUS_TRANSITION", `Transição de status ${current} -> ${next} não permitida.`, 422, [
      { field: "status", message: "Transição de status não permitida." },
    ]);
  }
}
