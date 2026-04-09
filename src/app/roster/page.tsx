"use client";

import { useMemo, useEffect, useState } from "react";
import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterChip } from "@/components/ui/filter-chip";
import { Badge } from "@/components/ui/badge";
import { ExceptionQueue } from "@/components/roster/exception-queue";
import { WorkerDetailDrawer } from "@/components/roster/worker-detail-drawer";
import { RequiredRolesPanel } from "@/components/roster/required-roles-panel";
import { RosterTimelineView } from "@/components/roster/roster-timeline-view";
import { getActiveScenario, planContext } from "@/data/mock-data";
import { computeCoverage } from "@/lib/coverage";
import { useAppStore } from "@/lib/store";
import { DAYS } from "@/lib/utils";
import { Sparkles, AlertTriangle, Users, ShieldAlert, Clock, Table2, GanttChartSquare, ChevronRight } from "lucide-react";

const stateConfig: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "#369ea8", bg: "rgba(54,158,168,0.15)" },
  off: { label: "Off", color: "#6f737a", bg: "#e9ebf0" },
  training: { label: "Training", color: "#6a5acd", bg: "rgba(106,90,205,0.1)" },
  leave: { label: "Leave", color: "#f0b113", bg: "rgba(240,177,19,0.12)" },
  reserve: { label: "Reserve", color: "#546483", bg: "rgba(84,100,131,0.1)" },
  unassigned: { label: "Unassigned", color: "#bdc1c9", bg: "#f2f4f7" },
  conflict: { label: "Conflict", color: "#e54829", bg: "rgba(229,72,41,0.1)" },
};

type FilterType = "all" | "unresolved" | "exceptions" | "reserves" | string;
type RosterViewMode = "table" | "timeline";

export default function RosterPage() {
  const active = getActiveScenario();
  const { workers, horizon, demand, laborStandards } = planContext;
  const assignments = active.rosterAssignments;
  const exceptions = active.rosterExceptions;
  const [filter, setFilter] = useState<FilterType>("unresolved");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [rosterView, setRosterView] = useState<RosterViewMode>("table");
  const [rolesOpen, setRolesOpen] = useState(false);

  const constraints = useAppStore((s) => s.constraints);
  const workingShifts = useAppStore((s) => s.workingShifts);
  const setWorkingShifts = useAppStore((s) => s.setWorkingShifts);

  useEffect(() => {
    if (workingShifts.length === 0) setWorkingShifts(active.shifts);
  }, [active.shifts, workingShifts.length, setWorkingShifts]);

  const shifts = workingShifts.length > 0 ? workingShifts : active.shifts;

  const coverage = useMemo(
    () => computeCoverage(demand, shifts, assignments, workers, laborStandards, constraints),
    [demand, shifts, assignments, workers, laborStandards, constraints]
  );

  const uniqueSkills = [...new Set(workers.flatMap((w) => w.skills))];

  const unresolvedWorkerIds = new Set(exceptions.map((e) => e.workerId));
  const agencyWorkers = workers.filter((w) => w.contractType === "agency");
  const assignedCount = new Set(assignments.filter((a) => a.state === "assigned").map((a) => a.workerId)).size;
  const conflictCount = assignments.filter((a) => a.state === "conflict").length;

  const filteredWorkers = workers.filter((w) => {
    if (filter === "all") return true;
    if (filter === "unresolved") return unresolvedWorkerIds.has(w.id);
    if (filter === "exceptions") return exceptions.some((e) => e.workerId === w.id);
    if (filter === "reserves") return w.contractType === "agency";
    return w.skills.includes(filter);
  });

  const selectedWorker = selectedWorkerId ? workers.find((w) => w.id === selectedWorkerId) ?? null : null;

  return (
    <ScreenWrapper screenId="roster" defaultAiOpen={false}>
      <div className="p-6 space-y-6">
        {/* Readiness summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ReadinessCard
            icon={<Users size={14} />}
            label="Workers assigned"
            value={`${assignedCount}`}
            color="#10b981"
            onClick={() => setFilter("all")}
          />
          <ReadinessCard
            icon={<AlertTriangle size={14} />}
            label="Unresolved issues"
            value={`${exceptions.length}`}
            color={exceptions.length > 0 ? "#ef4444" : "#10b981"}
            onClick={() => setFilter("unresolved")}
          />
          <ReadinessCard
            icon={<ShieldAlert size={14} />}
            label="Agency workers"
            value={`${agencyWorkers.length}`}
            color="#f59e0b"
            onClick={() => setFilter("reserves")}
          />
          <ReadinessCard
            icon={<Clock size={14} />}
            label="Coverage"
            value={`${coverage.summary.coveragePercent.toFixed(0)}%`}
            color={coverage.summary.coveragePercent >= 95 ? "#10b981" : "#f59e0b"}
          />
          <ReadinessCard
            icon={<AlertTriangle size={14} />}
            label="Conflicts"
            value={`${conflictCount}`}
            color={conflictCount > 0 ? "#ef4444" : "#10b981"}
          />
        </div>

        {/* Blocking banner */}
        {exceptions.filter((e) => e.severity === "high").length > 0 && (
          <div
            className="p-4 flex items-center gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <AlertTriangle size={16} style={{ color: "#ef4444" }} />
            <div className="flex-1">
              <p className="action-sm font-semibold" style={{ color: "#ef4444" }}>
                {exceptions.filter((e) => e.severity === "high").length} high-severity issue{exceptions.filter((e) => e.severity === "high").length > 1 ? "s" : ""} blocking final approval
              </p>
              <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
                Resolve before sending to operations
              </p>
            </div>
            <button
              onClick={() => setFilter("unresolved")}
              className="flex items-center gap-1 px-3 py-1.5 action-sm"
              style={{ border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-xs)", color: "#ef4444", background: "transparent" }}
            >
              Show issues <ChevronRight size={12} />
            </button>
          </div>
        )}

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
              <strong style={{ color: "var(--text-primary)" }}>{assignedCount} of {workers.length} workers assigned.</strong>{" "}
              {exceptions.length} exceptions — {exceptions.filter((e) => e.severity === "high").length} high,{" "}
              {exceptions.filter((e) => e.severity === "medium").length} medium,{" "}
              {exceptions.filter((e) => e.severity === "low").length} low.
              Main risk: Thursday afternoon picker coverage if agency falls through.
            </p>
          </div>
        </div>

        {/* View toggle + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 p-0.5 rounded-md" style={{ background: "var(--brand-100)" }}>
            <span className="label-sm px-2 shrink-0" style={{ color: "var(--text-secondary)" }}>View</span>
            {([
              { id: "table" as const, label: "Table", Icon: Table2 },
              { id: "timeline" as const, label: "Schedule", Icon: GanttChartSquare },
            ]).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setRosterView(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm body-sm font-medium transition-colors"
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
          <button
            onClick={() => setRolesOpen(!rolesOpen)}
            className="action-sm px-3 py-1.5"
            style={{
              border: "1px solid var(--outline-secondary)",
              borderRadius: "var(--radius-xs)",
              color: rolesOpen ? "var(--accent-primary)" : "var(--text-secondary)",
              background: rolesOpen ? "var(--accent-primary-soft)" : "transparent",
            }}
          >
            {rolesOpen ? "Hide" : "Show"} open roles
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="body-sm font-medium mr-1" style={{ color: "var(--text-secondary)" }}>Filter:</span>
          {[
            { id: "unresolved", label: "Unresolved" },
            { id: "all", label: "All workers" },
            { id: "exceptions", label: "Exceptions" },
            { id: "reserves", label: "Agency" },
            ...uniqueSkills.map((s) => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace("-op", "") })),
          ].map((f) => (
            <FilterChip key={f.id} label={f.label} active={filter === f.id} onClick={() => setFilter(f.id)} />
          ))}
        </div>

        {/* Open roles panel */}
        {rolesOpen && (
          <SectionCard>
            <RequiredRolesPanel buckets={coverage.buckets} />
          </SectionCard>
        )}

        {/* Roster Grid */}
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
                    {DAYS.map((day) => (
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
                    const workerAssignments = assignments.filter((a) => a.workerId === worker.id);
                    const workerExceptions = exceptions.filter((e) => e.workerId === worker.id);
                    const totalHours = workerAssignments.reduce((s, a) => s + (a.hours || 0), 0);
                    const hasException = workerExceptions.length > 0;
                    const isAgency = worker.contractType === "agency";

                    return (
                      <tr
                        key={worker.id}
                        className="cursor-pointer transition-colors"
                        style={{
                          borderBottom: "1px solid var(--brand-100)",
                          borderLeft: isAgency ? "3px solid #f59e0b" : hasException ? "3px solid #ef4444" : "3px solid transparent",
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
                          <Badge variant={isAgency ? "yellow" : "default"}>
                            {isAgency ? "Agency" : "Perm"}
                          </Badge>
                        </td>
                        {DAYS.map((_, di) => {
                          const assignment = workerAssignments.find((a) => a.day === di);
                          const state = assignment?.state || "unassigned";
                          const cfg = stateConfig[state];
                          const exception = workerExceptions.find((e) => e.day === di);

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
                            {totalHours}/{worker.maxHoursWeek}
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
            subtitle={`${exceptions.length} issues · ${exceptions.filter((e) => e.severity === "high").length} high severity`}
          />
          <ExceptionQueue
            exceptions={exceptions}
            onResolve={(id) => console.log("Resolved:", id)}
            onSwap={(ex) => { setSelectedWorkerId(ex.workerId); }}
            onEscalate={(ex) => console.log("Escalated:", ex.id)}
          />
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

      {/* Worker Detail Drawer */}
      <WorkerDetailDrawer
        worker={selectedWorker}
        assignments={assignments}
        exceptions={exceptions}
        onClose={() => setSelectedWorkerId(null)}
        onSwap={(w) => console.log("Swap:", w.id)}
        onAgencyFill={(w) => console.log("Agency fill:", w.id)}
        onMarkUnavailable={(w) => console.log("Unavailable:", w.id)}
      />
    </ScreenWrapper>
  );
}

function ReadinessCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-3 text-left transition-all hover:opacity-90"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}25`,
        borderRadius: "var(--radius-xs)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
      </div>
      <div className="heading-sm tabular-nums" style={{ color }}>{value}</div>
    </button>
  );
}
