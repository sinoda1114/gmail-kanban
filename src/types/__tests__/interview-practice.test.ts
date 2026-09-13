import { describe, it, expect } from "vitest";
import {
  PracticeTurnSchema,
  PracticeMessageSchema,
  countInterviewerTurns,
  shouldWrapUpPractice,
  MAX_PRACTICE_INTERVIEWER_TURNS,
  normalizePracticeTurn,
  canSubmitPracticeReply,
} from "../interview-practice";

describe("PracticeTurnSchema", () => {
  it("question を通す", () => {
    expect(
      PracticeTurnSchema.safeParse({
        kind: "question",
        message: "自己紹介をお願いします",
      }).success
    ).toBe(true);
  });

  it("wrap_up は feedback 必須", () => {
    expect(
      PracticeTurnSchema.safeParse({
        kind: "wrap_up",
        message: "ありがとうございました",
      }).success
    ).toBe(false);
    expect(
      PracticeTurnSchema.safeParse({
        kind: "wrap_up",
        message: "ありがとうございました",
        feedback: {
          specificity: "具体例が足りない",
          length: "適切",
          weaknesses: ["数字が無い"],
          summary: "もう少し事例を",
        },
      }).success
    ).toBe(true);
  });
});

describe("PracticeMessageSchema", () => {
  it("未知の role は落とす", () => {
    expect(
      PracticeMessageSchema.safeParse({ role: "system", content: "x" }).success
    ).toBe(false);
  });
});

describe("shouldWrapUpPractice", () => {
  it("面接官ターンが上限未満なら継続", () => {
    const messages = Array.from({ length: MAX_PRACTICE_INTERVIEWER_TURNS - 1 }, () => ({
      role: "interviewer" as const,
      content: "q",
    }));
    expect(countInterviewerTurns(messages)).toBe(MAX_PRACTICE_INTERVIEWER_TURNS - 1);
    expect(shouldWrapUpPractice(messages)).toBe(false);
  });

  it("上限に達したら締め", () => {
    const messages = Array.from({ length: MAX_PRACTICE_INTERVIEWER_TURNS }, () => ({
      role: "interviewer" as const,
      content: "q",
    }));
    expect(shouldWrapUpPractice(messages)).toBe(true);
  });
});

describe("normalizePracticeTurn", () => {
  it("wrap_up で feedback が無いときは補完する", () => {
    const turn = normalizePracticeTurn({
      kind: "wrap_up",
      message: "ありがとうございました",
    });
    expect(turn.kind).toBe("wrap_up");
    if (turn.kind === "wrap_up") {
      expect(turn.feedback.summary.length).toBeGreaterThan(0);
    }
  });
});

describe("canSubmitPracticeReply", () => {
  it("active だけ書き込める", () => {
    expect(canSubmitPracticeReply("active")).toBe(true);
    expect(canSubmitPracticeReply("completed")).toBe(false);
  });
});
