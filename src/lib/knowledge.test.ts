import { describe, it, expect } from "vitest";
import { matchSymbols, getFramework, frameworkSummaries } from "./knowledge";

describe("matchSymbols", () => {
  it("matches a symbol by its label", () => {
    const matched = matchSymbols("There was water everywhere");
    expect(matched.map((s) => s.id)).toContain("water");
  });

  it("matches a symbol through an alias", () => {
    const matched = matchSymbols("I was drowning in the ocean");
    expect(matched.map((s) => s.id)).toContain("water");
  });

  it("is case-insensitive", () => {
    const matched = matchSymbols("A SNAKE appeared");
    expect(matched.map((s) => s.id)).toContain("snake");
  });

  it("matches multiple symbols in one dream", () => {
    const matched = matchSymbols(
      "I was falling from a house while being chased"
    );
    const ids = matched.map((s) => s.id);
    expect(ids).toContain("falling");
    expect(ids).toContain("house");
    expect(ids).toContain("being-chased");
  });

  it("returns nothing for a dream with no catalogued symbols", () => {
    expect(matchSymbols("a completely unremarkable afternoon")).toHaveLength(0);
  });

  it("matches whole words only — no substring false positives", () => {
    // "cat" must not fire inside "vacation", "key" not inside "monkey",
    // "war" not inside "toward"/"warm", "sun" not inside "Sunday"
    expect(
      matchSymbols("on vacation a monkey walked toward the warm Sunday market")
    ).toHaveLength(0);
  });

  it("tolerates plurals and simple past forms", () => {
    expect(
      matchSymbols("two snakes and three spiders").map((s) => s.id)
    ).toEqual(expect.arrayContaining(["snake", "spider"]));
    expect(matchSymbols("a stranger embraced me").map((s) => s.id)).toContain(
      "stranger"
    );
  });

  it("keeps short words strict (war does not swallow ward)", () => {
    expect(matchSymbols("I walked through the hospital ward")).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "war" })])
    );
    expect(matchSymbols("a terrible war broke out").map((s) => s.id)).toContain(
      "war"
    );
  });

  it("every matched symbol carries sourced perspectives", () => {
    for (const s of matchSymbols("water snake teeth")) {
      expect(s.perspectives.length).toBeGreaterThan(0);
      for (const p of s.perspectives) {
        expect(p.meaning).toBeTruthy();
        expect(p.source).toBeTruthy();
        // every perspective points at a real framework
        expect(getFramework(p.framework)).toBeDefined();
      }
    }
  });
});

describe("frameworkSummaries", () => {
  it("lists every framework with its core idea", () => {
    const text = frameworkSummaries();
    expect(text).toContain("Jungian");
    expect(text.split("\n").length).toBeGreaterThanOrEqual(4);
  });
});
