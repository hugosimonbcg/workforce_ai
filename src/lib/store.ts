import { create } from "zustand";
import type { AIInsight } from "@/data/mock-data";
import { findPresetById } from "@/lib/ai/routing";
import { presetResponseToInsights, presetToMergedResponse } from "@/lib/ai/preset-to-insights";
import type { NarrativeSource } from "@/lib/ai/types";

export type AiPhase = "idle" | "listening" | "thinking" | "speaking";

interface AppState {
  activeScenarioId: string;
  compareScenarioId: string | null;
  aiRailOpen: boolean;
  evidenceOpen: boolean;
  selectedWorkerId: string | null;
  activeScreen: string;

  aiPhase: AiPhase;
  aiActivePresetId: string | null;
  aiRailInsights: AIInsight[] | null;
  aiNarrativeSource: NarrativeSource | null;

  setActiveScenario: (id: string) => void;
  setCompareScenario: (id: string | null) => void;
  toggleAiRail: () => void;
  setAiRailOpen: (open: boolean) => void;
  toggleEvidence: () => void;
  setSelectedWorker: (id: string | null) => void;
  setActiveScreen: (screen: string) => void;

  setAiPhase: (phase: AiPhase) => void;
  setAiRailInsights: (insights: AIInsight[] | null) => void;
  openAiPreset: (presetId: string) => void;
  hydrateAiCopilot: (insights: AIInsight[], narrativeSource: NarrativeSource, presetId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeScenarioId: "optimized",
  compareScenarioId: "baseline",
  aiRailOpen: true,
  evidenceOpen: false,
  selectedWorkerId: null,
  activeScreen: "recommendation",

  aiPhase: "idle",
  aiActivePresetId: null,
  aiRailInsights: null,
  aiNarrativeSource: null,

  setActiveScenario: (id) => set({ activeScenarioId: id }),
  setCompareScenario: (id) => set({ compareScenarioId: id }),
  toggleAiRail: () => set((s) => ({ aiRailOpen: !s.aiRailOpen })),
  setAiRailOpen: (open) => set({ aiRailOpen: open }),
  toggleEvidence: () => set((s) => ({ evidenceOpen: !s.evidenceOpen })),
  setSelectedWorker: (id) => set({ selectedWorkerId: id }),
  setActiveScreen: (screen) =>
    set({
      activeScreen: screen,
      aiRailInsights: null,
      aiActivePresetId: null,
      aiPhase: "idle",
      aiNarrativeSource: null,
    }),

  setAiPhase: (phase) => set({ aiPhase: phase }),
  setAiRailInsights: (insights) => set({ aiRailInsights: insights }),

  openAiPreset: (presetId) => {
    const preset = findPresetById(presetId);
    if (!preset) return;
    const merged = presetToMergedResponse(preset);
    const screen = get().activeScreen;
    const insights = presetResponseToInsights(preset, merged, "preset", screen);
    get().hydrateAiCopilot(insights, "preset", presetId);
  },

  hydrateAiCopilot: (insights, narrativeSource, presetId) =>
    set({
      aiRailInsights: insights,
      aiNarrativeSource: narrativeSource,
      aiActivePresetId: presetId,
      aiPhase: "idle",
    }),
}));
