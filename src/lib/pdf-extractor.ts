type ExtractResult =
  | { success: true; text: string }
  | { success: false; error: string };

export async function extractTextFromPdf(
  base64Data: string
): Promise<ExtractResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse");
    const buffer = Buffer.from(base64Data, "base64");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return { success: true, text: result.text };
  } catch (error) {
    console.error("PDF extraction error:", error);
    return {
      success: false,
      error: "PDFの解析に失敗しました。画像形式で再度お試しください。",
    };
  }
}
