import { describe, expect, it } from "vitest";
import { isGmailWebSyncId, parseGmailInput, parseGmailUrlId } from "../gmail-url";
import {
  extractTextFromGmailMessage,
  formatFetchedMail,
  formatGmailThreadText,
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

  it("detects web sync ids", () => {
    expect(isGmailWebSyncId("FMfcgzQhVNQgLwpqNCTfGCjmQgqBCMxB")).toBe(true);
    expect(isGmailWebSyncId("18c2f3a1b2d4e5f6")).toBe(false);
  });
});

describe("parseGmailInput", () => {
  it("accepts raw thread id", () => {
    expect(parseGmailInput("18c2f3a1b2d4e5f6")).toEqual({
      id: "18c2f3a1b2d4e5f6",
    });
  });

  it("accepts gmail url", () => {
    const result = parseGmailInput(
      "https://mail.google.com/mail/u/0/#inbox/18c2f3a1b2d4e5f6"
    );
    expect(result?.id).toBe("18c2f3a1b2d4e5f6");
    expect(result?.gmailUrl).toContain("mail.google.com");
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

describe("formatGmailThreadText", () => {
  it("formats multiple messages in order", () => {
    const plain1 = Buffer.from("first", "utf8").toString("base64url");
    const plain2 = Buffer.from("second", "utf8").toString("base64url");
    const text = formatGmailThreadText([
      {
        internalDate: "2000",
        payload: {
          headers: [{ name: "Subject", value: "Re: test" }],
          parts: [{ mimeType: "text/plain", body: { data: plain2 } }],
        },
      },
      {
        internalDate: "1000",
        payload: {
          headers: [{ name: "Subject", value: "test" }],
          parts: [{ mimeType: "text/plain", body: { data: plain1 } }],
        },
      },
    ]);
    expect(text).toContain("メール 1/2");
    expect(text).toContain("first");
    expect(text.indexOf("first")).toBeLessThan(text.indexOf("second"));
  });
});
