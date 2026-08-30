import type { AggregateEvalResult } from "./types.js";

function pct(score: number): string {
  return Number.isFinite(score) ? `${(score * 100).toFixed(1)}%` : "n/a";
}

export function toMarkdown(result: AggregateEvalResult): string {
  const lines: string[] = [];
  lines.push(`# RAG Evaluation Report`);
  lines.push("");
  lines.push(`Items evaluated: ${result.itemCount}`);
  lines.push("");
  lines.push("| Metric | Average |");
  lines.push("| --- | --- |");
  lines.push(`| Faithfulness | ${pct(result.averages.faithfulness)} |`);
  lines.push(`| Answer Relevance | ${pct(result.averages.answerRelevance)} |`);
  lines.push(`| Context Precision | ${pct(result.averages.contextPrecision)} |`);
  lines.push(`| Context Recall | ${pct(result.averages.contextRecall)} |`);
  lines.push("");
  lines.push("## Per-item scores");
  lines.push("");
  lines.push("| ID | Question | Faithfulness | Relevance | Precision | Recall |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const item of result.items) {
    lines.push(
      `| ${item.id} | ${item.question.replace(/\|/g, "\\|")} | ${pct(item.metrics.faithfulness.score)} | ${pct(
        item.metrics.answerRelevance.score,
      )} | ${pct(item.metrics.contextPrecision.score)} | ${pct(item.metrics.contextRecall.score)} |`,
    );
  }
  return lines.join("\n");
}
