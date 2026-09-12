import { describe, it, expect } from "vitest";
import {
  hasRetrospectiveContent,
  parseStoredRetrospective,
  buildRetrospectivePromptGuidance,
} from "../retrospective";
import type { InterviewRetrospective } from "@/types/retrospective";

const full: InterviewRetrospective = {
  wentWell: "技術質問に具体例で答えられた",
  likelyFollowUps: "稼働開始日の確認",
  temperatureAssessment: "前向き",
  nextPrepTips: "障害対応の数字を用意する",
};

describe("hasRetrospectiveContent", () => {
  it("全部空なら false", () => {
    expect(
      hasRetrospectiveContent({
        wentWell: "  ",
        likelyFollowUps: "",
        temperatureAssessment: "",
        nextPrepTips: "",
      })
    ).toBe(false);
    expect(hasRetrospectiveContent(null)).toBe(false);
  });

  it("1項目でもあれば true", () => {
    expect(
      hasRetrospectiveContent({
        wentWell: "",
        likelyFollowUps: "",
        temperatureAssessment: "",
        nextPrepTips: "数字を用意",
      })
    ).toBe(true);
  });
});

describe("parseStoredRetrospective", () => {
  it("壊れた JSON は null", () => {
    expect(parseStoredRetrospective({ wentWell: 1 })).toBeNull();
    expect(parseStoredRetrospective(null)).toBeNull();
    expect(parseStoredRetrospective("{")).toBeNull();
  });

  it("文字列 JSON も受け付ける", () => {
    expect(
      parseStoredRetrospective(JSON.stringify(full))?.nextPrepTips
    ).toBe("障害対応の数字を用意する");
  });

  it("空の有効オブジェクトは null", () => {
    expect(
      parseStoredRetrospective({
        wentWell: "",
        likelyFollowUps: "",
        temperatureAssessment: "",
        nextPrepTips: "  ",
      })
    ).toBeNull();
  });

  it("中身があれば返す", () => {
    expect(parseStoredRetrospective(full)?.nextPrepTips).toBe(
      "障害対応の数字を用意する"
    );
  });
});

describe("buildRetrospectivePromptGuidance", () => {
  it("空なら空文字（プロンプトに載せない）", () => {
    expect(buildRetrospectivePromptGuidance(null)).toBe("");
    expect(
      buildRetrospectivePromptGuidance({
        wentWell: "",
        likelyFollowUps: "",
        temperatureAssessment: "",
        nextPrepTips: "",
      })
    ).toBe("");
  });

  it("中身があれば次回ヒントを含み、空欄ラベルは出さない", () => {
    const g = buildRetrospectivePromptGuidance({
      wentWell: "",
      likelyFollowUps: "",
      temperatureAssessment: "",
      nextPrepTips: "障害対応の数字を用意する",
    });
    expect(g).toContain("前回面談の振り返り");
    expect(g).toContain("障害対応の数字を用意する");
    expect(g).not.toContain("うまくいったこと:");
    expect(g).toContain("nextPrepTips");
  });

  it("全項目を載せる", () => {
    const g = buildRetrospectivePromptGuidance(full);
    expect(g).toContain("技術質問に具体例で答えられた");
    expect(g).toContain("稼働開始日の確認");
    expect(g).toContain("前向き");
    expect(g).toContain("ここに無い事実は作らない");
  });
});
