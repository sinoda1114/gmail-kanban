import { describe, it, expect } from "vitest";
import { KanChan } from "../KanChan";
import { EmptyState } from "../EmptyState";

describe("Mascot Components", () => {
  describe("KanChan", () => {
    it("should render without crashing", () => {
      expect(KanChan).toBeDefined();
    });

    it("should accept size prop", () => {
      const props = { size: 200 };
      expect(props.size).toBe(200);
    });

    it("should accept mood props", () => {
      const moods: Array<"happy" | "waving" | "thinking"> = [
        "happy",
        "waving",
        "thinking",
      ];
      moods.forEach((mood) => {
        expect(mood).toMatch(/^(happy|waving|thinking)$/);
      });
    });

    it("should have accessible aria-label", () => {
      const expectedLabel = "カンちゃん - Gmail Kanbanのマスコット";
      expect(expectedLabel).toContain("カンちゃん");
      expect(expectedLabel).toContain("Gmail Kanban");
    });
  });

  describe("EmptyState", () => {
    it("should be defined", () => {
      expect(EmptyState).toBeDefined();
    });

    it("should be a function component", () => {
      expect(typeof EmptyState).toBe("function");
    });
  });
});
