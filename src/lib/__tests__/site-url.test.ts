import { describe, expect, it } from "vitest";
import { parseSiteUrl } from "@/lib/site-url";

describe("parseSiteUrl", () => {
  it("returns URL for a valid absolute URL", () => {
    const url = parseSiteUrl("https://gmail-kanban.vercel.app");
    expect(url?.href).toBe("https://gmail-kanban.vercel.app/");
  });

  it("returns undefined for missing or blank values", () => {
    expect(parseSiteUrl(undefined)).toBeUndefined();
    expect(parseSiteUrl("")).toBeUndefined();
    expect(parseSiteUrl("   ")).toBeUndefined();
  });

  it("returns undefined for invalid URL strings", () => {
    expect(parseSiteUrl("not-a-url")).toBeUndefined();
    expect(parseSiteUrl("://broken")).toBeUndefined();
  });
});
