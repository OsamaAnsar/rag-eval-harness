import OpenAI from "openai";
import { z } from "zod";
import type { Judge } from "./Judge.js";

const claimsSchema = z.object({ claims: z.array(z.string()) });
const verdictSchema = z.object({ verdict: z.boolean() });
const relevanceSchema = z.object({ score: z.number().min(0).max(1) });

function parseJson<T>(schema: z.ZodType<T>, raw: string): T {
  const cleaned = raw.trim().replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "");
  return schema.parse(JSON.parse(cleaned));
}

export class OpenAIJudge implements Judge {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  private async complete(system: string, user: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return response.choices[0]?.message?.content ?? "{}";
  }

  async extractClaims(text: string): Promise<string[]> {
    const raw = await this.complete(
      'Decompose the input text into a list of atomic, independently verifiable factual claims. Respond as JSON: {"claims": string[]}. If there are no factual claims, return an empty array.',
      text,
    );
    return parseJson(claimsSchema, raw).claims;
  }

  async isClaimSupported(claim: string, context: string): Promise<boolean> {
    const raw = await this.complete(
      'Given a CLAIM and a CONTEXT passage, determine whether the context supports the claim. Respond as JSON: {"verdict": boolean}.',
      `CLAIM: ${claim}\n\nCONTEXT: ${context}`,
    );
    return parseJson(verdictSchema, raw).verdict;
  }

  async isClaimAttributable(claim: string, contexts: string[]): Promise<boolean> {
    const raw = await this.complete(
      'Given a CLAIM and a list of CONTEXT passages, determine whether the claim can be attributed to (inferred from) any of the passages. Respond as JSON: {"verdict": boolean}.',
      `CLAIM: ${claim}\n\nCONTEXTS:\n${contexts.map((c, i) => `[${i}] ${c}`).join("\n")}`,
    );
    return parseJson(verdictSchema, raw).verdict;
  }

  async isContextRelevant(question: string, context: string): Promise<boolean> {
    const raw = await this.complete(
      'Given a QUESTION and a CONTEXT passage, determine whether the passage is relevant to answering the question. Respond as JSON: {"verdict": boolean}.',
      `QUESTION: ${question}\n\nCONTEXT: ${context}`,
    );
    return parseJson(verdictSchema, raw).verdict;
  }

  async rateAnswerRelevance(question: string, answer: string): Promise<number> {
    const raw = await this.complete(
      'Given a QUESTION and an ANSWER, rate from 0 to 1 how directly and completely the answer addresses the question, ignoring factual correctness. Respond as JSON: {"score": number}.',
      `QUESTION: ${question}\n\nANSWER: ${answer}`,
    );
    return parseJson(relevanceSchema, raw).score;
  }
}
