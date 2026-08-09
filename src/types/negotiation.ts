import { z } from "zod";

const NegotiationTopicSchema = z.object({
  talkingPoints: z
    .array(z.string().max(300))
    .max(6)
    .describe("交渉の論点・押さえるポイント"),
  samplePhrases: z
    .array(z.string().max(400))
    .max(6)
    .describe("そのまま使えるフレーズ例"),
});

export const NegotiationSchema = z.object({
  rate: NegotiationTopicSchema.describe("単価に関する交渉"),
  workload: NegotiationTopicSchema.describe("稼働率・稼働日数に関する交渉"),
  startDate: NegotiationTopicSchema.describe("開始時期に関する交渉"),
});

export type NegotiationTopic = z.infer<typeof NegotiationTopicSchema>;
export type NegotiationContent = z.infer<typeof NegotiationSchema>;
