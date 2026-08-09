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

export const INTERVIEW_PARTNER_VALUES = [
  "general",
  "agent",
  "client",
  "tech_interviewer",
  "custom",
] as const;
export type InterviewPartnerValue = (typeof INTERVIEW_PARTNER_VALUES)[number];

export const INTERVIEW_PARTNER_LABELS: Record<
  InterviewPartnerValue,
  string
> = {
  general: "バランス重視（未設定）",
  agent: "エージェント担当",
  client: "企業・クライアント",
  tech_interviewer: "技術面談担当",
  custom: "その他（自由入力）",
};

export const EVIDENCE_BASIS = ["evidence", "speculation"] as const;
export type EvidenceBasis = (typeof EVIDENCE_BASIS)[number];

export const EVIDENCE_BASIS_LABELS: Record<EvidenceBasis, string> = {
  evidence: "根拠あり",
  speculation: "推測",
};

export const RED_FLAG_SEVERITIES = ["high", "medium", "low"] as const;
export type RedFlagSeverity = (typeof RED_FLAG_SEVERITIES)[number];

export const RED_FLAG_SEVERITY_LABELS: Record<RedFlagSeverity, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const RED_FLAG_SEVERITY_COLORS: Record<RedFlagSeverity, string> = {
  high: "red",
  medium: "orange",
  low: "gray",
};

export const RED_FLAG_CATEGORIES = [
  "rate",
  "work_style",
  "onsite",
  "period",
  "vague_requirements",
  "other",
] as const;
export type RedFlagCategory = (typeof RED_FLAG_CATEGORIES)[number];

export const RED_FLAG_CATEGORY_LABELS: Record<RedFlagCategory, string> = {
  rate: "単価・報酬",
  work_style: "働き方",
  onsite: "出社・勤務地",
  period: "期間・開始時期",
  vague_requirements: "要件の曖昧さ",
  other: "その他",
};

export const CompanyHypothesisSchema = z.object({
  text: z.string().max(300).describe("企業・案件に関する仮説"),
  basis: z
    .enum(EVIDENCE_BASIS)
    .describe("根拠の種別（evidence=案件記載/speculation=推測）"),
  sourceHint: z
    .string()
    .max(200)
    .optional()
    .describe("根拠の出典ヒント（案件フィールド名や記載箇所）"),
});

export const CompanyBriefSchema = z.object({
  domain: z.string().max(200).describe("想定される事業ドメイン・業界"),
  hypotheses: z
    .array(CompanyHypothesisSchema)
    .max(8)
    .describe("企業・案件仮説（根拠あり/推測を明示）"),
  talkingPoints: z
    .array(z.string().max(200))
    .max(8)
    .describe("話すべきトピック・強みの接点"),
  topicsToAvoid: z
    .array(z.string().max(200))
    .max(6)
    .describe("避けるべき話題・ネガティブに触れない点"),
});

export const TechDeepDiveItemSchema = z.object({
  tech: z.string().max(100).describe("技術名"),
  deepDiveTopics: z
    .array(z.string().max(200))
    .max(6)
    .describe("深掘りされそうなトピック"),
  experienceConnection: z
    .string()
    .max(400)
    .describe("自分の経験との接続方法"),
  phrasesToAvoid: z
    .array(z.string().max(150))
    .max(4)
    .describe("使わない方がよい言い回し"),
});

export const RedFlagSchema = z.object({
  flag: z.string().max(300).describe("リスク・懸念の内容"),
  severity: z.enum(RED_FLAG_SEVERITIES).describe("深刻度"),
  confirmationQuestion: z
    .string()
    .max(300)
    .describe("面談で確認すべき質問"),
  category: z.enum(RED_FLAG_CATEGORIES).describe("カテゴリ"),
});

export const CheatSheetSchema = z.object({
  keyExperiences: z
    .array(z.string().max(200))
    .max(6)
    .describe("強調すべき経験・実績"),
  numbers: z
    .array(z.string().max(100))
    .max(6)
    .optional()
    .describe("覚えておくべき数字・規模感"),
  topReverseQuestions: z
    .array(z.string().max(200))
    .max(5)
    .describe("優先して聞く逆質問"),
  dontTouchPoints: z
    .array(z.string().max(200))
    .max(6)
    .describe("触れない・避けるポイント"),
  summary: z.string().max(800).describe("面談当日用の一文サマリー"),
});

export type CompanyBrief = z.infer<typeof CompanyBriefSchema>;
export type TechDeepDiveItem = z.infer<typeof TechDeepDiveItemSchema>;
export type RedFlag = z.infer<typeof RedFlagSchema>;
export type CheatSheet = z.infer<typeof CheatSheetSchema>;

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
  companyBrief: CompanyBriefSchema.describe(
    "企業・クライアント向けブリーフ（仮説・ドメイン・話題）"
  ),
  techDeepDive: z
    .array(TechDeepDiveItemSchema)
    .max(15)
    .describe("技術スタック別の深掘り準備"),
  redFlags: z
    .array(RedFlagSchema)
    .max(10)
    .describe("判断・確認に焦点を当てたレッドフラグ"),
  cheatSheet: CheatSheetSchema.describe("面談当日用ワンページチートシート"),
});

export type InterviewPrepAI = z.infer<typeof InterviewPrepAISchema>;
