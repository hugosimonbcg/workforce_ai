"use client";

import { useMemo, useEffect } from "react";
import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterChip } from "@/components/ui/filter-chip";
import { CoverageMatrix } from "@/components/coverage/coverage-matrix";
import { GapInspectorDrawer } from "@/components/coverage/gap-inspector-drawer";
import { planContext, getActiveScenario } from "@/data/mock-data";
import { computeCoverage } from "@/lib/coverage";
import { useAppStore } from "@/lib/store";
import { DAYS, ACTIVITY_COLORS, ACTIVITY_LABELS, formatNumber, formatHours } from "@/lib/utils";
import { Sparkles, ArrowRight, AlertTriangle, TrendingUp, Users, Clock } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart,
} from "recharts";
import { useState } from "react";
import type { CoverageMode } from "@/data/types";

const tooltipStyle = {
  background: "var(--canvas-surface)",
  border: "1px solid var(--outline-secondary)",
  borderRadius: "var(--radius-sm)",
  fontSize: 12,
  fontFamily: '"Roboto", sans-serif',
};

const MODE_LABELS: { mode: CoverageMode; label: string }[] = [
  { mode: "gap", label: "Gap" },
  { mode: "demand", label: "Demand" },
  { mode: "supply", label: "Planned Supply" },
  { mode: "risk", label: "Risk" },
];

export default function WorkloadPage() {
  const { demand, laborStandards, fixedWorkload, activities, workers } = planContext;
  const scenario = getActiveScenario();
  const coverageMode = useAppStore((s) => s.coverageMode);
  const setCoverageMode = useAppStore((s) => s.setCoverageMode);
  const selectedCell = useAppStore((s) => s.selectedCoverageCell);
  const setSelectedCell = useAppStore((s) => s.setSelectedCoverageCell);
  const workingShifts = useAppStore((s) => s.workingShifts);
  const setWorkingShifts = useAppStore((s) => s.setWorkingShifts);
  const constraints = useAppStore((s) => s.constraints);

  const shifts = workingShifts.length > 0 ? workingShifts : scenario.shifts;

  useEffect(() => {
    if (workingShifts.length === 0) {
      setWorkingShifts(scenario.shifts);
    }
  }, [scenario.shifts, workingShifts.length, setWorkingShifts]);

  const coverage = useMemo(
    () => computeCoverage(demand, shifts, scenario.rosterAssignments, workers, laborStandards, constraints),
    [demand, shifts, scenario.rosterAssignments, workers, laborStandards, constraints]
  );

  const [activeActivities, setActiveActivities] = useState<Set<string>>(
    new Set(activities.map((a) => a.id))
  );
  const toggleActivity = (id: string) => {
    setActiveActivities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activityMix = activities
    .map((a) => {
      const total = demand.filter((d) => d.activity === a.id).reduce((sum, d) => sum + d.laborHours, 0);
      return { ...a, totalHours: Math.round(total) };
    })
    .sort((a, b) => b.totalHours - a.totalHours);

  const totalDemandHours = activityMix.reduce((s, a) => s + a.totalHours, 0);

  const dailyByActivity = DAYS.map((day, i) => {
    const row: Record<string, number | string> = { day };
    for (const act of activities) {
      row[act.id] = Math.round(demand.filter((d) => d.day === i && d.activity === act.id).reduce((sum, d) => sum + d.laborHours, 0));
    }
    const planned = shifts.filter((s) => s.day === i).reduce((sum, s) => sum + s.workerCount * s.duration, 0);
    row.planned = planned;
    return row;
  });

  const topIssues = coverage.issues.slice(0, 5);

  const skillHours = activities.map((a) => {
    const ls = laborStandards.find((l) => l.activity === a.id);
    const totalLH = demand.filter((d) => d.activity === a.id).reduce((sum, d) => sum + d.laborHours, 0);
    const peakHourDemand = Math.max(
      ...Array.from({ length: 7 }, (_, day) =>
        Math.max(
          ...Array.from({ length: 17 }, (_, h) =>
            demand.filter((d) => d.day === day && d.hour === h + 6 && d.activity === a.id).reduce((sum, d) => sum + d.laborHours, 0)
          )
        )
      )
    );
    return {
      activity: a.name,
      skill: a.skill,
      color: a.color,
      unitsPerHour: ls?.unitsPerHour || 0,
      totalLaborHours: Math.round(totalLH),
      peakWorkerEquivalent: Math.round(peakHourDemand * 10) / 10,
    };
  });

  const totalFixedHours = fixedWorkload.reduce((s, f) => s + f.totalHours, 0);

  return (
    <ScreenWrapper screenId="workload" defaultAiOpen={false}>
      <div className="p-6 space-y-6" style={{ paddingBottom: selectedCell ? 320 : undefined }}>
        {/* Coverage summary strip */}
        <div className="flex items-center gap-3 flex-wrap">
          <SummaryBadge
            label="Coverage"
            value={`${coverage.summary.coveragePercent.toFixed(0)}%`}
            color={coverage.summary.coveragePercent >= 95 ? "#10b981" : coverage.summary.coveragePercent >= 85 ? "#f59e0b" : "#ef4444"}
          />
          <SummaryBadge label="Gap hours" value={`${coverage.summary.totalGapHours}h`} color={coverage.summary.totalGapHours > 20 ? "#ef4444" : "#f59e0b"} />
          <SummaryBadge label="Surplus hours" value={`${coverage.summary.totalSurplusHours}h`} color="#3b82f6" />
          <SummaryBadge label="Critical windows" value={String(coverage.summary.criticalWindows)} color={coverage.summary.criticalWindows > 0 ? "#ef4444" : "#10b981"} />
          <SummaryBadge label="Issues" value={`${coverage.issues.length}`} color={coverage.issues.length > 5 ? "#ef4444" : "#f59e0b"} />
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <span className="body-sm font-medium mr-1" style={{ color: "var(--text-secondary)" }}>View:</span>
          {MODE_LABELS.map(({ mode, label }) => (
            <FilterChip key={mode} label={label} active={coverageMode === mode} onClick={() => setCoverageMode(mode)} />
          ))}
        </div>

        {/* Coverage Matrix */}
        <SectionCard>
          <SectionHeader
            title="Coverage Matrix"
            subtitle={`${coverageMode === "gap" ? "Supply-demand gap" : coverageMode === "demand" ? "Required labor hours" : coverageMode === "supply" ? "Planned shift hours" : "Assignment risk"} by day and hour`}
          />
          <CoverageMatrix
            buckets={coverage.buckets}
            mode={coverageMode}
            selectedCell={selectedCell}
            onCellClick={(day, hour) => setSelectedCell(selectedCell?.day === day && selectedCell?.hour === hour ? null : { day, hour })}
          />
          <div className="flex items-center gap-3 mt-4 flex-wrap body-sm" style={{ color: "var(--text-secondary)" }}>
            {coverageMode === "gap" && (
              <>
                <LegendDot color="rgba(239,68,68,0.6)" label="Critical gap" />
                <LegendDot color="rgba(245,158,11,0.45)" label="Understaffed" />
                <LegendDot color="rgba(16,185,129,0.25)" label="Covered" />
                <LegendDot color="rgba(59,130,246,0.3)" label="Overstaffed" />
              </>
            )}
          </div>
        </SectionCard>

        {/* Top coverage actions */}
        {topIssues.length > 0 && (
          <SectionCard>
            <SectionHeader title="Top Coverage Actions" subtitle={`${coverage.issues.length} issues identified — showing top ${topIssues.length}`} />
            <div className="space-y-2">
              {topIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start gap-3 p-3 cursor-pointer transition-all hover:opacity-90"
                  style={{
                    background: issue.severity === "high" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                    border: `1px solid ${issue.severity === "high" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                    borderRadius: "var(--radius-xs)",
                  }}
                  onClick={() => setSelectedCell({ day: issue.day, hour: issue.hour })}
                >
                  <AlertTriangle
                    size={12}
                    className="mt-0.5 shrink-0"
                    style={{ color: issue.severity === "high" ? "#ef4444" : "#f59e0b" }}
                  />
                  <div className="flex-1">
                    <p className="action-sm" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{issue.description}</p>
                    <p className="body-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      <ArrowRight size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
                      {issue.suggestedAction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
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
            <p className="action-sm mb-0.5" style={{ color: "var(--ai-accent)" }}>Which peak actually matters?</p>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Tue–Fri 10:00 to 15:00</strong> drives 62% of weekly picking demand. This 20-hour window determines whether you need agency coverage or can absorb with permanent staff shifts alone. The recommended plan covers it with overlapping picker blocks — any reduction to these shifts directly impacts SLA.
            </p>
          </div>
        </div>

        {/* Activity Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="body-sm font-medium mr-1" style={{ color: "var(--text-secondary)" }}>Activities:</span>
          {activities.map((a) => (
            <button
              key={a.id}
              onClick={() => toggleActivity(a.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 action-sm transition-all"
              style={{
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${activeActivities.has(a.id) ? a.color : "var(--outline-secondary)"}`,
                background: activeActivities.has(a.id) ? `${a.color}15` : "transparent",
                color: activeActivities.has(a.id) ? a.color : "var(--text-secondary)",
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: a.color, opacity: activeActivities.has(a.id) ? 1 : 0.3 }} />
              {a.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily demand + planned supply overlay */}
          <SectionCard>
            <SectionHeader title="Daily Demand vs Planned Supply" subtitle="Stacked labor demand with planned supply overlay" />
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={dailyByActivity} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: '"Roboto", sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: '"Roboto", sans-serif' }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value}h`, name === "planned" ? "Planned supply" : (ACTIVITY_LABELS[String(name)] || name)]} />
                {activities.map((a) => (
                  <Bar key={a.id} dataKey={a.id} stackId="a" fill={a.color} radius={a.id === "loading" ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                ))}
                <Line type="monotone" dataKey="planned" stroke="var(--accent-primary)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Workload mix */}
          <SectionCard>
            <SectionHeader title="Workload Mix" subtitle="Weekly labor hours by activity" />
            <div className="space-y-3">
              {activityMix.map((a) => {
                const pct = (a.totalHours / totalDemandHours) * 100;
                return (
                  <div key={a.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5" style={{ background: a.color, borderRadius: "var(--radius-2xs)" }} />
                        <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                      </div>
                      <span className="body-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {formatNumber(a.totalHours)}h <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--brand-100)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Staffing action insights */}
        <SectionCard>
          <SectionHeader title="Translate to Staffing Actions" subtitle="What the workload pattern means for shift planning" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionInsight
              icon={<Clock size={14} />}
              title="Earlier picker start needed"
              description="Picking demand ramps from 07:00 but baseline coverage starts at 09:00 — 2h gap creates backlog"
              action="Add PCK-Early block 07:00–15:00 on weekdays"
              consequence="Reduces understaffing by ~28h/week, cuts SLA miss risk"
            />
            <ActionInsight
              icon={<Users size={14} />}
              title="Stagger packer blocks"
              description="Packing peaks 11:00–17:00 with a 2h flow lag from picking — uniform 09:00–17:00 misses afternoon demand"
              action="Split into AM (08:00–16:00) + PM (12:00–20:00)"
              consequence="Eliminates 15:00–18:00 packer gap, ~12 fewer surplus hours in morning"
            />
            <ActionInsight
              icon={<TrendingUp size={14} />}
              title="Late loader shift on peak days"
              description="Outbound loading surges 15:00–20:00 Tue–Fri but only 1 shift covers afternoon"
              action="Add LDG-Late 15:00–21:00 block Tue–Fri"
              consequence="Prevents Tuesday chronic backlog, improves outbound throughput"
            />
            <ActionInsight
              icon={<AlertTriangle size={14} />}
              title="Weekend skeleton risk"
              description="Saturday/Sunday demand at 45–55% of weekday but only 1 worker per skill — no buffer for absence"
              action="Add 1 reserve or cross-trained worker to weekend shifts"
              consequence="Reduces single-point-of-failure risk on weekends"
            />
          </div>
        </SectionCard>

        {/* Demand to Labor Translation */}
        <SectionCard>
          <SectionHeader
            title="Demand → Labor Translation"
            subtitle="How demand volume translates into required skill-hours and peak worker-equivalents"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-secondary)" }}>
                  {["Activity", "Skill", "Std/hr", "Labor hours", "Peak workers"].map((h) => (
                    <th key={h} className="label-sm py-2 px-3" style={{ color: "var(--text-secondary)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skillHours.map((s) => (
                  <tr key={s.activity} style={{ borderBottom: "1px solid var(--brand-100)" }}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2" style={{ background: s.color, borderRadius: "var(--radius-2xs)" }} />
                        <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.activity}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 body-sm capitalize" style={{ color: "var(--text-secondary)" }}>{s.skill}</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{s.unitsPerHour}</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>{formatNumber(s.totalLaborHours)}h</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums font-semibold" style={{ color: s.peakWorkerEquivalent > 6 ? "var(--warning)" : "var(--text-primary)" }}>
                      {s.peakWorkerEquivalent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Fixed Workload */}
        <SectionCard>
          <SectionHeader
            title="Fixed Workload"
            subtitle={`Non-demand-driven roles · ${formatHours(totalFixedHours)} total`}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {fixedWorkload.map((fw) => (
              <div
                key={fw.role}
                className="p-3"
                style={{
                  background: "var(--brand-100)",
                  border: "1px solid var(--outline-secondary)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: ACTIVITY_COLORS.fixed }} />
                  <span className="body-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fw.role}</span>
                </div>
                <p className="heading-md tabular-nums" style={{ color: "var(--text-primary)" }}>{formatHours(fw.totalHours)}</p>
                <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
                  {fw.hoursPerDay}h/day · {fw.daysRequired.length} days
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Bridge to Shift Plan */}
        <Link
          href="/shift-plan"
          className="flex items-center justify-between p-5 transition-opacity hover:opacity-90"
          style={{
            background: "var(--canvas-surface)",
            border: "1px solid var(--outline-secondary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div>
            <h3 className="heading-sm mb-1" style={{ color: "var(--text-primary)" }}>
              Edit the shift plan to close these gaps
            </h3>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              Open the Shift Plan to adjust shift blocks, timing, and headcount to resolve coverage issues.
            </p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--accent-primary)" }} />
        </Link>
      </div>

      <GapInspectorDrawer
        buckets={coverage.buckets}
        shifts={shifts}
        day={selectedCell?.day ?? null}
        hour={selectedCell?.hour ?? null}
        onClose={() => setSelectedCell(null)}
      />
    </ScreenWrapper>
  );
}

function SummaryBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="px-3 py-2"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: "var(--radius-xs)",
      }}
    >
      <div className="label-sm" style={{ color: "var(--text-secondary)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div className="heading-sm tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function ActionInsight({
  icon,
  title,
  description,
  action,
  consequence,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  consequence: string;
}) {
  return (
    <div
      className="p-3"
      style={{
        background: "var(--canvas-default)",
        border: "1px solid var(--outline-secondary)",
        borderRadius: "var(--radius-xs)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5" style={{ color: "var(--accent-primary)" }}>
        {icon}
        <span className="action-sm" style={{ fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
      </div>
      <p className="body-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>{description}</p>
      <p className="action-xs" style={{ color: "var(--accent-primary)" }}>
        <ArrowRight size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
        {action}
      </p>
      <p className="body-sm mt-1" style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>{consequence}</p>
    </div>
  );
}
