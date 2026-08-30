export interface EvalItem {
  id: string;
  question: string;
  contexts: string[];
  answer: string;
  groundTruth?: string;
}

export interface ClaimVerdict {
  claim: string;
  supported: boolean;
}

export interface AttributionVerdict {
  claim: string;
  attributable: boolean;
}

export interface MetricResult {
  score: number;
  details: Record<string, unknown>;
}

export interface ItemEvalResult {
  id: string;
  question: string;
  metrics: {
    faithfulness: MetricResult;
    answerRelevance: MetricResult;
    contextPrecision: MetricResult;
    contextRecall: MetricResult;
  };
}

export interface AggregateEvalResult {
  itemCount: number;
  items: ItemEvalResult[];
  averages: {
    faithfulness: number;
    answerRelevance: number;
    contextPrecision: number;
    contextRecall: number;
  };
}
