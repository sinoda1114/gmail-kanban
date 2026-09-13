import { describe, it, expect } from "vitest";
import {
  parsePracticeInputMode,
  lastInterviewerContent,
} from "../practice-input-mode";

describe("parsePracticeInputMode", () => {
  it("voice 以外は text", () => {
    expect(parsePracticeInputMode("voice")).toBe("voice");
    expect(parsePracticeInputMode("text")).toBe("text");
    expect(parsePracticeInputMode(null)).toBe("text");
    expect(parsePracticeInputMode("other")).toBe("text");
  });
});

describe("lastInterviewerContent", () => {
  it("末尾の相手役を返す", () => {
    expect(
      lastInterviewerContent([
        { role: "interviewer", content: "自己紹介を" },
        { role: "candidate", content: "田中です" },
        { role: "interviewer", content: "なぜ応募しましたか" },
      ])
    ).toBe("なぜ応募しましたか");
  });

  it("相手役が無ければ null", () => {
    expect(
      lastInterviewerContent([{ role: "candidate", content: "はい" }])
    ).toBeNull();
  });
});
