// The API contract: what the routes accept and reject.
import { describe, it, expect } from "vitest";
import { interpretRequestSchema, journalReadRequestSchema } from "./api";

describe("interpretRequestSchema", () => {
  it("accepts a plain dream", () => {
    expect(
      interpretRequestSchema.safeParse({ dream: "I was flying over water" })
        .success
    ).toBe(true);
  });

  it("accepts a dream with history context", () => {
    const parsed = interpretRequestSchema.safeParse({
      dream: "I was flying",
      history: {
        recurringSymbols: [{ label: "Water", count: 3 }],
        recentDreams: [{ dreamText: "the sea again", createdAt: 1 }],
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a too-short dream with the friendly message", () => {
    const parsed = interpretRequestSchema.safeParse({ dream: "ab" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toMatch(/little more detail/);
    }
  });

  it("rejects a missing dream and absurdly long input", () => {
    expect(interpretRequestSchema.safeParse({}).success).toBe(false);
    expect(
      interpretRequestSchema.safeParse({ dream: "x".repeat(8001) }).success
    ).toBe(false);
  });
});

describe("journalReadRequestSchema", () => {
  it("accepts a list of dreams", () => {
    expect(
      journalReadRequestSchema.safeParse({
        dreams: [{ dreamText: "one" }, { dreamText: "two" }],
      }).success
    ).toBe(true);
  });

  it("rejects an empty or missing list", () => {
    expect(journalReadRequestSchema.safeParse({ dreams: [] }).success).toBe(
      false
    );
    expect(journalReadRequestSchema.safeParse({}).success).toBe(false);
  });
});
