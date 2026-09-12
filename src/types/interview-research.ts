import { z } from "zod";
import {
  EVIDENCE_BASIS,
  QUESTION_CATEGORIES,
  REVERSE_QUESTION_CATEGORIES,
} from "./interview-prep";

export const ResearchFactSchema = z.object({
  text: z.string().max(400).describe("企業・案件に関する事実または仮説"),
  basis: z
    .enum(EVIDENCE_BASIS)
    .describe("根拠の種別（evidence=検索/案件記載 / speculation=推測）"),
  sourceHint: z
    .string()
    .max(300)
    .optional()
    .describe("出典ヒント（サイト名・案件フィールド・検索結果の要約）"),
});

export const CompanyPackSchema = z.object({
  companyName: z.string().max(200).describe("企業・クライアント名（不明なら空文字）"),
  domain: z.string().max(300).describe("事業ドメイン・業界"),
  facts: z.array(ResearchFactSchema).max(10).describe("企業パックの事実・仮説"),
  talkingPoints: z
    .array(z.string().max(250))
    .max(8)
    .describe("面談で話すべきトピック"),
  topicsToAvoid: z
    .array(z.string().max(250))
    .max(6)
    .describe("避けるべき話題"),
});

export const LikelyInterviewSchema = z.object({
  format: z.string().max(120).describe("起きやすい面談の形式・相手"),
  why: z.string().max(400).describe("この募集で起きやすい理由"),
  typicalFlow: z
    .array(z.string().max(200))
    .max(6)
    .describe("典型的な流れ（箇条書き）"),
});

export const AnticipatedQuestionSchema = z.object({
  question: z.string().max(300).describe("想定質問"),
  category: z.enum(QUESTION_CATEGORIES).describe("カテゴリ"),
  why: z.string().max(300).describe("この募集で聞かれやすい理由"),
  starHint: z
    .string()
    .max(500)
    .describe("STARで答えるときのヒント（Situation/Task/Action/Result）"),
});

export const ReverseQuestionTemplateSchema = z.object({
  question: z.string().max(250).describe("逆質問テンプレ"),
  category: z.enum(REVERSE_QUESTION_CATEGORIES).describe("カテゴリ"),
  why: z.string().max(250).describe("この質問を聞く理由"),
});

export const FrameworkTemplateSchema = z.object({
  title: z.string().max(80).describe("フレームワーク名（例: 60秒自己紹介）"),
  script: z.string().max(800).describe("使える台本・骨子"),
  tips: z.string().max(300).optional().describe("使い方の注意"),
});

export const InterviewResearchPackSchema = z.object({
  companyPack: CompanyPackSchema.describe("企業リサーチパック"),
  likelyInterviews: z
    .array(LikelyInterviewSchema)
    .max(6)
    .describe("この募集で起きやすい面談"),
  anticipatedQuestions: z
    .array(AnticipatedQuestionSchema)
    .max(12)
    .describe("STARヒント付き想定質問"),
  reverseQuestionTemplates: z
    .array(ReverseQuestionTemplateSchema)
    .max(12)
    .describe("逆質問テンプレ"),
  frameworks: z
    .array(FrameworkTemplateSchema)
    .max(6)
    .describe("自己紹介・STARなどの汎用フレームワーク"),
});

export type ResearchFact = z.infer<typeof ResearchFactSchema>;
export type CompanyPack = z.infer<typeof CompanyPackSchema>;
export type LikelyInterview = z.infer<typeof LikelyInterviewSchema>;
export type AnticipatedQuestion = z.infer<typeof AnticipatedQuestionSchema>;
export type ReverseQuestionTemplate = z.infer<
  typeof ReverseQuestionTemplateSchema
>;
export type FrameworkTemplate = z.infer<typeof FrameworkTemplateSchema>;
export type InterviewResearchPack = z.infer<typeof InterviewResearchPackSchema>;
