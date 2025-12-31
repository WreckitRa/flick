// Helper to serialize Date objects to ISO strings for JSON responses
// This ensures compatibility between admin and mobile clients without superjson

export function serializeDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

export function serializeDates<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const serialized = { ...obj };
  for (const field of dateFields) {
    if (serialized[field] instanceof Date) {
      (serialized[field] as any) = serializeDate(serialized[field] as Date);
    }
  }
  return serialized;
}





