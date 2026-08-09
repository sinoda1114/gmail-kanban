import { z } from "zod";

export const InterviewRetrospectiveSchema = z.object({
  wentWell: z.string().max(1500).describe("うまくいったこと・良かった点"),
  likelyFollowUps: z
    .string()
    .max(1500)
    .describe("想定されるフォローアップ・確認事項"),
  temperatureAssessment: z
    .string()
    .max(500)
    .describe("案件・面談の温度感の整理"),
  nextPrepTips: z
    .string()
    .max(1500)
    .describe("次回面談に向けた準備のヒント（この案件向け）"),
});

export type InterviewRetrospective = z.infer<typeof InterviewRetrospectiveSchema>;
