import { describe, it, expect } from "vitest";
import {
  extractJsonObjectText,
  parseJsonWithSchema,
} from "../ai-json";
import { z } from "zod";

describe("extractJsonObjectText", () => {
  it("フェンス付き JSON を取り出す", () => {
    expect(extractJsonObjectText("```json\n{\"a\":1}\n```")).toBe('{"a":1}');
  });

  it("前後の説明を落とす", () => {
    expect(extractJsonObjectText("はい\n{\"a\":2}\n以上")).toBe('{"a":2}');
  });
});

describe("parseJsonWithSchema", () => {
  const schema = z.object({ a: z.number() });
  it("スキーマに合う JSON を返す", () => {
    expect(parseJsonWithSchema('{"a":3}', schema)).toEqual({ a: 3 });
  });
  it("壊れた JSON は投げる", () => {
    expect(() => parseJsonWithSchema("not json", schema)).toThrow();
  });
});
