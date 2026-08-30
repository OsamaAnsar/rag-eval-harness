import { describe, expect, it } from "vitest";
import { FakeJudge } from "../src/judge/FakeJudge.js";
import { scoreContextPrecision } from "../src/metrics/contextPrecision.js";
import type { EvalItem } from "../src/types.js";

describe("scoreContextPrecision", () => {
  const judge = new FakeJudge();

  it("scores 0 when there are no contexts", async () => {
    const item: EvalItem = { id: "a", question: "q", contexts: [], answer: "" };
    const result = await scoreContextPrecision(item, judge);
    expect(result.score).toBe(0);
  });

  it("rewards relevant contexts ranked earlier", async () => {
    const relevantFirst: EvalItem = {
      id: "b",
      question: "What port does the server use?",
      contexts: [
        "The application server binds to port 3000 by default.",
        "Unrelated passage about deployment pipelines and CI runners.",
      ],
      answer: "",
    };
    const relevantLast: EvalItem = {
      id: "c",
      question: "What port does the server use?",
      contexts: [
        "Unrelated passage about deployment pipelines and CI runners.",
        "The application server binds to port 3000 by default.",
      ],
      answer: "",
    };

    const first = await scoreContextPrecision(relevantFirst, judge);
    const last = await scoreContextPrecision(relevantLast, judge);
    expect(first.score).toBeGreaterThan(last.score);
  });
});
