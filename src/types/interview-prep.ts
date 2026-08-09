import { z } from "zod";

export const QUESTION_CATEGORIES = [
  "technical",
  "pm",
  "condition",
  "experience",
] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export const QUESTION_CATEGORY_LABELS: Record<QuestionCategory, string> = {
  technical: "技術",
  pm: "PM/マネジメント",
  condition: "条件",
  experience: "経験",
};

export const QUESTION_CATEGORY_COLORS: Record<QuestionCategory, string> = {
  technical: "blue",
  pm: "violet",
  condition: "orange",
  experience: "teal",
};

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "重要",
  medium: "中",
  low: "低",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "red",
  medium: "yellow",
  low: "gray",
};

export const REVERSE_QUESTION_CATEGORIES = [
  "role",
  "team",
  "tech",
  "work_style",
  "contract",
  "selection_flow",
] as const;
export type ReverseQuestionCategory =
  (typeof REVERSE_QUESTION_CATEGORIES)[number];

export const REVERSE_CATEGORY_LABELS: Record<ReverseQuestionCategory, string> =
  {
    role: "役割",
    team: "体制",
    tech: "技術",
    work_style: "働き方",
    contract: "契約",
    selection_flow: "選考フロー",
  };

export const InterviewPrepAISchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().max(300).describe("想定質問文"),
        category: z.enum(QUESTION_CATEGORIES).describe("カテゴリ"),
        priority: z.enum(PRIORITIES).describe("重要度"),
        aiAnswer: z.string().max(600).describe("AI推奨回答案"),
      })
    )
    .max(20)
    .describe("面接で聞かれそうな想定質問と回答案"),
  reverseQuestions: z
    .array(
      z.object({
        question: z.string().max(200).describe("自分から聞く逆質問"),
        category: z.enum(REVERSE_QUESTION_CATEGORIES).describe("カテゴリ"),
      })
    )
    .max(18)
    .describe("自分から聞きたい逆質問"),
  strategy: z.string().max(1000).describe("面談戦略・強調すべき経験と注意点"),
  concerns: z
    .array(z.string().max(200))
    .max(8)
    .describe("懸念点・事前に確認すべき事項"),
  checklist: z
    .array(z.string().max(100))
    .max(10)
    .describe("面談前チェックリスト"),
});

export type InterviewPrepAI = z.infer<typeof InterviewPrepAISchema>;

export const PersonalizedAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().describe("対象質問のID"),
        userAnswer: z
          .string()
          .max(800)
          .describe("経歴メモと案件情報のみに基づくパーソナライズ回答"),
      })
    )
    .max(20)
    .describe("各質問に対するパーソナライズ済み回答"),
});

export type PersonalizedAnswers = z.infer<typeof PersonalizedAnswersSchema>;

export const RehearsalFeedbackSchema = z.object({
  specificity: z
    .string()
    .max(300)
    .describe("具体性の評価（良い点・不足点）"),
  length: z.string().max(200).describe("長さ・構成の評価"),
  weaknesses: z
    .array(z.string().max(150))
    .max(5)
    .describe("改善すべき弱点"),
  summary: z.string().max(300).describe("総合フィードバック（1〜2文）"),
});

export type RehearsalFeedback = z.infer<typeof RehearsalFeedbackSchema>;
