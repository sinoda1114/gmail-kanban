type ExtractResult =
  | { success: true; text: string }
  | { success: false; error: string };

export async function extractTextFromPdf(
  base64Data: string
): Promise<ExtractResult> {
  try {
    // pdf-parseはCJS形式のため、Server Action内でrequireを使用
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const buffer = Buffer.from(base64Data, "base64");
    const pdfData = await pdfParse(buffer);
    return { success: true, text: pdfData.text };
  } catch (error) {
    console.error("PDF extraction error:", error);
    return {
      success: false,
      error: "PDFの解析に失敗しました。画像形式で再度お試しください。",
    };
  }
}
