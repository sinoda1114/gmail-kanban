export const PRACTICE_INPUT_MODES = ["text", "voice"] as const;
export type PracticeInputMode = (typeof PRACTICE_INPUT_MODES)[number];

export function parsePracticeInputMode(value: unknown): PracticeInputMode {
  return value === "voice" ? "voice" : "text";
}

export function lastInterviewerContent(
  messages: ReadonlyArray<{ role: string; content: string }>
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "interviewer" && message.content.trim()) {
      return message.content;
    }
  }
  return null;
}
