import { describe, expect, it } from "vitest";
import { parseGmailUrlId } from "../gmail-url";
import {
  extractTextFromGmailMessage,
  formatFetchedMail,
} from "../gmail-message";

describe("parseGmailUrlId", () => {
  it("parses starred FMfcgz URL", () => {
    const id = parseGmailUrlId(
      "https://mail.google.com/mail/u/0/#starred/FMfcgzQhVNQgLwpqNCTfGCjmQgqBCMxB"
    );
    expect(id).toBe("FMfcgzQhVNQgLwpqNCTfGCjmQgqBCMxB");
  });

  it("parses inbox hex id", () => {
    const id = parseGmailUrlId(
      "https://mail.google.com/mail/u/0/#inbox/18c2f3a1b2d4e5f6"
    );
    expect(id).toBe("18c2f3a1b2d4e5f6");
  });

  it("parses label URL", () => {
    const id = parseGmailUrlId(
      "https://mail.google.com/mail/u/0/#label/agent/FMfcgzQhVNQgLwpqNCTfGCjmQgqBCMxB"
    );
    expect(id).toBe("FMfcgzQhVNQgLwpqNCTfGCjmQgqBCMxB");
  });

  it("rejects non-gmail hosts", () => {
    expect(parseGmailUrlId("https://example.com/#inbox/abc")).toBeNull();
  });

  it("rejects empty", () => {
    expect(parseGmailUrlId("")).toBeNull();
  });
});

describe("extractTextFromGmailMessage", () => {
  it("prefers text/plain part", () => {
    const plain = Buffer.from("hello plain", "utf8").toString("base64url");
    const html = Buffer.from("<b>hello html</b>", "utf8").toString("base64url");
    const extracted = extractTextFromGmailMessage({
      payload: {
        headers: [
          { name: "Subject", value: "案件紹介" },
          { name: "From", value: "a@example.com" },
        ],
        parts: [
          { mimeType: "text/plain", body: { data: plain } },
          { mimeType: "text/html", body: { data: html } },
        ],
      },
    });
    expect(extracted.subject).toBe("案件紹介");
    expect(extracted.from).toBe("a@example.com");
    expect(extracted.body).toBe("hello plain");
    expect(formatFetchedMail(extracted)).toContain("件名: 案件紹介");
  });
});
