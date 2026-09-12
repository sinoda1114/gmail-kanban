import { describe, it, expect } from "vitest";
import {
  buildPracticeTurnPrompt,
  formatPracticeHistory,
} from "../interview-practice";
import { MAX_PRACTICE_INTERVIEWER_TURNS } from "@/types/interview-practice";

describe("formatPracticeHistory", () => {
  it("空はプレースホルダ", () => {
    expect(formatPracticeHistory([])).toBe("（まだ発言なし）");
  });
  it("役割ラベルを付ける", () => {
    expect(
      formatPracticeHistory([
        { role: "interviewer", content: "自己紹介を" },
        { role: "candidate", content: "田中です" },
      ])
    ).toContain("面接官: 自己紹介を");
  });
});

describe("buildPracticeTurnPrompt", () => {
  it("最初のターンは question を指示", () => {
    const p = buildPracticeTurnPrompt({
      project: { title: "案件A", techStack: ["React"], summary: "要約" },
      messages: [],
    });
    expect(p).toContain("案件A");
    expect(p).toContain("kind=question");
  });

  it("上限到達なら wrap_up を強制", () => {
    const messages = Array.from(
      { length: MAX_PRACTICE_INTERVIEWER_TURNS },
      (_, i) => ({
        role: "interviewer" as const,
        content: `Q${i}`,
      })
    );
    const p = buildPracticeTurnPrompt({
      project: { title: "案件A", techStack: [], summary: null },
      messages,
    });
    expect(p).toContain("必ず kind=wrap_up");
  });
});
