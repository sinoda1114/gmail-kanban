import { describe, it, expect } from "vitest";
import {
  buildResearchPromptGuidance,
  parseStoredResearchPack,
  collectSourceUrls,
  buildInterviewResearchPrompt,
} from "../interview-research";
import type { InterviewResearchPack } from "@/types/interview-research";

const pack: InterviewResearchPack = {
  companyPack: {
    companyName: "Acme",
    domain: "物流",
    facts: [{ text: "東証上場", basis: "evidence", sourceHint: "IR" }],
    talkingPoints: ["配送最適化"],
    topicsToAvoid: ["未公表のM&A"],
  },
  likelyInterviews: [
    { format: "技術面談", why: "Goが必須", typicalFlow: ["設計"] },
  ],
  anticipatedQuestions: [
    {
      question: "障害対応は？",
      category: "technical",
      why: "運用案件",
      starHint: "S/T/A/R",
    },
  ],
  reverseQuestionTemplates: [
    { question: "オンコールは？", category: "work_style", why: "募集に無い" },
  ],
  frameworks: [{ title: "STAR", script: "骨子" }],
};

describe("parseStoredResearchPack", () => {
  it("壊れた値は null", () => {
    expect(parseStoredResearchPack(null)).toBeNull();
    expect(parseStoredResearchPack("{")).toBeNull();
    expect(parseStoredResearchPack({ companyPack: {} })).toBeNull();
  });

  it("妥当なオブジェクトと JSON 文字列を返す", () => {
    expect(parseStoredResearchPack(pack)?.companyPack.companyName).toBe("Acme");
    expect(
      parseStoredResearchPack(JSON.stringify(pack))?.companyPack.domain
    ).toBe("物流");
  });
});

describe("buildResearchPromptGuidance", () => {
  it("空ならプロンプトに載せない", () => {
    expect(buildResearchPromptGuidance(null)).toBe("");
  });

  it("パックの事実を載せる", () => {
    const g = buildResearchPromptGuidance(pack);
    expect(g).toContain("Acme");
    expect(g).toContain("東証上場");
    expect(g).toContain("障害対応は？");
    expect(g).toContain("companyBrief");
    expect(g).toContain("配送最適化");
    expect(g).toContain("未公表のM&A");
  });
});

describe("collectSourceUrls", () => {
  it("http URL だけユニークに残す", () => {
    expect(
      collectSourceUrls([
        { url: "https://example.com/a" },
        { url: "https://example.com/a" },
        { url: "ftp://x" },
        { title: "no url" },
      ])
    ).toEqual(["https://example.com/a"]);
  });
});

describe("buildInterviewResearchPrompt", () => {
  it("案件タイトルを含む", () => {
    const p = buildInterviewResearchPrompt({
      title: "Go 案件",
      techStack: ["Go"],
      agentCompany: "エージェントA",
      summary: "要約",
      sourceText: "本文",
      price: "80万",
      workRate: "100%",
      location: "東京",
      remoteType: "remote",
      contractPeriod: "6ヶ月",
      startDateText: "即日",
    });
    expect(p).toContain("Go 案件");
    expect(p).toContain("speculation");
  });
});
