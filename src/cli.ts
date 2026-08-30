import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { FakeJudge } from "./judge/FakeJudge.js";
import type { Judge } from "./judge/Judge.js";
import { OpenAIJudge } from "./judge/OpenAIJudge.js";
import { toMarkdown } from "./report.js";
import { evaluateDataset } from "./runner.js";
import type { EvalItem } from "./types.js";

const datasetSchema = z.array(
  z.object({
    id: z.string(),
    question: z.string(),
    contexts: z.array(z.string()),
    answer: z.string(),
    groundTruth: z.string().optional(),
  }),
);

interface CliArgs {
  dataset: string;
  out: string;
  judge: "openai" | "fake";
  minScore?: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dataset: "data/sample-dataset.json",
    out: "reports",
    judge: process.env.OPENAI_API_KEY ? "openai" : "fake",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--dataset" && value) {
      args.dataset = value;
      i += 1;
    } else if (flag === "--out" && value) {
      args.out = value;
      i += 1;
    } else if (flag === "--judge" && (value === "openai" || value === "fake")) {
      args.judge = value;
      i += 1;
    } else if (flag === "--min-score" && value) {
      args.minScore = Number(value);
      i += 1;
    }
  }

  return args;
}

function buildJudge(kind: "openai" | "fake"): Judge {
  if (kind === "fake") {
    console.warn("Using FakeJudge (heuristic, no API calls) — set OPENAI_API_KEY for real scoring.");
    return new FakeJudge();
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Use --judge fake for a dry run without API calls.");
  }
  return new OpenAIJudge(apiKey, process.env.OPENAI_MODEL);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const raw = await readFile(args.dataset, "utf-8");
  const items: EvalItem[] = datasetSchema.parse(JSON.parse(raw));

  const judge = buildJudge(args.judge);
  const result = await evaluateDataset(items, judge);

  await mkdir(args.out, { recursive: true });
  await writeFile(path.join(args.out, "report.json"), JSON.stringify(result, null, 2));
  await writeFile(path.join(args.out, "report.md"), toMarkdown(result));

  console.log(toMarkdown(result));

  if (args.minScore !== undefined) {
    const failing = Object.entries(result.averages).filter(
      ([, score]) => Number.isFinite(score) && score < (args.minScore as number),
    );
    if (failing.length > 0) {
      console.error(
        `Regression: ${failing.map(([name, score]) => `${name}=${(score * 100).toFixed(1)}%`).join(", ")} below threshold ${((args.minScore as number) * 100).toFixed(0)}%`,
      );
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
