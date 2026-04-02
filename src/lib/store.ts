import { create } from "zustand";

interface AppState {
  activeScenarioId: string;
  compareScenarioId: string | null;
  aiRailOpen: boolean;
  evidenceOpen: boolean;
  selectedWorkerId: string | null;
  activeScreen: string;

  setActiveScenario: (id: string) => void;
  setCompareScenario: (id: string | null) => void;
  toggleAiRail: () => void;
  setAiRailOpen: (open: boolean) => void;
  toggleEvidence: () => void;
  setSelectedWorker: (id: string | null) => void;
  setActiveScreen: (screen: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeScenarioId: "optimized",
  compareScenarioId: "baseline",
  aiRailOpen: true,
  evidenceOpen: false,
  selectedWorkerId: null,
  activeScreen: "recommendation",

  setActiveScenario: (id) => set({ activeScenarioId: id }),
  setCompareScenario: (id) => set({ compareScenarioId: id }),
  toggleAiRail: () => set((s) => ({ aiRailOpen: !s.aiRailOpen })),
  setAiRailOpen: (open) => set({ aiRailOpen: open }),
  toggleEvidence: () => set((s) => ({ evidenceOpen: !s.evidenceOpen })),
  setSelectedWorker: (id) => set({ selectedWorkerId: id }),
  setActiveScreen: (screen) => set({ activeScreen: screen }),
}));
