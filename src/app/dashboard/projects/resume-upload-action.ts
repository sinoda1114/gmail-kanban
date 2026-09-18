"use server";

import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { resumeUploads } from "@/db/schema";
import { ResumeAnalysisSchema, type ResumeAnalysis } from "@/types/resume-analysis";
import { extractTextFromPdf } from "@/lib/pdf-extractor";
import { GEMINI_RESEARCH_MODEL_ID, GEMINI_JSON_PROVIDER_OPTIONS } from "@/lib/ai-model";

const RESUME_EXTRACTION_PROMPT = `
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

type UploadResult =
  | { success: true; uploadId: string }
  | { success: false; error: string };

export async function uploadAndAnalyzeResume(
  fileName: string,
  fileType: string,
  fileSize: number,
  fileDataUrl: string
): Promise<UploadResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "認証が必要です" };
  }

  if (fileSize > 10 * 1024 * 1024) {
    return { success: false, error: "ファイルサイズは10MB以下にしてください" };
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (!allowedTypes.includes(fileType)) {
    return {
      success: false,
      error: "対応していないファイル形式です（PDF, JPEG, PNG, WebP のみ）",
    };
  }

  try {
    const uploadId = randomUUID();

    const base64Data = fileDataUrl.split(",")[1];
    if (!base64Data) {
      return { success: false, error: "ファイルデータの読み込みに失敗しました" };
    }

    let result;
    if (fileType === "application/pdf") {
      const extractResult = await extractTextFromPdf(base64Data);
      if (!extractResult.success) {
        return { success: false, error: extractResult.error };
      }

      result = await generateText({
        model: google(GEMINI_RESEARCH_MODEL_ID),
        prompt: `${RESUME_EXTRACTION_PROMPT}\n\n【抽出されたテキスト】\n${extractResult.text}`,
        output: Output.object({ schema: ResumeAnalysisSchema }),
        providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
      });
    } else {
      result = await generateText({
        model: google(GEMINI_RESEARCH_MODEL_ID),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: RESUME_EXTRACTION_PROMPT },
              {
                type: "image",
                image: base64Data,
              },
            ],
          },
        ],
        output: Output.object({ schema: ResumeAnalysisSchema }),
        providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
      });
    }

    const validated = ResumeAnalysisSchema.safeParse(result.output);
    if (!validated.success) {
      console.error("Validation error:", validated.error);
      return { success: false, error: "分析結果の形式が不正です" };
    }

    const analysis = validated.data;
    const extractedText = [
      analysis.summary,
      ...analysis.careerHistory,
      ...analysis.strengths,
      ...analysis.skills,
    ].join("\n");

    await db.insert(resumeUploads).values({
      id: uploadId,
      userId: session.userId,
      fileName,
      fileType,
      fileSize,
      extractedText,
      analysisResult: analysis,
      model: GEMINI_RESEARCH_MODEL_ID,
    });

    return { success: true, uploadId };
  } catch (error) {
    console.error("Resume upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "アップロードに失敗しました",
    };
  }
}

type AnalysisResult =
  | { success: true; analysis: ResumeAnalysis }
  | { success: false; error: string };

export async function getResumeAnalysis(uploadId: string): Promise<AnalysisResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "認証が必要です" };
  }

  try {
    const upload = await db.query.resumeUploads.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.id, uploadId), eq(t.userId, session.userId)),
    });

    if (!upload) {
      return { success: false, error: "アップロードが見つかりません" };
    }

    if (!upload.analysisResult) {
      return { success: false, error: "分析結果がありません" };
    }

    return { success: true, analysis: upload.analysisResult };
  } catch (error) {
    console.error("Get resume analysis error:", error);
    return { success: false, error: "分析結果の取得に失敗しました" };
  }
}
