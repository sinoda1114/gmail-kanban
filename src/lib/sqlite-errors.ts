const MISSING_TABLE = /no such table/i;
const MAX_CAUSE_DEPTH = 8;

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }
  return String(value);
}

function errorCause(value: unknown): unknown {
  if (value instanceof Error) return value.cause;
  if (typeof value === "object" && value !== null && "cause" in value) {
    return value.cause;
  }
  return undefined;
}

/** Drizzle 0.45 は libsql 失敗を DrizzleQueryError で包むので cause も見る。 */
export function isMissingSqliteTable(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current != null; depth++) {
    if (typeof current === "object") {
      if (seen.has(current)) break;
      seen.add(current);
    }
    if (MISSING_TABLE.test(errorMessage(current))) return true;
    current = errorCause(current);
  }

  return false;
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
