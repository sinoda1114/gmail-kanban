import { describe, it, expect } from "vitest";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { ignoreMissingTable, isMissingSqliteTable } from "../sqlite-errors";

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

  it("DrizzleQueryError の cause にある no such table を拾う", () => {
    const wrapped = new DrizzleQueryError(
      "select * from interview_research_packs",
      [],
      new Error("SQLITE_ERROR: no such table: interview_research_packs")
    );
    expect(wrapped.message).toMatch(/^Failed query:/);
    expect(isMissingSqliteTable(wrapped)).toBe(true);
  });

  it("ラップされた別エラーは落とさない", () => {
    const wrapped = new DrizzleQueryError(
      "insert into interview_research_packs",
      [],
      new Error("UNIQUE constraint failed")
    );
    expect(isMissingSqliteTable(wrapped)).toBe(false);
  });

  it("循環 cause でも止まって判定する", () => {
    const outer = new Error("Failed query: select *");
    const inner = new Error("no such table: interview_practice_sessions");
    outer.cause = inner;
    inner.cause = outer;
    expect(isMissingSqliteTable(outer)).toBe(true);
  });
});

describe("ignoreMissingTable", () => {
  it("ラップされた欠表エラーは null を返す", async () => {
    const wrapped = new DrizzleQueryError(
      "select * from interview_research_packs",
      [],
      new Error("no such table: interview_research_packs")
    );
    await expect(
      ignoreMissingTable(async () => {
        throw wrapped;
      })
    ).resolves.toBeNull();
  });

  it("別のラップエラーは再 throw する", async () => {
    const wrapped = new DrizzleQueryError(
      "select * from interview_research_packs",
      [],
      new Error("UNIQUE constraint failed")
    );
    await expect(
      ignoreMissingTable(async () => {
        throw wrapped;
      })
    ).rejects.toBe(wrapped);
  });
});
