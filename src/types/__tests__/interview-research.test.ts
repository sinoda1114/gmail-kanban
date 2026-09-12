import { describe, it, expect } from "vitest";
import { InterviewResearchPackSchema } from "../interview-research";

const validPack = {
  companyPack: {
    companyName: "Example Inc",
    domain: "B2B SaaS",
    facts: [
      { text: "上場企業", basis: "evidence" as const, sourceHint: "公式サイト" },
      { text: "スタートアップ文化", basis: "speculation" as const },
    ],
    talkingPoints: ["SaaS 運用経験"],
    topicsToAvoid: ["未公表の資金調達"],
  },
  likelyInterviews: [
    {
      format: "エージェント初回",
      why: "エージェント経由の募集",
      typicalFlow: ["自己紹介", "スキル確認", "条件"],
    },
  ],
  anticipatedQuestions: [
    {
      question: "類似案件の経験は？",
      category: "experience" as const,
      why: "募集が業務委託",
      starHint: "S: 前案件 T: 移行 A: 設計 R: 遅延ゼロ",
    },
  ],
  reverseQuestionTemplates: [
    {
      question: "チーム構成は？",
      category: "team" as const,
      why: "体制が募集に無い",
    },
  ],
  frameworks: [
    {
      title: "60秒自己紹介",
      script: "名前・強み・最近の成果",
      tips: "数字を1つ入れる",
    },
  ],
};

describe("InterviewResearchPackSchema", () => {
  it("妥当なパックを通す", () => {
    const r = InterviewResearchPackSchema.safeParse(validPack);
    expect(r.success).toBe(true);
  });

  it("未知の根拠種別は落とす", () => {
    const r = InterviewResearchPackSchema.safeParse({
      ...validPack,
      companyPack: {
        ...validPack.companyPack,
        facts: [{ text: "x", basis: "rumor" }],
      },
    });
    expect(r.success).toBe(false);
  });

  it("想定質問のカテゴリが不正なら落とす", () => {
    const r = InterviewResearchPackSchema.safeParse({
      ...validPack,
      anticipatedQuestions: [
        {
          question: "q",
          category: "culture",
          why: "w",
          starHint: "s",
        },
      ],
    });
    expect(r.success).toBe(false);
  });
});
