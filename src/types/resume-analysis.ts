import { z } from "zod";

export const ResumeAnalysisSchema = z.object({
  summary: z.string().max(600).describe("経歴の要約（面接準備で使える一文サマリー）"),
  strengths: z
    .array(z.string().max(200))
    .max(8)
    .describe("強み・アピールポイント"),
  skills: z
    .array(z.string().max(100))
    .max(20)
    .describe("技術スキル・経験領域のリスト"),
  careerHistory: z
    .array(z.string().max(300))
    .max(15)
    .describe("職歴・プロジェクト履歴のハイライト（時系列）"),
  likelyQuestions: z
    .array(z.string().max(200))
    .max(10)
    .describe("この経歴から聞かれそうな質問"),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;
