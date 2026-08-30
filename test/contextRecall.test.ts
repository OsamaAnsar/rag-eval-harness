import { describe, expect, it } from "vitest";
import { FakeJudge } from "../src/judge/FakeJudge.js";
import { scoreContextRecall } from "../src/metrics/contextRecall.js";
import type { EvalItem } from "../src/types.js";

describe("scoreContextRecall", () => {
  const judge = new FakeJudge();

  it("returns NaN when there is no ground truth", async () => {
    const item: EvalItem = { id: "a", question: "q", contexts: [], answer: "" };
    const result = await scoreContextRecall(item, judge);
    expect(Number.isNaN(result.score)).toBe(true);
  });

  it("scores high when contexts cover the ground truth", async () => {
    const item: EvalItem = {
      id: "b",
      question: "q",
      contexts: ["The application server binds to port 3000 by default."],
      answer: "",
      groundTruth: "The server binds to port 3000 by default.",
    };
    const result = await scoreContextRecall(item, judge);
    expect(result.score).toBeGreaterThan(0.5);
  });

  it("scores low when ground truth is not covered by contexts", async () => {
    const item: EvalItem = {
      id: "c",
      question: "q",
      contexts: ["Unrelated passage about deployment pipelines."],
      answer: "",
      groundTruth: "The server binds to port 3000 by default.",
    };
    const result = await scoreContextRecall(item, judge);
    expect(result.score).toBeLessThan(0.5);
  });
});
