"use client";

import { useMemo } from "react";
import { TopBar } from "./top-bar";
import { CopilotRail } from "../ai/copilot-rail";
import { EvidenceDrawer } from "./evidence-drawer";
import { UnresolvedIssuesRail } from "../issues/unresolved-issues-rail";
import { useAppStore } from "@/lib/store";
import { planContext, getActiveScenario, operationalIssues } from "@/data/mock-data";
import { computeCoverage } from "@/lib/coverage";
import { AlertTriangle, Sparkles } from "lucide-react";
import type { RightRailMode } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const rightRailMode = useAppStore((s) => s.rightRailMode);
  const setRightRailMode = useAppStore((s) => s.setRightRailMode);
  const aiRailOpen = useAppStore((s) => s.aiRailOpen);
  const constraints = useAppStore((s) => s.constraints);
  const workingShifts = useAppStore((s) => s.workingShifts);

  const scenario = getActiveScenario();
  const shifts = workingShifts.length > 0 ? workingShifts : scenario.shifts;

  const coverage = useMemo(
    () => computeCoverage(planContext.demand, shifts, scenario.rosterAssignments, planContext.workers, planContext.laborStandards, constraints),
    [shifts, scenario.rosterAssignments, constraints]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--canvas-bg)" }}>
          {children}
        </main>
        {/* Right rail: tab toggle + content */}
        {aiRailOpen && (
          <div
            className="shrink-0 flex flex-col"
            style={{
              width: 340,
              borderLeft: "1px solid var(--outline-secondary)",
              background: "var(--canvas-surface)",
            }}
          >
            {/* Tab header */}
            <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--outline-secondary)" }}>
              <RailTab
                icon={<AlertTriangle size={12} />}
                label="Issues"
                count={coverage.issues.length + operationalIssues.length}
                active={rightRailMode === "issues"}
                onClick={() => setRightRailMode("issues")}
              />
              <RailTab
                icon={<Sparkles size={12} />}
                label="AI Copilot"
                active={rightRailMode === "ai"}
                onClick={() => setRightRailMode("ai")}
              />
            </div>
            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {rightRailMode === "issues" ? (
                <UnresolvedIssuesRail
                  coverageIssues={coverage.issues}
                  operationalIssues={operationalIssues}
                />
              ) : (
                <CopilotRail embedded />
              )}
            </div>
          </div>
        )}
        {!aiRailOpen && <CopilotRail />}
      </div>
      <EvidenceDrawer />
    </div>
  );
}

function RailTab({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors"
      style={{
        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
        borderBottom: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
        fontWeight: active ? 600 : 400,
        fontSize: "11px",
        background: active ? "var(--accent-primary-soft)" : "transparent",
      }}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span
          className="px-1.5 py-0.5 tabular-nums"
          style={{
            fontSize: "9px",
            fontWeight: 600,
            background: active ? "var(--accent-primary)" : "var(--outline-secondary)",
            color: active ? "white" : "var(--text-secondary)",
            borderRadius: "var(--radius-xs)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
