import type { Judge } from "./judge/Judge.js";
import {
  scoreAnswerRelevance,
  scoreContextPrecision,
  scoreContextRecall,
  scoreFaithfulness,
} from "./metrics/index.js";
import type { AggregateEvalResult, EvalItem, ItemEvalResult } from "./types.js";

function average(values: number[]): number {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((sum, v) => sum + v, 0) / finite.length;
}

export async function evaluateItem(item: EvalItem, judge: Judge): Promise<ItemEvalResult> {
  const [faithfulness, answerRelevance, contextPrecision, contextRecall] = await Promise.all([
    scoreFaithfulness(item, judge),
    scoreAnswerRelevance(item, judge),
    scoreContextPrecision(item, judge),
    scoreContextRecall(item, judge),
  ]);

  return {
    id: item.id,
    question: item.question,
    metrics: { faithfulness, answerRelevance, contextPrecision, contextRecall },
  };
}

export async function evaluateDataset(items: EvalItem[], judge: Judge): Promise<AggregateEvalResult> {
  const results = await Promise.all(items.map((item) => evaluateItem(item, judge)));

  return {
    itemCount: results.length,
    items: results,
    averages: {
      faithfulness: average(results.map((r) => r.metrics.faithfulness.score)),
      answerRelevance: average(results.map((r) => r.metrics.answerRelevance.score)),
      contextPrecision: average(results.map((r) => r.metrics.contextPrecision.score)),
      contextRecall: average(results.map((r) => r.metrics.contextRecall.score)),
    },
  };
}
