import {
  INTERVIEW_PARTNER_VALUES,
  type InterviewPartnerValue,
} from "@/types/interview-prep";

const KNOWN_PARTNERS: InterviewPartnerValue[] = [...INTERVIEW_PARTNER_VALUES];

export function resolveInterviewPartner(
  stored: string | null | undefined
): { value: InterviewPartnerValue; customLabel: string } {
  if (!stored || stored.trim() === "") {
    return { value: "general", customLabel: "" };
  }
  if (KNOWN_PARTNERS.includes(stored as InterviewPartnerValue)) {
    return { value: stored as InterviewPartnerValue, customLabel: "" };
  }
  return { value: "custom", customLabel: stored };
}

export function serializeInterviewPartner(
  value: InterviewPartnerValue,
  customLabel: string
): string {
  if (value === "custom") return customLabel.trim();
  return value;
}

export function getPartnerDisplayLabel(
  stored: string | null | undefined
): string {
  const { value, customLabel } = resolveInterviewPartner(stored);
  if (value === "custom") return customLabel || "その他";
  const labels: Record<InterviewPartnerValue, string> = {
    general: "バランス重視",
    agent: "エージェント担当",
    client: "企業・クライアント",
    tech_interviewer: "技術面談担当",
    custom: "その他",
  };
  return labels[value];
}

export function buildPartnerPromptGuidance(
  stored: string | null | undefined
): string {
  const { value, customLabel } = resolveInterviewPartner(stored);
  const base = `面談相手の種別: ${getPartnerDisplayLabel(stored)}${
    value === "custom" && customLabel ? `（${customLabel}）` : ""
  }`;
  switch (value) {
    case "agent":
      return `${base}\n\n【エージェント面談の重点】\n- 案件マッチ度・スキル適合性の確認が中心。企業への推薦理由を明確に伝える。\n- 単価・稼働・開始時期など条件面のすり合わせ。エージェント経由の交渉余地を意識。\n- 企業の詳細はエージェント情報ベース。不明点は逆質問で補完する姿勢。\n- 技術深掘りは概要レベル。過度なアーキテクチャ議論は避け、経験の要約を重視。\n- 想定質問は条件・経験・稼働可否に偏せる。逆質問は選考フロー・企業情報の確認を厚く。`;
    case "client":
      return `${base}\n\n【企業・クライアント面談の重点】\n- ビジネス課題への貢献・プロジェクトへの適合性が中心。技術だけでなく成果志向を示す。\n- チーム文化・コミュニケーションスタイルへの適合も重要。協働姿勢を強調。\n- 企業ブリーフは案件記載と推測を区別し、話すべきトピックを具体的に。\n- 条件確認は丁寧に。レッドフラグは契約・働き方・要件曖昧さに注目。\n- 想定質問は経験・PM観点を厚く。逆質問は役割・体制・期待成果を確認。`;
    case "tech_interviewer":
      return `${base}\n\n【技術面談の重点】\n- 技術スタックの深掘り・設計判断・トラブル対応経験が中心。具体例と数字を重視。\n- techDeepDiveは各技術について深掘りトピックと経験接続を詳細に。空の技術スタックなら空配列。\n- 想定質問のtechnicalカテゴリを厚く。architecture・パフォーマンス・運用も含める。\n- レッドフラグは技術要件の曖昧さ・スキルミスマッチに注目。\n- 企業ブリーフは技術文脈（システム規模・開発体制の推測）を重視。`;
    case "custom":
      return `${base}\n\n【カスタム面談相手の重点】\n- 相手の役割（${customLabel || "不明"}）に合わせてバランスよく準備。技術と条件の両面をカバー。\n- 相手が技術寄りかビジネス寄りか不明な場合は、幅広い想定質問を生成。`;
    default:
      return `${base}\n\n【バランス重視の重点】\n- 技術・条件・経験・PM観点をバランスよくカバー。面談相手が未設定のため汎用的に準備。\n- エージェント初回・企業人事・技術面談のいずれにも対応できる内容にする。\n- 企業ブリーフ・技術深掘り・レッドフラグ・チートシートを均等に充実させる。`;
  }
}
