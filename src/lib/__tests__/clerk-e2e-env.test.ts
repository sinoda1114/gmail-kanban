import { describe, expect, it } from "vitest";
import { assertClerkE2eEnv } from "@/lib/clerk-e2e-env";

const valid = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
  CLERK_SECRET_KEY: "sk_test_example",
};

describe("assertClerkE2eEnv", () => {
  it("accepts Development test keys", () => {
    expect(() => assertClerkE2eEnv(valid)).not.toThrow();
  });

  it("accepts CLERK_PUBLISHABLE_KEY as the publishable fallback", () => {
    expect(() =>
      assertClerkE2eEnv({
        CLERK_PUBLISHABLE_KEY: "pk_test_example",
        CLERK_SECRET_KEY: "sk_test_example",
      })
    ).not.toThrow();
  });

  it("rejects missing keys", () => {
    expect(() => assertClerkE2eEnv({})).toThrow(/pk_test_/);
    expect(() =>
      assertClerkE2eEnv({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example" })
    ).toThrow(/sk_test_/);
  });

  it("rejects live keys", () => {
    expect(() =>
      assertClerkE2eEnv({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example",
        CLERK_SECRET_KEY: "sk_test_example",
      })
    ).toThrow(/pk_live_/);
    expect(() =>
      assertClerkE2eEnv({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        CLERK_SECRET_KEY: "sk_live_example",
      })
    ).toThrow(/sk_live_/);
  });
});
