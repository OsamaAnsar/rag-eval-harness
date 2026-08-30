import type { AggregateEvalResult, ItemEvalResult } from "./types.js";

function pct(score: number): string {
  return Number.isFinite(score) ? `${(score * 100).toFixed(1)}%` : "n/a";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreClass(score: number): string {
  if (!Number.isFinite(score)) return "na";
  if (score >= 0.7) return "good";
  if (score >= 0.4) return "warn";
  return "bad";
}

function metricCard(label: string, score: number): string {
  return `<div class="card ${scoreClass(score)}"><span class="card-label">${label}</span><span class="card-score">${pct(score)}</span></div>`;
}

function itemRow(item: ItemEvalResult): string {
  const cells = [
    item.metrics.faithfulness.score,
    item.metrics.answerRelevance.score,
    item.metrics.contextPrecision.score,
    item.metrics.contextRecall.score,
  ]
    .map((score) => `<td class="${scoreClass(score)}">${pct(score)}</td>`)
    .join("");
  return `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.question)}</td>${cells}</tr>`;
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

export function toHtml(
  result: AggregateEvalResult,
  generatedAt: Date = new Date(),
  judgeLabel = "openai",
): string {
  const cards = [
    metricCard("Faithfulness", result.averages.faithfulness),
    metricCard("Answer Relevance", result.averages.answerRelevance),
    metricCard("Context Precision", result.averages.contextPrecision),
    metricCard("Context Recall", result.averages.contextRecall),
  ].join("");

  const rows = result.items.map(itemRow).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>rag-eval-harness report</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #0b0f14;
    --panel: #121822;
    --border: #232c39;
    --text: #e6edf3;
    --muted: #8b98a5;
    --good: #3fb950;
    --warn: #d29922;
    --bad: #f85149;
    --na: #6e7681;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #f6f8fa;
      --panel: #ffffff;
      --border: #d0d7de;
      --text: #1f2328;
      --muted: #59636e;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, "Segoe UI", Inter, Roboto, sans-serif;
    padding: 2.5rem 1.5rem;
  }
  main { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .subtitle { color: var(--muted); margin-top: 0; margin-bottom: 2rem; font-size: 0.9rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .card-label { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
  .card-score { font-size: 1.75rem; font-weight: 600; }
  .card.good .card-score { color: var(--good); }
  .card.warn .card-score { color: var(--warn); }
  .card.bad .card-score { color: var(--bad); }
  .card.na .card-score { color: var(--na); }
  table { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  th { color: var(--muted); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
  tr:last-child td { border-bottom: none; }
  td.good { color: var(--good); }
  td.warn { color: var(--warn); }
  td.bad { color: var(--bad); }
  td.na { color: var(--na); }
  footer { color: var(--muted); font-size: 0.8rem; margin-top: 2rem; }
  a { color: inherit; }
</style>
</head>
<body>
<main>
  <h1>rag-eval-harness</h1>
  <p class="subtitle">LLM-judge evaluation report &middot; ${result.itemCount} items &middot; judge: ${judgeLabel === "fake" ? "FakeJudge (deterministic heuristic, zero-cost demo)" : "OpenAIJudge"} &middot; generated ${generatedAt.toISOString()}</p>
  <div class="cards">${cards}</div>
  <table>
    <thead>
      <tr><th>ID</th><th>Question</th><th>Faithfulness</th><th>Relevance</th><th>Precision</th><th>Recall</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <footer><a href="https://github.com/OsamaAnsar/rag-eval-harness">github.com/OsamaAnsar/rag-eval-harness</a></footer>
</main>
</body>
</html>
`;
}
