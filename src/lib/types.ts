export type Prediction = { intent: string; label: string; score: number };
export type Analysis = {
  text: string; status: 'classified' | 'uncertain'; reason: string | null;
  intent: string | null; label: string; score: number; margin: number; coverage: number;
  predictions: Prediction[]; tokens: string[]; normalized: string;
  evidence: { term: string; contribution: number }[];
  explanation_method: string; elapsed_ms: number; model: string; version: string;
};
export type HistoryItem = { id: string; text: string; label: string; score: number; timestamp: string };
export type Metrics = {
  accuracy: number; macro_f1: number; labels: string[]; confusion_matrix: number[][];
  per_intent: Record<string, { precision: number; recall: number; 'f1-score': number; support: number }>;
};
export type ModelReport = {
  version: string; dataset: string; synthetic: boolean; selected_model: string;
  intents: Record<string, string>; seed: number;
  counts: { total: number; train: number; validation: number; test: number };
  distribution: Record<string, number>; unique_groups: number; split_method: string;
  validation: Record<string, Metrics>; test: Record<string, Metrics>; threshold: number;
  limitations: string[]; source: { repository: string; revision: string; license: string };
};
