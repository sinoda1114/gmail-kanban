type GmailHeader = { name?: string; value?: string };
type GmailBody = { data?: string; size?: number };
type GmailPart = {
  mimeType?: string;
  filename?: string;
  body?: GmailBody;
  parts?: GmailPart[];
  headers?: GmailHeader[];
};

export type GmailMessageResource = {
  id?: string;
  threadId?: string;
  snippet?: string;
  payload?: GmailPart;
};

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf8");
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  const found = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value?.trim() ?? "";
}

function collectParts(part: GmailPart | undefined, out: GmailPart[]): void {
  if (!part) return;
  out.push(part);
  for (const child of part.parts ?? []) {
    collectParts(child, out);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function extractTextFromGmailMessage(message: GmailMessageResource): {
  subject: string;
  from: string;
  body: string;
} {
  const headers = message.payload?.headers;
  const subject = headerValue(headers, "Subject");
  const from = headerValue(headers, "From");

  const parts: GmailPart[] = [];
  collectParts(message.payload, parts);

  const plain = parts.find(
    (p) => p.mimeType === "text/plain" && p.body?.data && !p.filename
  );
  if (plain?.body?.data) {
    return { subject, from, body: decodeBase64Url(plain.body.data).trim() };
  }

  const html = parts.find(
    (p) => p.mimeType === "text/html" && p.body?.data && !p.filename
  );
  if (html?.body?.data) {
    return { subject, from, body: stripHtml(decodeBase64Url(html.body.data)) };
  }

  // single-part body
  if (message.payload?.body?.data) {
    const raw = decodeBase64Url(message.payload.body.data);
    const body =
      message.payload.mimeType === "text/html" ? stripHtml(raw) : raw.trim();
    return { subject, from, body };
  }

  return { subject, from, body: (message.snippet ?? "").trim() };
}

export function formatFetchedMail(input: {
  subject: string;
  from: string;
  body: string;
}): string {
  const lines = [
    input.subject ? `件名: ${input.subject}` : null,
    input.from ? `From: ${input.from}` : null,
    "",
    input.body,
  ].filter((line) => line !== null);
  return lines.join("\n").trim();
}
