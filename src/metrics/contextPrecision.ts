import type { Judge } from "../judge/Judge.js";
import type { EvalItem, MetricResult } from "../types.js";

export async function scoreContextPrecision(item: EvalItem, judge: Judge): Promise<MetricResult> {
  if (item.contexts.length === 0) {
    return { score: 0, details: { relevance: [] } };
  }

  const relevance = await Promise.all(
    item.contexts.map((context) => judge.isContextRelevant(item.question, context)),
  );

  let weightedSum = 0;
  let relevantCount = 0;
  relevance.forEach((isRelevant, index) => {
    if (isRelevant) {
      relevantCount += 1;
      weightedSum += relevantCount / (index + 1);
    }
  });

  const score = relevantCount === 0 ? 0 : weightedSum / relevantCount;
  return { score, details: { relevance } };
}
