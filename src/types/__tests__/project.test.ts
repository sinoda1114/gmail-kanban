import { describe, it, expect } from "vitest";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  CLOSE_REASONS,
  CLOSE_REASON_LABELS,
  REMINDER_TYPES,
} from "../project";

describe("project status definitions", () => {
  it("仕様書の8ステータスをすべて持つ", () => {
    expect(PROJECT_STATUSES).toHaveLength(8);
  });

  it("全ステータスにラベルが定義されている", () => {
    for (const status of PROJECT_STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("全ステータスに色が定義されている", () => {
    for (const status of PROJECT_STATUSES) {
      expect(STATUS_COLORS[status]).toBeTruthy();
    }
  });
});

describe("close reason definitions", () => {
  it("仕様書の終了理由5種をすべて持つ", () => {
    expect(CLOSE_REASONS).toHaveLength(5);
  });

  it("全終了理由にラベルが定義されている", () => {
    for (const reason of CLOSE_REASONS) {
      expect(CLOSE_REASON_LABELS[reason]).toBeTruthy();
    }
  });
});

describe("reminder type definitions", () => {
  it("仕様書のリマインド条件5種をすべて持つ", () => {
    expect(REMINDER_TYPES).toHaveLength(5);
    expect(REMINDER_TYPES).toContain("on_hold_recheck");
  });
});
