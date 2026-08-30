import type { Judge } from "./Judge.js";

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

function overlapRatio(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0) return 0;
  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared += 1;
  }
  return shared / tokensA.size;
}

export class FakeJudge implements Judge {
  async extractClaims(text: string): Promise<string[]> {
    return text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }

  async isClaimSupported(claim: string, context: string): Promise<boolean> {
    return overlapRatio(claim, context) >= 0.4;
  }

  async isClaimAttributable(claim: string, contexts: string[]): Promise<boolean> {
    return contexts.some((context) => overlapRatio(claim, context) >= 0.4);
  }

  async isContextRelevant(question: string, context: string): Promise<boolean> {
    return overlapRatio(question, context) >= 0.25;
  }

  async rateAnswerRelevance(question: string, answer: string): Promise<number> {
    return Math.min(1, overlapRatio(question, answer) * 2);
  }
}
