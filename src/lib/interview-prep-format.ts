import type { CheatSheet } from "@/types/interview-prep";

export function formatCheatSheetForCopy(sheet: CheatSheet): string {
  const lines: string[] = ["【面談当日チートシート】", "", sheet.summary, ""];
  if (sheet.keyExperiences.length > 0) {
    lines.push("■ 強調する経験");
    for (const item of sheet.keyExperiences) lines.push(`・${item}`);
    lines.push("");
  }
  if (sheet.numbers && sheet.numbers.length > 0) {
    lines.push("■ 覚える数字");
    for (const item of sheet.numbers) lines.push(`・${item}`);
    lines.push("");
  }
  if (sheet.topReverseQuestions.length > 0) {
    lines.push("■ 優先逆質問");
    for (const item of sheet.topReverseQuestions) lines.push(`・${item}`);
    lines.push("");
  }
  if (sheet.dontTouchPoints.length > 0) {
    lines.push("■ 触れないポイント");
    for (const item of sheet.dontTouchPoints) lines.push(`・${item}`);
  }
  return lines.join("\n").trim();
}
