import { describe, it, expect } from "vitest";
import {
  InterviewPrepAISchema,
  CompanyBriefSchema,
  CheatSheetSchema,
  TechDeepDiveItemSchema,
  RedFlagSchema,
} from "../interview-prep";
import {
  resolveInterviewPartner,
  serializeInterviewPartner,
  buildPartnerPromptGuidance,
} from "@/lib/interview-prep-prompt";
import { formatCheatSheetForCopy } from "@/lib/interview-prep-format";

describe("resolveInterviewPartner", () => {
  it("空は general にフォールバック", () => {
    expect(resolveInterviewPartner(null)).toEqual({ value: "general", customLabel: "" });
  });
  it("既知の値はそのまま解決", () => {
    expect(resolveInterviewPartner("agent")).toEqual({ value: "agent", customLabel: "" });
  });
  it("未知の文字列は custom", () => {
    expect(resolveInterviewPartner("事業部マネージャー")).toEqual({
      value: "custom", customLabel: "事業部マネージャー",
    });
  });
});

describe("serializeInterviewPartner", () => {
  it("general を保存", () => {
    expect(serializeInterviewPartner("general", "")).toBe("general");
  });
  it("custom は trim", () => {
    expect(serializeInterviewPartner("custom", " CTO ")).toBe("CTO");
  });
  it("custom 空文字は general", () => {
    expect(serializeInterviewPartner("custom", "")).toBe("general");
    expect(serializeInterviewPartner("custom", "   ")).toBe("general");
  });
});

describe("resolveInterviewPartner bare custom", () => {
  it("保存値 custom は general 扱い", () => {
    expect(resolveInterviewPartner("custom")).toEqual({
      value: "general",
      customLabel: "",
    });
  });
});

describe("buildPartnerPromptGuidance", () => {
  it("エージェント向け", () => {
    const g = buildPartnerPromptGuidance("agent");
    expect(g).toContain("エージェント面談の重点");
  });
});

describe("formatCheatSheetForCopy", () => {
  it("整形", () => {
    const t = formatCheatSheetForCopy({
      summary: "要点", keyExperiences: ["React"], topReverseQuestions: ["Q"],
      dontTouchPoints: ["X"],
    });
    expect(t).toContain("要点");
    expect(t).toContain("React");
  });
});

describe("InterviewPrepAISchema", () => {
  it("拡張フィールド込み", () => {
    const r = InterviewPrepAISchema.safeParse({
      questions: [{ question: "q", category: "experience", priority: "high", aiAnswer: "a" }],
      reverseQuestions: [{ question: "rq", category: "team" }],
      strategy: "s", concerns: ["c"], checklist: ["cl"],
      companyBrief: { domain: "d", hypotheses: [], talkingPoints: [], topicsToAvoid: [] },
      techDeepDive: [], redFlags: [], cheatSheet: {
        keyExperiences: [], topReverseQuestions: [], dontTouchPoints: [], summary: "s",
      },
    });
    expect(r.success).toBe(true);
  });
});

describe("sub-schemas", () => {
  it("CompanyBriefSchema", () => {
    expect(CompanyBriefSchema.safeParse({
      domain: "SaaS", hypotheses: [{ text: "t", basis: "speculation" }],
      talkingPoints: [], topicsToAvoid: [],
    }).success).toBe(true);
  });
  it("RedFlagSchema", () => {
    expect(RedFlagSchema.safeParse({
      flag: "f", severity: "medium", confirmationQuestion: "q", category: "onsite",
    }).success).toBe(true);
  });
  it("TechDeepDiveItemSchema", () => {
    expect(TechDeepDiveItemSchema.safeParse({
      tech: "Go", deepDiveTopics: [], experienceConnection: "e", phrasesToAvoid: [],
    }).success).toBe(true);
  });
  it("CheatSheetSchema", () => {
    expect(CheatSheetSchema.safeParse({
      keyExperiences: ["a"], topReverseQuestions: ["b"], dontTouchPoints: ["c"], summary: "d",
    }).success).toBe(true);
  });
});
