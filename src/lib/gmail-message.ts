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
  internalDate?: string;
  payload?: GmailPart;
};

export type GmailThreadResource = {
  id?: string;
  messages?: GmailMessageResource[];
};

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    normalized.length % 4 === 0
      ? ""
      : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf8");
}

function headerValue(
  headers: GmailHeader[] | undefined,
  name: string
): string {
  const found = headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
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
  date: string;
  body: string;
} {
  const headers = message.payload?.headers;
  const subject = headerValue(headers, "Subject");
  const from = headerValue(headers, "From");
  const date =
    headerValue(headers, "Date") ||
    (message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : "");

  const parts: GmailPart[] = [];
  collectParts(message.payload, parts);

  const plain = parts.find(
    (p) => p.mimeType === "text/plain" && p.body?.data && !p.filename
  );
  if (plain?.body?.data) {
    return {
      subject,
      from,
      date,
      body: decodeBase64Url(plain.body.data).trim(),
    };
  }

  const html = parts.find(
    (p) => p.mimeType === "text/html" && p.body?.data && !p.filename
  );
  if (html?.body?.data) {
    return {
      subject,
      from,
      date,
      body: stripHtml(decodeBase64Url(html.body.data)),
    };
  }

  if (message.payload?.body?.data) {
    const raw = decodeBase64Url(message.payload.body.data);
    const body =
      message.payload.mimeType === "text/html" ? stripHtml(raw) : raw.trim();
    return { subject, from, date, body };
  }

  return { subject, from, date, body: (message.snippet ?? "").trim() };
}

export function formatFetchedMail(input: {
  subject: string;
  from: string;
  date?: string;
  body: string;
}): string {
  const lines = [
    input.subject ? `件名: ${input.subject}` : null,
    input.from ? `From: ${input.from}` : null,
    input.date ? `Date: ${input.date}` : null,
    "",
    input.body,
  ].filter((line) => line !== null);
  return lines.join("\n").trim();
}

export function formatGmailThreadText(
  messages: GmailMessageResource[]
): string {
  if (messages.length === 0) return "";

  const sorted = [...messages].sort((a, b) => {
    const aTime = Number(a.internalDate ?? 0);
    const bTime = Number(b.internalDate ?? 0);
    return aTime - bTime;
  });

  const blocks = sorted.map((message, index) => {
    const extracted = extractTextFromGmailMessage(message);
    const header =
      sorted.length > 1
        ? `--- メール ${index + 1}/${sorted.length} ---`
        : null;
    const formatted = formatFetchedMail(extracted);
    return header ? `${header}\n${formatted}` : formatted;
  });

  return blocks.join("\n\n").trim();
}
