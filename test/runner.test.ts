import { describe, expect, it } from "vitest";
import { FakeJudge } from "../src/judge/FakeJudge.js";
import { evaluateDataset } from "../src/runner.js";
import type { EvalItem } from "../src/types.js";

describe("evaluateDataset", () => {
  it("aggregates per-item scores into averages", async () => {
    const judge = new FakeJudge();
    const items: EvalItem[] = [
      {
        id: "a",
        question: "What port does the server use?",
        contexts: ["The application server binds to port 3000 by default."],
        answer: "The server binds to port 3000 by default.",
        groundTruth: "The server binds to port 3000 by default.",
      },
      {
        id: "b",
        question: "What database is used?",
        contexts: ["User sessions are stored in Redis."],
        answer: "The project uses Snowflake for analytics.",
      },
    ];

    const result = await evaluateDataset(items, judge);

    expect(result.itemCount).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.averages.faithfulness).toBeGreaterThanOrEqual(0);
    expect(result.averages.faithfulness).toBeLessThanOrEqual(1);
    expect(Number.isNaN(result.averages.contextRecall)).toBe(false);
  });
});
