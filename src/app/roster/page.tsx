"use client";

import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterChip } from "@/components/ui/filter-chip";
import { Badge } from "@/components/ui/badge";
import { getActiveScenario, planContext } from "@/data/mock-data";
import { DAYS } from "@/lib/utils";
import { Sparkles, X, AlertTriangle, AlertCircle, Info, Table2, GanttChartSquare } from "lucide-react";
import { RosterTimelineView } from "@/components/roster/roster-timeline-view";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const stateConfig: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "#369ea8", bg: "rgba(54,158,168,0.15)" },
  off: { label: "Off", color: "#6f737a", bg: "#e9ebf0" },
  training: { label: "Training", color: "#6a5acd", bg: "rgba(106,90,205,0.1)" },
  leave: { label: "Leave", color: "#f0b113", bg: "rgba(240,177,19,0.12)" },
  reserve: { label: "Reserve", color: "#546483", bg: "rgba(84,100,131,0.1)" },
  unassigned: { label: "Unassigned", color: "#bdc1c9", bg: "#f2f4f7" },
  conflict: { label: "Conflict", color: "#e54829", bg: "rgba(229,72,41,0.1)" },
};

const severityConfig = {
  high: { icon: AlertTriangle, color: "var(--negative)", bg: "var(--negative-soft)" },
  medium: { icon: AlertCircle, color: "var(--warning)", bg: "var(--warning-soft)" },
  low: { icon: Info, color: "var(--info)", bg: "var(--info-soft)" },
};

type FilterType = "all" | "exceptions" | "reserves" | string;
type RosterViewMode = "table" | "timeline";

export default function RosterPage() {
  const active = getActiveScenario();
  const { workers, horizon } = planContext;
  const assignments = active.rosterAssignments;
  const exceptions = active.rosterExceptions;
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [rosterView, setRosterView] = useState<RosterViewMode>("table");

  const uniqueSkills = [...new Set(workers.flatMap(w => w.skills))];

  const filteredWorkers = workers.filter(w => {
    if (filter === "all") return true;
    if (filter === "exceptions") return exceptions.some(e => e.workerId === w.id);
    if (filter === "reserves") return w.contractType === "agency";
    return w.skills.includes(filter);
  });

  const selectedWorker = selectedWorkerId ? workers.find(w => w.id === selectedWorkerId) : null;
  const selectedWorkerAssignments = selectedWorkerId ? assignments.filter(a => a.workerId === selectedWorkerId) : [];
  const selectedWorkerExceptions = selectedWorkerId ? exceptions.filter(e => e.workerId === selectedWorkerId) : [];
  const selectedWorkerHours = selectedWorkerAssignments.reduce((s, a) => s + (a.hours || 0), 0);

  return (
    <ScreenWrapper screenId="roster" defaultAiOpen={false}>
      <div className="flex h-full">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* AI Insight */}
          <div
            className="p-4 flex items-start gap-3"
            style={{
              background: "var(--ai-surface)",
              border: "1px solid var(--ai-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: "var(--ai-accent)" }} />
            <div>
              <p className="action-sm mb-0.5" style={{ color: "var(--ai-accent)" }}>Roster Feasibility</p>
              <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>20 of 24 workers cleanly assigned.</strong> 5 exceptions identified — 1 high severity (agency confirmation gap on Wednesday), 2 medium, 2 low. The plan can be staffed with current workforce plus confirmed agency. Main risk: Thursday afternoon picker coverage.
              </p>
            </div>
          </div>

          {/* View + filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 p-0.5 rounded-md" style={{ background: "var(--brand-100)" }}>
              <span className="label-sm px-2 shrink-0" style={{ color: "var(--text-secondary)" }}>
                View
              </span>
              {(
                [
                  { id: "table" as const, label: "Table", Icon: Table2 },
                  { id: "timeline" as const, label: "Schedule", Icon: GanttChartSquare },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRosterView(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm body-sm font-medium transition-colors delight-focus"
                  style={{
                    color: rosterView === id ? "var(--text-inverse)" : "var(--text-secondary)",
                    background: rosterView === id ? "var(--bg-turquoise-primary)" : "transparent",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="body-sm font-medium mr-1" style={{ color: "var(--text-secondary)" }}>Filter:</span>
            {[
              { id: "all", label: "All workers" },
              { id: "exceptions", label: "Exceptions only" },
              { id: "reserves", label: "Agency / Reserves" },
              ...uniqueSkills.map(s => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace("-op", "") })),
            ].map(f => (
              <FilterChip key={f.id} label={f.label} active={filter === f.id} onClick={() => setFilter(f.id)} />
            ))}
          </div>

          {/* Roster Grid or Timeline */}
          <div
            className="overflow-hidden"
            style={{
              background: "var(--canvas-surface)",
              border: "1px solid var(--outline-secondary)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {rosterView === "timeline" ? (
              <RosterTimelineView
                weekStartIso={horizon.start}
                workers={filteredWorkers}
                assignments={assignments}
                exceptions={exceptions}
                shifts={active.shifts}
                selectedWorkerId={selectedWorkerId}
                onWorkerClick={(id) => setSelectedWorkerId(id === selectedWorkerId ? null : id)}
              />
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "var(--brand-100)" }}>
                    <th className="label-sm py-2.5 px-3 sticky left-0 z-10" style={{ color: "var(--text-secondary)", background: "var(--brand-100)", width: "160px" }}>
                      Worker
                    </th>
                    <th className="label-sm py-2.5 px-2 text-center" style={{ color: "var(--text-secondary)", width: "60px" }}>
                      Type
                    </th>
                    {DAYS.map(day => (
                      <th key={day} className="label-sm py-2.5 px-1 text-center" style={{ color: "var(--text-secondary)" }}>
                        {day}
                      </th>
                    ))}
                    <th className="label-sm py-2.5 px-2 text-center" style={{ color: "var(--text-secondary)", width: "50px" }}>
                      Hrs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => {
                    const workerAssignments = assignments.filter(a => a.workerId === worker.id);
                    const workerExceptions = exceptions.filter(e => e.workerId === worker.id);
                    const totalHours = workerAssignments.reduce((s, a) => s + (a.hours || 0), 0);
                    const hasException = workerExceptions.length > 0;

                    return (
                      <tr
                        key={worker.id}
                        className="cursor-pointer transition-colors"
                        style={{
                          borderBottom: "1px solid var(--brand-100)",
                          background: selectedWorkerId === worker.id ? "var(--accent-primary-soft)" : hasException ? "rgba(229,72,41,0.03)" : undefined,
                        }}
                        onClick={() => setSelectedWorkerId(worker.id === selectedWorkerId ? null : worker.id)}
                      >
                        <td className="py-2 px-3 sticky left-0 z-10" style={{ background: selectedWorkerId === worker.id ? "var(--accent-primary-soft)" : hasException ? "rgba(229,72,41,0.03)" : "var(--canvas-surface)" }}>
                          <div className="flex items-center gap-2">
                            {hasException && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--negative)" }} />}
                            <span className="body-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{worker.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge variant={worker.contractType === "agency" ? "yellow" : "default"}>
                            {worker.contractType === "agency" ? "Agency" : "Perm"}
                          </Badge>
                        </td>
                        {DAYS.map((_, di) => {
                          const assignment = workerAssignments.find(a => a.day === di);
                          const state = assignment?.state || "unassigned";
                          const cfg = stateConfig[state];
                          const exception = workerExceptions.find(e => e.day === di);

                          return (
                            <td key={di} className="py-2 px-1 text-center">
                              <div
                                className="mx-auto px-1 py-1 action-xs leading-tight relative"
                                style={{
                                  background: cfg.bg,
                                  color: cfg.color,
                                  maxWidth: "80px",
                                  borderRadius: "var(--radius-xs)",
                                }}
                                title={assignment?.shiftLabel || cfg.label}
                              >
                                {state === "assigned" ? (assignment?.shiftLabel?.split(" ")[0] || "Shift") : cfg.label}
                                {exception && (
                                  <div
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white"
                                    style={{ background: "var(--negative)" }}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center">
                          <span className="body-sm tabular-nums font-medium" style={{ color: totalHours > worker.maxHoursWeek ? "var(--negative)" : "var(--text-primary)" }}>
                            {totalHours}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Exception Queue */}
          <SectionCard>
            <SectionHeader
              title="Exception Queue"
              subtitle={`${exceptions.length} issues requiring attention · ${exceptions.filter(e => e.severity === "high").length} high severity`}
            />
            <div className="space-y-2">
              {exceptions
                .sort((a, b) => { const o = { high: 0, medium: 1, low: 2 }; return o[a.severity] - o[b.severity]; })
                .map((ex) => {
                  const sev = severityConfig[ex.severity];
                  const Icon = sev.icon;
                  return (
                    <div
                      key={ex.id}
                      className="flex items-start gap-3 p-3 cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: sev.bg, borderRadius: "var(--radius-sm)" }}
                      onClick={() => setSelectedWorkerId(ex.workerId)}
                    >
                      <Icon size={14} className="mt-0.5 shrink-0" style={{ color: sev.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="body-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ex.workerName}</span>
                          <span className="body-sm" style={{ color: "var(--text-secondary)" }}>{ex.dayLabel}</span>
                          <span className="label-sm ml-auto" style={{ color: sev.color }}>{ex.severity}</span>
                        </div>
                        <p className="body-sm" style={{ color: "var(--text-secondary)" }}>{ex.description}</p>
                        <p className="body-sm mt-1 font-medium" style={{ color: "var(--accent-primary)" }}>
                          → {ex.suggestion}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </SectionCard>

          {/* State Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(stateConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-3" style={{ background: cfg.bg, border: `1px solid ${cfg.color}40`, borderRadius: "var(--radius-2xs)" }} />
                <span className="body-sm" style={{ color: "var(--text-secondary)" }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Detail Side Panel */}
        <AnimatePresence>
          {selectedWorker && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full shrink-0 overflow-y-auto max-w-[320px]"
              style={{ borderLeft: "1px solid var(--outline-secondary)", background: "var(--canvas-surface)" }}
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="heading-sm" style={{ color: "var(--text-primary)" }}>
                    {selectedWorker.name}
                  </h3>
                  <button onClick={() => setSelectedWorkerId(null)} className="p-1 hover:opacity-70" style={{ borderRadius: "var(--radius-xs)" }}>
                    <X size={14} style={{ color: "var(--icon-tertiary)" }} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3" style={{ background: "var(--brand-100)", borderRadius: "var(--radius-sm)" }}>
                    <p className="label-sm mb-2" style={{ color: "var(--text-secondary)" }}>Profile</p>
                    <div className="space-y-1.5 body-sm">
                      {[
                        ["Team", selectedWorker.team],
                        ["Contract", selectedWorker.contractType],
                        ["Max hours/week", `${selectedWorker.maxHoursWeek}h`],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                          <span className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>{val}</span>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-secondary)" }}>Assigned this week</span>
                        <span className="font-medium tabular-nums" style={{ color: selectedWorkerHours > selectedWorker.maxHoursWeek ? "var(--negative)" : "var(--text-primary)" }}>
                          {selectedWorkerHours}h
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3" style={{ background: "var(--brand-100)", borderRadius: "var(--radius-sm)" }}>
                    <p className="label-sm mb-2" style={{ color: "var(--text-secondary)" }}>Qualifications</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedWorker.skills.map(s => (
                        <Badge key={s} variant="turquoise">
                          {s.replace("-op", "")}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3" style={{ background: "var(--brand-100)", borderRadius: "var(--radius-sm)" }}>
                    <p className="label-sm mb-2" style={{ color: "var(--text-secondary)" }}>Weekly Schedule</p>
                    <div className="space-y-1">
                      {selectedWorkerAssignments.map((a) => {
                        const cfg = stateConfig[a.state];
                        return (
                          <div key={a.day} className="flex items-center gap-2">
                            <span className="body-sm w-8 font-medium" style={{ color: "var(--text-secondary)" }}>{DAYS[a.day]}</span>
                            <div className="flex-1 px-2 py-1 body-sm font-medium" style={{ background: cfg.bg, color: cfg.color, borderRadius: "var(--radius-xs)" }}>
                              {a.state === "assigned" ? a.shiftLabel : cfg.label}
                              {a.hours ? ` · ${a.hours}h` : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedWorkerExceptions.length > 0 && (
                    <div className="p-3" style={{ border: "1px solid var(--negative)", background: "var(--negative-soft)", borderRadius: "var(--radius-sm)" }}>
                      <p className="label-sm mb-2" style={{ color: "var(--negative)" }}>Exceptions</p>
                      {selectedWorkerExceptions.map(ex => (
                        <div key={ex.id} className="body-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                          <p className="font-medium" style={{ color: "var(--text-primary)" }}>{ex.dayLabel}: {ex.type}</p>
                          <p>{ex.description}</p>
                          <p className="mt-1 font-medium" style={{ color: "var(--accent-primary)" }}>→ {ex.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenWrapper>
  );
}
