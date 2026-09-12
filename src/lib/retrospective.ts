import {
  InterviewRetrospectiveSchema,
  type InterviewRetrospective,
} from "@/types/retrospective";

export function hasRetrospectiveContent(
  retrospective: InterviewRetrospective | null | undefined
): retrospective is InterviewRetrospective {
  if (!retrospective) return false;
  return [
    retrospective.wentWell,
    retrospective.likelyFollowUps,
    retrospective.temperatureAssessment,
    retrospective.nextPrepTips,
  ].some((value) => value?.trim());
}

export function parseStoredRetrospective(
  raw: unknown
): InterviewRetrospective | null {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  const parsed = InterviewRetrospectiveSchema.safeParse(value);
  if (!parsed.success) return null;
  if (!hasRetrospectiveContent(parsed.data)) return null;
  return parsed.data;
}

export function buildRetrospectivePromptGuidance(
  retrospective: InterviewRetrospective | null | undefined
): string {
  if (!hasRetrospectiveContent(retrospective)) {
    return "";
  }

  const field = (label: string, value: string) =>
    value.trim() ? `${label}:\n${value.trim()}` : null;

  const fields = [
    field("うまくいったこと", retrospective.wentWell),
    field("想定フォローアップ", retrospective.likelyFollowUps),
    field("温度感", retrospective.temperatureAssessment),
    field("次回準備のヒント", retrospective.nextPrepTips),
  ].filter((line): line is string => line !== null);

  return `
【前回面談の振り返り（当該案件・メモ由来。ここに無い事実は作らない）】
${fields.join("\n\n")}

反映方針:
- nextPrepTips を strategy・想定質問・逆質問の優先度に反映する
- likelyFollowUps は先方が次に聞いてきそうなことなので questions（想定質問）へ。reverseQuestions（自分から聞く逆質問）には入れない
- temperatureAssessment はアピールの強弱と確認事項の温度に使う
- 振り返りに書かれていない出来事・数字・社名は追加しない
`.trim();
}
