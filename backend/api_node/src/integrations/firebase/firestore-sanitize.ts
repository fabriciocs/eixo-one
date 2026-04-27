function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeFirestoreData(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitizedEntries = Object.entries(value)
    .filter(([, itemValue]) => itemValue !== undefined)
    .map(([key, itemValue]) => [key, sanitizeFirestoreData(itemValue)]);

  return Object.fromEntries(sanitizedEntries) as T;
}
