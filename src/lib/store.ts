import { create } from "zustand";
import type { AIInsight } from "@/data/mock-data";
import { defaultConstraints } from "@/data/mock-data";
import { findPresetById } from "@/lib/ai/routing";
import { presetResponseToInsights, presetToMergedResponse } from "@/lib/ai/preset-to-insights";
import type { NarrativeSource } from "@/lib/ai/types";
import type { ShiftBlock, RosterAssignment, PlanConstraints, CoverageMode } from "@/data/types";

export type AiPhase = "idle" | "listening" | "thinking" | "speaking";

export type RightRailMode = "issues" | "ai";

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

  // Planning state
  constraints: PlanConstraints;
  workingShifts: ShiftBlock[];
  workingAssignments: RosterAssignment[];
  coverageMode: CoverageMode;
  selectedCoverageCell: { day: number; hour: number } | null;
  issuesPanelOpen: boolean;
  rightRailMode: RightRailMode;

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

  // Planning actions
  setConstraints: (c: Partial<PlanConstraints>) => void;
  setWorkingShifts: (shifts: ShiftBlock[]) => void;
  setWorkingAssignments: (assignments: RosterAssignment[]) => void;
  updateShift: (id: string, patch: Partial<ShiftBlock>) => void;
  addShift: (shift: ShiftBlock) => void;
  removeShift: (id: string) => void;
  duplicateShift: (id: string) => void;
  toggleShiftLock: (id: string) => void;
  reassignWorker: (workerId: string, day: number, newShiftId: string, shiftLabel: string, hours: number) => void;
  setCoverageMode: (mode: CoverageMode) => void;
  setSelectedCoverageCell: (cell: { day: number; hour: number } | null) => void;
  setIssuesPanelOpen: (open: boolean) => void;
  setRightRailMode: (mode: RightRailMode) => void;
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

  constraints: { ...defaultConstraints },
  workingShifts: [],
  workingAssignments: [],
  coverageMode: "gap",
  selectedCoverageCell: null,
  issuesPanelOpen: false,
  rightRailMode: "ai",

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
      rightRailMode: (screen === "workload" || screen === "shift-plan" || screen === "roster") ? "issues" : "ai",
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

  // Planning actions
  setConstraints: (c) => set((s) => ({ constraints: { ...s.constraints, ...c } })),

  setWorkingShifts: (shifts) => set({ workingShifts: shifts }),
  setWorkingAssignments: (assignments) => set({ workingAssignments: assignments }),

  updateShift: (id, patch) =>
    set((s) => ({
      workingShifts: s.workingShifts.map((sh) =>
        sh.id === id ? { ...sh, ...patch, duration: (patch.endHour ?? sh.endHour) - (patch.startHour ?? sh.startHour) } : sh
      ),
    })),

  addShift: (shift) => set((s) => ({ workingShifts: [...s.workingShifts, shift] })),

  removeShift: (id) =>
    set((s) => ({
      workingShifts: s.workingShifts.filter((sh) => sh.id !== id || sh.locked),
    })),

  duplicateShift: (id) =>
    set((s) => {
      const source = s.workingShifts.find((sh) => sh.id === id);
      if (!source) return s;
      const newShift: ShiftBlock = { ...source, id: `${source.id}-dup-${Date.now()}`, locked: false };
      return { workingShifts: [...s.workingShifts, newShift] };
    }),

  toggleShiftLock: (id) =>
    set((s) => ({
      workingShifts: s.workingShifts.map((sh) => (sh.id === id ? { ...sh, locked: !sh.locked } : sh)),
    })),

  reassignWorker: (workerId, day, newShiftId, shiftLabel, hours) =>
    set((s) => ({
      workingAssignments: s.workingAssignments.map((a) =>
        a.workerId === workerId && a.day === day
          ? { ...a, state: "assigned" as const, shiftId: newShiftId, shiftLabel, hours }
          : a
      ),
    })),

  setCoverageMode: (mode) => set({ coverageMode: mode }),
  setSelectedCoverageCell: (cell) => set({ selectedCoverageCell: cell }),
  setIssuesPanelOpen: (open) => set({ issuesPanelOpen: open }),
  setRightRailMode: (mode) => set({ rightRailMode: mode }),
}));
