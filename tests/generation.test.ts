import { afterEach, describe, expect, it, vi } from "vitest";
import { generateRoast, type GenerationTelemetry } from "@/lib/openai";
import { summary } from "./fixtures/roast-summary";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("openai")>();
  return { ...actual, default: class {
    static APIError = actual.default.APIError;
    responses = { create };
  } };
});

afterEach(() => { vi.unstubAllEnvs(); create.mockReset(); });

const response = (value: unknown) => ({ output_text: JSON.stringify(value), status: "completed", usage: { input_tokens: 120, output_tokens: 80 } });

describe("roast generation", () => {
  it("reports missing credentials without logging source material", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const events: GenerationTelemetry[] = [];
    const result = await generateRoast(summary("private-log-test", "alpha-console"), { onTelemetry: (event) => events.push(event) });
    expect(result.generatedWith).toBe("fallback");
    expect(events[0].reason).toBe("missing-key");
    expect(JSON.stringify(events)).not.toMatch(/private-log-test|alpha-console/);
    expect(create).not.toHaveBeenCalled();
  });

  it("limits model input, omits verbosity, and repairs only rejected text", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const input = summary("editor", "alpha-console");
    const score = "61/100. The merge button is negotiating terms.";
    const repaired = "Your alpha-console has 72 stars. Even the review committee has a waiting list.";
    create.mockResolvedValueOnce(response({ developerType: "The Release Committee", archetypeDescription: "alpha-console has TypeScript taking minutes at every meeting.", scoreRoast: score, roast: "You are an idiot." }));
    create.mockResolvedValueOnce(response({ replacements: [{ path: "roast", text: repaired }, { path: "scoreRoast", text: "100/100" }] }));
    const events: GenerationTelemetry[] = [];
    const result = await generateRoast(input, { onTelemetry: (event) => events.push(event) });
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0].text).not.toHaveProperty("verbosity");
    expect(JSON.parse(create.mock.calls[0][0].input).repositories.length).toBeLessThanOrEqual(6);
    expect(create.mock.calls[1][0].max_output_tokens).toBe(800);
    expect(result.report.roast).toBe(repaired);
    expect(result.report.scoreRoast).toBe(score);
    expect(result.report.roastScore).toBe(input.profileScore);
    expect(events[0]).toMatchObject({ repairAttempted: true, reason: "repaired", inputTokens: 240, outputTokens: 160 });
  });

  it("preserves accepted lines when the optional repair fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const roast = "alpha-console has 72 stars. The review committee needs a bigger room.";
    create.mockResolvedValueOnce(response({ roast })).mockRejectedValueOnce(new Error("timeout"));
    const events: GenerationTelemetry[] = [];
    const result = await generateRoast(summary("editor", "alpha-console"), { onTelemetry: (event) => events.push(event) });
    expect(result.report.roast).toBe(roast);
    expect(events[0].reason).toBe("repair-failed");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("distinguishes incomplete output, invalid shape, and provider failure", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    for (const scenario of ["incomplete-output", "invalid-shape", "provider-error"]) {
      if (scenario === "incomplete-output") create.mockResolvedValueOnce({ ...response({}), status: "incomplete" });
      else if (scenario === "invalid-shape") create.mockResolvedValueOnce(response(null));
      else create.mockRejectedValueOnce(new Error("do not log credentials or payloads"));
      const events: GenerationTelemetry[] = [];
      const result = await generateRoast(summary("editor", "alpha-console"), { onTelemetry: (event) => events.push(event) });
      expect(result.generatedWith).toBe("fallback");
      expect(events[0].reason).toBe(scenario);
      expect(JSON.stringify(events)).not.toContain("do not log");
    }
    expect(create).toHaveBeenCalledTimes(3);
  });
});
