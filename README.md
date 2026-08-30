# rag-eval-harness

[![CI](https://github.com/OsamaAnsar/rag-eval-harness/actions/workflows/ci.yml/badge.svg)](https://github.com/OsamaAnsar/rag-eval-harness/actions/workflows/ci.yml)
[![Live report](https://img.shields.io/badge/demo-live%20report-blue)](https://osamaansar.github.io/rag-eval-harness/)

**[Live report →](https://osamaansar.github.io/rag-eval-harness/)** — rendered from `data/sample-dataset.json`, regenerated on every push to `main`.

An LLM-judge evaluation harness for RAG pipelines, implemented in TypeScript. It scores a set of (question, retrieved contexts, generated answer) triples on four axes and produces a regression-gated report:

- **Faithfulness** — decomposes the answer into atomic claims and checks each against the retrieved contexts, catching hallucinations not grounded in the source material.
- **Answer Relevance** — rates how directly the answer addresses the question, independent of factual correctness.
- **Context Precision** — rewards retrieval pipelines that rank relevant passages higher, penalizing noisy retrieval.
- **Context Recall** — decomposes a ground-truth answer into claims and checks how many are attributable to the retrieved contexts, exposing retrieval gaps.

This follows the same claim-decomposition methodology as [RAGAS](https://github.com/explodinggradients/ragas), reimplemented from scratch in TypeScript with a pluggable judge interface.

## Why this exists

Most RAG demos stop at "it returns an answer." This harness answers the next question any production team asks: *is the pipeline actually getting better or worse as we change chunking, retrieval, or prompts?* It's designed to run in CI as a regression gate, the same way a test suite guards application code.

## Architecture

```
src/
  judge/         Judge interface + OpenAI implementation + a dependency-free FakeJudge for tests/CI dry-runs
  metrics/       Pure scoring functions, one per axis, each taking an EvalItem + Judge
  runner.ts      Fans metrics out over a dataset and aggregates averages
  report.ts      Renders results to Markdown
  cli.ts         Wires it together: load dataset -> judge -> evaluate -> write report -> exit non-zero on regression
```

The `Judge` interface decouples scoring logic from any specific LLM provider, so the metrics are unit-testable without API calls (see `test/`, all running against `FakeJudge`) and swappable for Anthropic/local models later.

## Usage

```bash
npm install
cp .env.example .env   # add OPENAI_API_KEY for real scoring

npm run eval                                    # scores data/sample-dataset.json with OpenAI
npm run eval:fake                                # heuristic scoring, no API key needed
npm run eval -- --dataset path/to/data.json --out reports --min-score 0.7
```

`--min-score` fails the process (exit code 1) if any averaged metric falls below the threshold — this is what CI uses as a regression gate.

`npm run render:docs` writes `docs/index.html`, a static report page served via GitHub Pages — that's what the live report link above points to.

## Dataset format

```json
[
  {
    "id": "q1",
    "question": "...",
    "contexts": ["...", "..."],
    "answer": "...",
    "groundTruth": "... (optional, required for context recall)"
  }
]
```

Point `--dataset` at the actual inputs/outputs of your RAG pipeline to evaluate it for real.

## Testing

```bash
npm test
```

All metric and runner tests run against `FakeJudge`, a deterministic token-overlap heuristic, so the suite is fast and requires no API key.
