import { z } from "zod";
import { PROJECT_STATUSES } from "./project";

export const ProjectExtractionSchema = z.object({
  title: z.string().describe("案件タイトル"),
  agentCompany: z.string().optional().describe("エージェント会社名"),
  agentPerson: z.string().optional().describe("担当者名"),
  summary: z.string().optional().describe("案件サマリー"),
  price: z.string().optional().describe("単価（例: 90万円）"),
  workRate: z.string().optional().describe("稼働率（例: 週5日）"),
  location: z.string().optional().describe("勤務地"),
  remoteType: z
    .enum(["full_remote", "partial_remote", "on_site"])
    .optional()
    .describe("リモート区分"),
  techStack: z.array(z.string()).optional().describe("技術スタック"),
  startDateText: z.string().optional().describe("開始時期"),
  contractPeriod: z.string().optional().describe("契約期間"),
  suggestedStatus: z
    .enum(PROJECT_STATUSES)
    .optional()
    .describe("推奨ステータス"),
  suggestedNextAction: z
    .string()
    .optional()
    .describe("推奨する次のアクション"),
  concerns: z.array(z.string()).optional().describe("気になる点・不明点"),
});

export type ProjectExtraction = z.infer<typeof ProjectExtractionSchema>;
