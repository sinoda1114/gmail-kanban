import { describe, it, expect } from "vitest";
import {
  pickJapaneseVoice,
  clipPracticeTranscript,
  joinRecognitionTranscript,
} from "../practice-speech";

describe("pickJapaneseVoice", () => {
  it("ja を優先し Google 系があればそれを取る", () => {
    expect(
      pickJapaneseVoice([
        { lang: "en-US", name: "Samantha" },
        { lang: "ja-JP", name: "Kyoko" },
        { lang: "ja-JP", name: "Google 日本語" },
      ])
    ).toEqual({ lang: "ja-JP", name: "Google 日本語" });
  });

  it("日本語が無ければ null", () => {
    expect(pickJapaneseVoice([{ lang: "en-US", name: "Alex" }])).toBeNull();
  });
});

describe("clipPracticeTranscript", () => {
  it("上限で切る", () => {
    expect(clipPracticeTranscript("あいうえお", 3)).toBe("あいう");
    expect(clipPracticeTranscript("短い", 10)).toBe("短い");
  });
});

describe("joinRecognitionTranscript", () => {
  it("結果を順に結合する", () => {
    expect(
      joinRecognitionTranscript([
        { 0: { transcript: "こんにちは" } },
        { 0: { transcript: "です" } },
      ])
    ).toBe("こんにちはです");
  });
});
