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

export function buildPracticeTurnPrompt(input: {
  project: ProjectForPractice;
  careerMemo?: string | null;
  research?: InterviewResearchPack | null;
  prepQuestions?: string[];
  messages: PracticeMessage[];
}): string {
  const techStack = Array.isArray(input.project.techStack)
    ? input.project.techStack.join(", ")
    : "";
  const wrapUp = shouldWrapUpPractice(input.messages);
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

  return `
あなたはフリーランス案件の面談相手役です。テキストのみ。音声は不要です。
日本語で、1回につき質問は1つだけ。候補者の回答を受けて深掘りし、最後に短いフィードバックを出します。

案件: ${input.project.title}
技術: ${techStack || "（記載なし）"}
サマリー: ${input.project.summary || "（なし）"}
経歴メモ: ${input.careerMemo?.trim() || "（なし）"}
対策パック:
${researchBits}
準備済み想定質問:
${questions ? `- ${questions}` : "（なし）"}

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
