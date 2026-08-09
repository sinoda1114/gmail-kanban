import { describe, it, expect } from "vitest";
import {
  buildReminderFingerprint,
  isReminderDismissed,
  validateReminderFingerprint,
  REMINDER_FINGERPRINT_MAX_LENGTH,
} from "../reminders";

describe("buildReminderFingerprint", () => {
  it("uses daysElapsed bucket for non-interview reminders", () => {
    expect(
      buildReminderFingerprint({
        projectStatus: "reply_required",
        reminderType: "reply",
        daysElapsed: 3,
      })
    ).toBe("reply_required|reply|3");
  });

  it("uses interview date bucket for interview reminders", () => {
    expect(
      buildReminderFingerprint({
        projectStatus: "interview_scheduled",
        reminderType: "interview",
        daysElapsed: 0,
        interviewDate: "2026-08-10",
      })
    ).toBe("interview_scheduled|interview|2026-08-10");
  });

  it("changes fingerprint when status or bucket changes", () => {
    const base = buildReminderFingerprint({
      projectStatus: "waiting_reply",
      reminderType: "follow_up",
      daysElapsed: 5,
    });
    const statusChanged = buildReminderFingerprint({
      projectStatus: "reply_required",
      reminderType: "follow_up",
      daysElapsed: 5,
    });
    const daysChanged = buildReminderFingerprint({
      projectStatus: "waiting_reply",
      reminderType: "follow_up",
      daysElapsed: 6,
    });
    expect(base).not.toBe(statusChanged);
    expect(base).not.toBe(daysChanged);
  });
});

describe("validateReminderFingerprint", () => {
  it("accepts a well-formed non-interview fingerprint", () => {
    expect(
      validateReminderFingerprint("reply_required|reply|3")
    ).toEqual({ valid: true, fingerprint: "reply_required|reply|3" });
  });

  it("accepts a well-formed interview fingerprint", () => {
    expect(
      validateReminderFingerprint("interview_scheduled|interview|2026-08-10")
    ).toEqual({
      valid: true,
      fingerprint: "interview_scheduled|interview|2026-08-10",
    });
  });

  it("rejects reminder type mismatch", () => {
    expect(
      validateReminderFingerprint("reply_required|reply|3", {
        expectedReminderType: "follow_up",
      })
    ).toEqual({ valid: false, error: "Invalid fingerprint" });
  });

  it("rejects empty, malformed, or overlong fingerprints", () => {
    expect(validateReminderFingerprint("")).toEqual({
      valid: false,
      error: "Invalid fingerprint",
    });
    expect(validateReminderFingerprint("   ")).toEqual({
      valid: false,
      error: "Invalid fingerprint",
    });
    expect(validateReminderFingerprint("reply_required|reply")).toEqual({
      valid: false,
      error: "Invalid fingerprint",
    });
    expect(
      validateReminderFingerprint("bad_status|reply|3")
    ).toEqual({ valid: false, error: "Invalid fingerprint" });
    expect(
      validateReminderFingerprint("reply_required|bad_type|3")
    ).toEqual({ valid: false, error: "Invalid fingerprint" });
    expect(
      validateReminderFingerprint("interview_scheduled|interview|not-a-date")
    ).toEqual({ valid: false, error: "Invalid fingerprint" });
    expect(
      validateReminderFingerprint(
        "x".repeat(REMINDER_FINGERPRINT_MAX_LENGTH + 1)
      )
    ).toEqual({ valid: false, error: "Invalid fingerprint" });
  });
});

describe("isReminderDismissed", () => {
  const item = {
    projectId: "p1",
    reminderType: "reply" as const,
    fingerprint: "reply_required|reply|3",
  };

  it("returns true when a matching done record exists", () => {
    expect(
      isReminderDismissed(item, [
        {
          projectId: "p1",
          reminderType: "reply",
          message: "reply_required|reply|3",
        },
      ])
    ).toBe(true);
  });

  it("returns false when fingerprint differs (reappearance)", () => {
    expect(
      isReminderDismissed(item, [
        {
          projectId: "p1",
          reminderType: "reply",
          message: "reply_required|reply|2",
        },
      ])
    ).toBe(false);
  });
});
