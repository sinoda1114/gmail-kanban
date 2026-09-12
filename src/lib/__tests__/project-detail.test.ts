import { describe, it, expect } from "vitest";
import { resolveProjectDetailTab } from "../project-detail";

describe("resolveProjectDetailTab", () => {
  it("未指定は basic", () => {
    expect(resolveProjectDetailTab()).toBe("basic");
    expect(resolveProjectDetailTab("unknown")).toBe("basic");
  });

  it("新規タブとエイリアスを解決する", () => {
    expect(resolveProjectDetailTab("interview_research")).toBe(
      "interview_research"
    );
    expect(resolveProjectDetailTab("interview-research")).toBe(
      "interview_research"
    );
    expect(resolveProjectDetailTab("interview_practice")).toBe(
      "interview_practice"
    );
    expect(resolveProjectDetailTab("interview-practice")).toBe(
      "interview_practice"
    );
    expect(resolveProjectDetailTab("interview_prep")).toBe("interview_prep");
  });
});
