import type { Judge } from "../judge/Judge.js";
import type { AttributionVerdict, EvalItem, MetricResult } from "../types.js";

export async function scoreContextRecall(item: EvalItem, judge: Judge): Promise<MetricResult> {
  if (!item.groundTruth) {
    return { score: Number.NaN, details: { skipped: true } };
  }

  const claims = await judge.extractClaims(item.groundTruth);
  if (claims.length === 0) {
    return { score: 1, details: { verdicts: [] } };
  }

  const verdicts: AttributionVerdict[] = await Promise.all(
    claims.map(async (claim) => ({
      claim,
      attributable: await judge.isClaimAttributable(claim, item.contexts),
    })),
  );

  const attributableCount = verdicts.filter((v) => v.attributable).length;
  return { score: attributableCount / claims.length, details: { verdicts } };
}
