import type { Judge } from "../judge/Judge.js";
import type { EvalItem, MetricResult } from "../types.js";

export async function scoreAnswerRelevance(item: EvalItem, judge: Judge): Promise<MetricResult> {
  const score = await judge.rateAnswerRelevance(item.question, item.answer);
  return { score, details: {} };
}
