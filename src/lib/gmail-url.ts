/** Gmail Web UI の URL からメッセージ/スレッド ID を取り出す。 */
export function parseGmailUrlId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (host !== "mail.google.com" && host !== "gmail.com") {
    return null;
  }

  const hash = url.hash.replace(/^#/, "");
  if (hash) {
    const segments = hash.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && isGmailUiId(last)) {
      return last;
    }
  }

  const pathMatch = url.pathname.match(/\/(?:th|msg)\/([^/]+)/i);
  if (pathMatch?.[1] && isGmailUiId(pathMatch[1])) {
    return pathMatch[1];
  }

  return null;
}

function isGmailUiId(value: string): boolean {
  if (/^FMfcgz[A-Za-z0-9]+$/i.test(value)) return true;
  if (/^[0-9a-f]{10,}$/i.test(value)) return true;
  if (/^thread-f:\d+$/i.test(value)) return true;
  if (/^[A-Za-z0-9_-]{10,}$/.test(value)) return true;
  return false;
}

/** 新しい Gmail Web の同期 ID。Gmail API の message/thread ID には使えない。 */
export function isGmailWebSyncId(id: string): boolean {
  return /^FMfcgz[A-Za-z0-9]+$/i.test(id.trim());
}

/** URL または生の thread/message ID を解釈する。 */
export function parseGmailInput(input: string): {
  id: string;
  gmailUrl?: string;
} | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromUrl = parseGmailUrlId(trimmed);
  if (fromUrl) {
    return {
      id: fromUrl,
      gmailUrl: trimmed.startsWith("http") ? trimmed : undefined,
    };
  }

  if (isGmailUiId(trimmed)) {
    return { id: trimmed };
  }

  return null;
}
