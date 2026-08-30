import { describe, expect, it } from "vitest";
import { FakeJudge } from "../src/judge/FakeJudge.js";
import { scoreFaithfulness } from "../src/metrics/faithfulness.js";
import type { EvalItem } from "../src/types.js";

describe("scoreFaithfulness", () => {
  const judge = new FakeJudge();

  it("scores 1 when the answer has no factual claims", async () => {
    const item: EvalItem = { id: "a", question: "q", contexts: [], answer: "", groundTruth: undefined };
    const result = await scoreFaithfulness(item, judge);
    expect(result.score).toBe(1);
  });

  it("scores high when the answer is grounded in context", async () => {
    const item: EvalItem = {
      id: "b",
      question: "What port does the server use?",
      contexts: ["The application server binds to port 3000 by default."],
      answer: "The server binds to port 3000 by default.",
    };
    const result = await scoreFaithfulness(item, judge);
    expect(result.score).toBeGreaterThan(0.5);
  });

  it("scores low when the answer introduces unsupported claims", async () => {
    const item: EvalItem = {
      id: "c",
      question: "What database is used?",
      contexts: ["User sessions are stored in Redis with a 24 hour TTL."],
      answer: "The project uses Pinecone for vector storage and Snowflake for analytics.",
    };
    const result = await scoreFaithfulness(item, judge);
    expect(result.score).toBeLessThan(0.5);
  });
});
