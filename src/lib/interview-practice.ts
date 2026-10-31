import type { InterviewResearchPack } from "@/types/interview-research";
import {
  type PracticeMessage,
  shouldWrapUpPractice,
} from "@/types/interview-practice";

type ProjectForPractice = {
  title: string;
  techStack: string[] | null;
  summary: string | null;
};

export function formatPracticeHistory(messages: PracticeMessage[]): string {
  if (messages.length === 0) return "（まだ発言なし）";
  return messages
    .map((m) => `${m.role === "interviewer" ? "面接官" : "候補者"}: ${m.content}`)
    .join("\n");
}

export function formatPracticeCaseBrief(input: {
  project: ProjectForPractice;
  careerMemo?: string | null;
  research?: InterviewResearchPack | null;
  prepQuestions?: string[];
}): string {
  const techStack = Array.isArray(input.project.techStack)
    ? input.project.techStack.join(", ")
    : "";
  const questions = (input.prepQuestions ?? []).slice(0, 8).join("\n- ");
  const researchBits = input.research
    ? [
        `企業: ${input.research.companyPack.companyName || "（不明）"}`,
        `ドメイン: ${input.research.companyPack.domain}`,
        ...input.research.anticipatedQuestions
          .slice(0, 5)
          .map((q) => `想定: ${q.question}`),
      ].join("\n")
    : "（対策パックなし）";

  return `案件: ${input.project.title}
技術: ${techStack || "（記載なし）"}
サマリー: ${input.project.summary || "（なし）"}
経歴メモ: ${input.careerMemo?.trim() || "（なし）"}
対策パック:
${researchBits}
準備済み想定質問:
${questions ? `- ${questions}` : "（なし）"}`;
}

export function buildPracticeTurnPrompt(input: {
  project: ProjectForPractice;
  careerMemo?: string | null;
  research?: InterviewResearchPack | null;
  prepQuestions?: string[];
  messages: PracticeMessage[];
}): string {
  const wrapUp = shouldWrapUpPractice(input.messages);

  return `
あなたはフリーランス案件の面談相手役です。テキストのみ。音声は不要です。
日本語で、1回につき質問は1つだけ。候補者の回答を受けて深掘りし、最後に短いフィードバックを出します。

${formatPracticeCaseBrief(input)}

これまでの対話:
${formatPracticeHistory(input.messages)}

出力 JSON:
- 対話が空なら kind=question で最初の質問（自己紹介か、募集に即した経験確認）。
- 候補者の直前回答が薄い・抽象的なら kind=follow_up で深掘り。
- 新しい論点に進むなら kind=question。
- ${wrapUp ? "すでに十分なターン数です。必ず kind=wrap_up にし、feedback を付けてください。" : "まだ続けてよいですが、自然な区切りなら wrap_up でも構いません。"}
- wrap_up のとき feedback は specificity / length / weaknesses / summary。
- kind が question または follow_up のときは feedback を付けない。
  `.trim();
}

export function buildLivePracticePrompt(input: {
  project: ProjectForPractice;
  careerMemo?: string | null;
  research?: InterviewResearchPack | null;
  prepQuestions?: string[];
}): string {
  return `
あなたはフリーランス案件の面談相手役です。Gemini Live の音声会話で、今この場の面接官として振る舞います。
日本語だけで自然に話してください。英語は使わないでください。
1回の発話では質問を1つだけ。候補者の回答を聞いて短く相槌し、具体例や数字が薄ければ深掘りします。
自己紹介か、募集に即した経験確認から始めてください。およそ6往復したらお礼を言って面談を締めます。
テキストの読み上げではなく、あなた自身の声で話してください。

${formatPracticeCaseBrief(input)}
  `.trim();
}

export function buildPracticeStreamPrompt(input: {
  project: ProjectForPractice;
  careerMemo?: string | null;
  research?: InterviewResearchPack | null;
  prepQuestions?: string[];
  messages: PracticeMessage[];
}): string {
  const wrapUp = shouldWrapUpPractice(input.messages);

  return `
あなたはフリーランス案件の面談相手役です。日本語で、1回につき質問は1つだけ。
候補者の回答を受けて深掘りし、自然な対話を続けます。

${formatPracticeCaseBrief(input)}

これまでの対話:
${formatPracticeHistory(input.messages)}

指示:
- 対話が空なら最初の質問（自己紹介か、募集に即した経験確認）。
- 候補者の直前回答が薄い・抽象的なら深掘りの質問。
- 新しい論点に進むなら新しい質問。
- ${wrapUp ? "すでに十分なターン数です。「本日はお時間いただきありがとうございました」のような締めの言葉を言って面談を終了してください。" : "まだ続けてよいです。質問を続けてください。"}

次の発言をテキストで出力してください（JSON不要）:
  `.trim();
}

export function buildLiveFeedbackPrompt(messages: PracticeMessage[]): string {
  return `
次のフリーランス案件の模擬面談の文字起こしを読み、短いフィードバックを JSON で出してください。
評価軸は specificity / length / weaknesses / summary です。日本語。

対話:
${formatPracticeHistory(messages)}
  `.trim();
}
