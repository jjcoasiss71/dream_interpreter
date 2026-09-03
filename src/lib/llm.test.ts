import { describe, it, expect } from "vitest";
import { describeFailure } from "./llm";

const modelNotFound = JSON.stringify({
  error: { message: "The model does not exist", code: "model_not_found" },
});

describe("describeFailure", () => {
  it("calls only a rate limit busy", () => {
    const err = describeFailure(429, JSON.stringify({ error: {} }));
    expect(err.message).toMatch(/busy/i);
    expect(err.status).toBe(429);
  });

  it("names a retired model instead of blaming load", () => {
    const err = describeFailure(404, modelNotFound);
    expect(err.message).not.toMatch(/busy/i);
    expect(err.message).toMatch(/no longer available/);
    expect(err.message).toContain("model_not_found");
    expect(err.status).toBe(500);
  });

  it("reports a refused key as a server misconfiguration", () => {
    const err = describeFailure(401, JSON.stringify({ error: {} }));
    expect(err.message).toMatch(/GROQ_API_KEY/);
    expect(err.status).toBe(500);
  });

  it("treats a provider outage as a bad gateway", () => {
    expect(describeFailure(503, "").status).toBe(502);
  });

  it("surfaces the provider status even when the body is not JSON", () => {
    expect(describeFailure(400, "<html>gateway</html>").message).toContain(
      "(Groq 400)"
    );
  });
});
