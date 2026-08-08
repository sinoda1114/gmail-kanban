/**
 * Gmail Web UI の URL からメッセージ/スレッド ID を取り出す。
 *
 * 例:
 * - https://mail.google.com/mail/u/0/#starred/FMfcgzQhVNQgLwpqNCTfGCjmQgqBCMxB
 * - https://mail.google.com/mail/u/0/#inbox/18c2f3a1b2d4e5f6
 * - https://mail.google.com/mail/u/0/#label/agent/FMfcgz...
 */
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

  // hash: #starred/<id> / #inbox/<id> / #label/<name>/<id> / #search/<q>/<id>
  const hash = url.hash.replace(/^#/, "");
  if (hash) {
    const segments = hash.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && isGmailUiId(last)) {
      return last;
    }
  }

  // rare path forms: /mail/u/0/th/<id>
  const pathMatch = url.pathname.match(/\/(?:th|msg)\/([^/]+)/i);
  if (pathMatch?.[1] && isGmailUiId(pathMatch[1])) {
    return pathMatch[1];
  }

  return null;
}

function isGmailUiId(value: string): boolean {
  // Web UI: FMfcgz... / classic hex message ids / thread-f:...
  if (/^FMfcgz[A-Za-z0-9]+$/i.test(value)) return true;
  if (/^[0-9a-f]{10,}$/i.test(value)) return true;
  if (/^thread-f:\d+$/i.test(value)) return true;
  if (/^[A-Za-z0-9_-]{10,}$/.test(value)) return true;
  return false;
}

/** 新しいGmail Webの同期ID。Gmail API の message/thread ID には使えない。 */
export function isGmailWebSyncId(id: string): boolean {
  return /^FMfcgz[A-Za-z0-9]+$/i.test(id.trim());
}
