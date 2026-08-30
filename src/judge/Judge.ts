export interface Judge {
  extractClaims(text: string): Promise<string[]>;
  isClaimSupported(claim: string, context: string): Promise<boolean>;
  isClaimAttributable(claim: string, contexts: string[]): Promise<boolean>;
  isContextRelevant(question: string, context: string): Promise<boolean>;
  rateAnswerRelevance(question: string, answer: string): Promise<number>;
}
