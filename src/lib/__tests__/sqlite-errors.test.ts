import { describe, it, expect } from "vitest";
import { isMissingSqliteTable } from "../sqlite-errors";

describe("isMissingSqliteTable", () => {
  it("no such table を拾う", () => {
    expect(
      isMissingSqliteTable(new Error("no such table: interview_research_packs"))
    ).toBe(true);
  });

  it("別エラーは落とさない", () => {
    expect(isMissingSqliteTable(new Error("UNIQUE constraint failed"))).toBe(
      false
    );
  });
});
