import type { Judge } from "../judge/Judge.js";
import type { ClaimVerdict, EvalItem, MetricResult } from "../types.js";

export async function scoreFaithfulness(item: EvalItem, judge: Judge): Promise<MetricResult> {
  const claims = await judge.extractClaims(item.answer);
  if (claims.length === 0) {
    return { score: 1, details: { verdicts: [] } };
  }

  const verdicts: ClaimVerdict[] = await Promise.all(
    claims.map(async (claim) => {
      const supportedByAny = await Promise.all(
        item.contexts.map((context) => judge.isClaimSupported(claim, context)),
      );
      return { claim, supported: supportedByAny.some(Boolean) };
    }),
  );

  const supportedCount = verdicts.filter((v) => v.supported).length;
  return { score: supportedCount / claims.length, details: { verdicts } };
}
