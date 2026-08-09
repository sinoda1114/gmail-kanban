import { z } from "zod";

export const ReplyDraftSchema = z.object({
  body: z.string().describe("返信メール本文（件名なし）"),
});

export type ReplyDraft = z.infer<typeof ReplyDraftSchema>;
