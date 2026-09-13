import {
  InterviewResearchPackSchema,
  type InterviewResearchPack,
} from "@/types/interview-research";

type ProjectForResearch = {
  title: string;
  techStack: string[] | null;
  agentCompany: string | null;
  summary: string | null;
  sourceText: string | null;
  price: string | null;
  workRate: string | null;
  location: string | null;
  remoteType: string | null;
  contractPeriod: string | null;
  startDateText: string | null;
};

export function parseStoredResearchPack(
  raw: unknown
): InterviewResearchPack | null {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  const parsed = InterviewResearchPackSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function buildInterviewResearchPrompt(project: ProjectForResearch): string {
  const techStack = Array.isArray(project.techStack)
    ? project.techStack.join(", ")
    : "";

  return `
フリーランスエンジニア向けの「面談対策パック」を作ってください。
Google 検索で企業・募集の公開情報を調べ、案件本文に無い事実は basis を speculation にしてください。
検索で裏付けられたことは evidence にし、sourceHint にサイト名や記事名を入れてください。

案件タイトル: ${project.title}
技術スタック: ${techStack || "（記載なし）"}
エージェント会社: ${project.agentCompany || "（不明）"}
案件サマリー: ${project.summary || "（なし）"}
単価・報酬: ${project.price || "（記載なし）"}
稼働率: ${project.workRate || "（記載なし）"}
勤務地: ${project.location || "（記載なし）"}
リモート: ${project.remoteType || "（記載なし）"}
契約期間: ${project.contractPeriod || "（記載なし）"}
開始時期: ${project.startDateText || "（記載なし）"}
案件詳細:
${project.sourceText || "（なし）"}

出力（JSON）:
1. companyPack: 企業パック。companyName / domain / facts（最大8）/ talkingPoints / topicsToAvoid。
2. likelyInterviews: この募集で起きやすい面談（エージェント初回・企業人事・技術面談など。最大5）。format / why / typicalFlow。
3. anticipatedQuestions: STAR ヒント付き想定質問（最大10）。question / category(technical|pm|condition|experience) / why / starHint。
4. reverseQuestionTemplates: 逆質問テンプレ（最大10）。question / category(role|team|tech|work_style|contract|selection_flow) / why。
5. frameworks: 使えるフレームワーク（60秒自己紹介、STAR、失敗談、逆質問の聞き方など最大5）。title / script / tips(任意)。
  `.trim();
}

export function buildResearchPromptGuidance(
  pack: InterviewResearchPack | null | undefined
): string {
  if (!pack) return "";

  const facts = pack.companyPack.facts
    .slice(0, 8)
    .map(
      (f) =>
        `- [${f.basis}] ${f.text}${f.sourceHint ? `（${f.sourceHint}）` : ""}`
    )
    .join("\n");
  const interviews = pack.likelyInterviews
    .slice(0, 5)
    .map((item) => `- ${item.format}: ${item.why}`)
    .join("\n");
  const questions = pack.anticipatedQuestions
    .slice(0, 8)
    .map((q) => `- (${q.category}) ${q.question}`)
    .join("\n");
  const reverse = pack.reverseQuestionTemplates
    .slice(0, 8)
    .map((q) => `- (${q.category}) ${q.question}`)
    .join("\n");
  const talkingPoints = pack.companyPack.talkingPoints
    .slice(0, 8)
    .map((item) => `- ${item}`)
    .join("\n");
  const topicsToAvoid = pack.companyPack.topicsToAvoid
    .slice(0, 6)
    .map((item) => `- ${item}`)
    .join("\n");

  return `
【面談対策パック（検索グラウンディング済み。ここに無い事実は作らない）】
企業: ${pack.companyPack.companyName || "（不明）"}
ドメイン: ${pack.companyPack.domain}
事実・仮説:
${facts || "（なし）"}
話すべきトピック:
${talkingPoints || "（なし）"}
避ける話題:
${topicsToAvoid || "（なし）"}
起きやすい面談:
${interviews || "（なし）"}
想定質問の種:
${questions || "（なし）"}
逆質問の種:
${reverse || "（なし）"}

反映方針:
- companyBrief は対策パックの facts / talkingPoints / topicsToAvoid を優先し、basis を維持する
- questions は anticipatedQuestions を土台に、STAR ヒントを aiAnswer に活かす
- reverseQuestions は reverseQuestionTemplates を優先する
- likelyInterviews を strategy に反映する
- パックに無い社名変更・数字の捏造はしない
`.trim();
}

export function collectSourceUrls(sources: unknown): string[] {
  if (!Array.isArray(sources)) return [];
  const urls: string[] = [];
  for (const source of sources) {
    if (
      source &&
      typeof source === "object" &&
      "url" in source &&
      typeof source.url === "string" &&
      source.url.startsWith("http")
    ) {
      urls.push(source.url);
    }
  }
  return [...new Set(urls)].slice(0, 12);
}
