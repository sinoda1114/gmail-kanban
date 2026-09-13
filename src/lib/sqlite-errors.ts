export function isMissingSqliteTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /no such table/i.test(message);
}

export async function ignoreMissingTable<T>(
  query: () => Promise<T>
): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    if (isMissingSqliteTable(error)) return null;
    throw error;
  }
}
