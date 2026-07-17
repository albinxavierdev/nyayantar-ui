export type Provider = "openai" | "anthropic" | "google" | "meta" | "mistral";

export type ModelBadge = "recommended" | "fast" | "accurate" | "value";

export type ModelInfo = {
  id: string;
  name: string;
  provider: Provider;
  description: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  contextWindow: number;
  useCase: string;
  badge?: ModelBadge;
};
