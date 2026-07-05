import { describe, it, expect } from "vitest";
import { toLines } from "./text";

describe("toLines", () => {
  it("splits sentences so each can fade in on its own beat", () => {
    expect(toLines("One. Two! Three?")).toEqual(["One.", "Two!", "Three?"]);
  });

  it("honors paragraph breaks", () => {
    expect(toLines("First para.\n\nSecond para.")).toEqual([
      "First para.",
      "Second para.",
    ]);
  });

  it("keeps text without terminal punctuation", () => {
    expect(toLines("a quiet ending")).toEqual(["a quiet ending"]);
  });

  it("drops empty fragments", () => {
    expect(toLines("  \n\n  ")).toEqual([]);
  });
});
