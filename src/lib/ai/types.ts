export type NarrativeSource = "preset" | "groq";

export interface AiPresetResponse {
  summary: string;
  reasoning: string[];
  confidence: number;
  sources: string[];
  lineage: string[];
}

export interface AiFollowUp {
  label: string;
  promptId: string;
}

export interface AiPreset {
  id: string;
  prompt: string;
  routeTags: string[];
  /** Lower = generic / catch-all */
  matchPriority: number;
  keywords?: string[];
  response: AiPresetResponse;
  followUps: AiFollowUp[];
  narrativeSource?: NarrativeSource;
  narrativeModelId?: string;
}

/** Subset safe to send from API when no key or for client merge */
export interface AiPresetPayload {
  id: string;
  prompt: string;
  routeTags: string[];
  response: AiPresetResponse;
  followUps: AiFollowUp[];
}
