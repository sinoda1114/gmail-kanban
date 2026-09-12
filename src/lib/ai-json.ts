import { z } from "zod";

export function extractJsonObjectText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("JSON object not found in model output");
  }
  return body.slice(start, end + 1);
}

export function parseJsonWithSchema<T>(raw: string, schema: z.ZodType<T>): T {
  const jsonText = extractJsonObjectText(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Model output is not valid JSON");
  }
  return schema.parse(parsed);
}
