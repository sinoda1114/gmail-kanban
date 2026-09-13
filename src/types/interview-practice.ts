import { z } from "zod";
import { RehearsalFeedbackSchema } from "./interview-prep";

export const PRACTICE_MESSAGE_ROLES = ["interviewer", "candidate"] as const;
export type PracticeMessageRole = (typeof PRACTICE_MESSAGE_ROLES)[number];

export const PracticeMessageSchema = z.object({
  role: z.enum(PRACTICE_MESSAGE_ROLES),
  content: z.string().max(2000),
});

export type PracticeMessage = z.infer<typeof PracticeMessageSchema>;

export const PRACTICE_TURN_KINDS = ["question", "follow_up", "wrap_up"] as const;
export type PracticeTurnKind = (typeof PRACTICE_TURN_KINDS)[number];

export const PracticeTurnSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("question"),
    message: z.string().max(800).describe("次の質問（新しい論点）"),
  }),
  z.object({
    kind: z.literal("follow_up"),
    message: z.string().max(800).describe("直前の回答への深掘り"),
  }),
  z.object({
    kind: z.literal("wrap_up"),
    message: z.string().max(800).describe("締めの一言"),
    feedback: RehearsalFeedbackSchema.describe("通し練習の短いフィードバック"),
  }),
]);

export type PracticeTurn = z.infer<typeof PracticeTurnSchema>;

export const PracticeTurnAiSchema = z.object({
  kind: z.enum(PRACTICE_TURN_KINDS),
  message: z.string().max(800).describe("面接官の発話"),
  feedback: RehearsalFeedbackSchema.optional().describe(
    "wrap_up のとき必須。それ以外は省略"
  ),
});

export type PracticeTurnAi = z.infer<typeof PracticeTurnAiSchema>;

const FALLBACK_FEEDBACK = {
  specificity: "具体例の有無を見直してください。",
  length: "面談で話す長さに整えてください。",
  weaknesses: ["数字や事例を足す"],
  summary: "練習はここまで。指摘を次の準備に活かしてください。",
};

export function normalizePracticeTurn(raw: PracticeTurnAi): PracticeTurn {
  const parsed = PracticeTurnSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (raw.kind === "wrap_up") {
    return {
      kind: "wrap_up",
      message: raw.message,
      feedback: raw.feedback ?? FALLBACK_FEEDBACK,
    };
  }
  return {
    kind: raw.kind === "follow_up" ? "follow_up" : "question",
    message: raw.message,
  };
}

export const PRACTICE_SESSION_STATUSES = ["active", "completed"] as const;
export type PracticeSessionStatus = (typeof PRACTICE_SESSION_STATUSES)[number];

export const PRACTICE_ENDED_MESSAGE = "この練習は終了しています";
export const PRACTICE_STALE_MESSAGE =
  "対話が更新されています。画面を再読み込みしてから答えてください。";

export function canSubmitPracticeReply(status: string): boolean {
  return status === "active";
}

export const MAX_PRACTICE_INTERVIEWER_TURNS = 6;

export function countInterviewerTurns(messages: PracticeMessage[]): number {
  return messages.filter((m) => m.role === "interviewer").length;
}

export function shouldWrapUpPractice(messages: PracticeMessage[]): boolean {
  return countInterviewerTurns(messages) >= MAX_PRACTICE_INTERVIEWER_TURNS;
}

export const PRACTICE_WRAP_UP_MESSAGE =
  "ありがとうございました。通し練習はここまでです。下のフィードバックを次の準備に使ってください。";

export function coercePracticeWrapUp(
  turn: PracticeTurn,
  messages: PracticeMessage[]
): PracticeTurn {
  if (!shouldWrapUpPractice(messages) || turn.kind === "wrap_up") {
    return turn;
  }
  return {
    kind: "wrap_up",
    message: PRACTICE_WRAP_UP_MESSAGE,
    feedback: FALLBACK_FEEDBACK,
  };
}
