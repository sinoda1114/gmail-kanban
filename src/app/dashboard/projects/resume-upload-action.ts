"use server";

import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { resumeUploads } from "@/db/schema";
import { ResumeAnalysisSchema, type ResumeAnalysis } from "@/types/resume-analysis";
import { buildResumeExtractionPrompt } from "@/lib/resume-extraction";
import { GEMINI_RESEARCH_MODEL_ID, GEMINI_JSON_PROVIDER_OPTIONS } from "@/lib/ai-model";

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

    const prompt = buildResumeExtractionPrompt();

    let analysis: ResumeAnalysis;
    if (fileType === "application/pdf") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const buffer = Buffer.from(base64Data, "base64");
        const pdfData = await pdfParse(buffer);
        const extractedText = pdfData.text;

        const result = await generateText({
          model: google(GEMINI_RESEARCH_MODEL_ID),
          prompt: `${prompt}\n\n【抽出されたテキスト】\n${extractedText}`,
          output: Output.object({ schema: ResumeAnalysisSchema }),
          providerOptions: GEMINI_JSON_PROVIDER_OPTIONS,
        });

        analysis = result.output as unknown as ResumeAnalysis;
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        return {
          success: false,
          error: "PDFの解析に失敗しました。画像形式で再度お試しください。",
        };
      }
    } else {
      const result = await generateText({
        model: google(GEMINI_RESEARCH_MODEL_ID),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
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

      analysis = result.output as unknown as ResumeAnalysis;
    }
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
