export function buildResumeExtractionPrompt(): string {
  return `
あなたは履歴書・職務経歴書の分析エキスパートです。
アップロードされた履歴書（PDF or 画像）から、フリーランス案件の面接準備に役立つ情報を抽出してください。

出力 JSON:
- summary: 経歴の要約（面接準備で使える一文サマリー）
- strengths: 強み・アピールポイント（最大8件）
- skills: 技術スキル・経験領域のリスト（最大20件）
- careerHistory: 職歴・プロジェクト履歴のハイライト（時系列、最大15件）
- likelyQuestions: この経歴から聞かれそうな質問（最大10件）

日本語で出力してください。経歴書に記載されている内容のみを根拠にし、推測は最小限にしてください。
  `.trim();
}
