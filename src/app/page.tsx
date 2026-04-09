"use client";

import { useMemo } from "react";
import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { getBaselineScenario, getScenario, planContext, operationalIssues } from "@/data/mock-data";
import { computeCoverage } from "@/lib/coverage";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatPercent, ACTIVITY_COLORS, DAYS } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from "recharts";
import { ArrowRight, CheckCircle2, AlertTriangle, ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";

const tooltipStyle = {
  background: "var(--canvas-surface)",
  border: "1px solid var(--outline-secondary)",
  borderRadius: "var(--radius-sm)",
  fontSize: 12,
  fontFamily: '"Roboto", sans-serif',
};

function thresholdLabel(value: number, good: number, warn: number, lowerBetter: boolean): { label: string; color: string } {
  if (lowerBetter) {
    if (value <= good) return { label: "improved", color: "#10b981" };
    if (value <= warn) return { label: "acceptable", color: "#f59e0b" };
    return { label: "at-risk", color: "#ef4444" };
  }
  if (value >= good) return { label: "improved", color: "#10b981" };
  if (value >= warn) return { label: "acceptable", color: "#f59e0b" };
  return { label: "at-risk", color: "#ef4444" };
}

export default function RecommendationPage() {
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const constraints = useAppStore((s) => s.constraints);
  const workingShifts = useAppStore((s) => s.workingShifts);
  const active = getScenario(activeScenarioId)!;
  const baseline = getBaselineScenario();
  const a = active.kpis;
  const b = baseline.kpis;

  const shifts = workingShifts.length > 0 ? workingShifts : active.shifts;

  const coverage = useMemo(
    () => computeCoverage(planContext.demand, shifts, active.rosterAssignments, planContext.workers, planContext.laborStandards, constraints),
    [shifts, active.rosterAssignments, constraints]
  );

  const costDelta = a.totalLaborCost - b.totalLaborCost;
  const costDeltaPct = ((costDelta / b.totalLaborCost) * 100);

  const waterfallData = active.valuLevers.map((v) => ({
    name: v.label.replace(" reduction", "").replace(" improvement", ""),
    value: v.delta < 0 ? Math.abs(v.delta) : -v.delta,
    annualized: v.annualizedSaving,
    fill: v.lever === "ot-reduction" ? "#4b91d1"
      : v.lever === "agency-reduction" ? "#369ea8"
      : v.lever === "staffing-balance" ? "#52ab32"
      : "#9b7ec8",
  }));

  const proofData = [
    { metric: "Understaffing hrs", baseline: b.understaffingHours, optimized: a.understaffingHours, unit: "h", good: 15, warn: 30, lowerBetter: true },
    { metric: "Overstaffing hrs", baseline: b.overstaffingHours, optimized: a.overstaffingHours, unit: "h", good: 25, warn: 50, lowerBetter: true },
    { metric: "Coverage compliance", baseline: b.shiftCoverageCompliance, optimized: a.shiftCoverageCompliance, unit: "%", good: 95, warn: 90, lowerBetter: false },
    { metric: "SLA miss rate", baseline: b.slaMissRate, optimized: a.slaMissRate, unit: "%", good: 2, warn: 3.5, lowerBetter: true },
  ];

  const dailyWorkload = DAYS.map((day, i) => {
    const dayDemand = planContext.demand.filter((d) => d.day === i);
    const total = dayDemand.reduce((sum, d) => sum + d.laborHours, 0);
    return { day, hours: Math.round(total) };
  });

  const highIssues = operationalIssues.filter((i) => i.severity === "high");
  const medIssues = operationalIssues.filter((i) => i.severity === "medium");
  const lowIssues = operationalIssues.filter((i) => i.severity === "low");

  const assignedCount = new Set(active.rosterAssignments.filter((a2) => a2.state === "assigned").map((a2) => a2.workerId)).size;
  const agencyPending = operationalIssues.filter((i) => i.type === "agency-pending").length;
  const skillMismatches = operationalIssues.filter((i) => i.type === "skill-gap").length;
  const leaveConflicts = operationalIssues.filter((i) => i.type === "leave-overlap").length;
  const otViolations = operationalIssues.filter((i) => i.type === "ot-creep").length;

  return (
    <ScreenWrapper screenId="recommendation" defaultAiOpen={true}>
      <div className="p-6 space-y-6">
        {/* Hero Recommendation */}
        <SectionCard padding="lg">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="green">
                  <CheckCircle2 size={11} className="mr-1" /> Recommended
                </Badge>
                <Badge variant="turquoise">
                  {a.shiftCoverageCompliance}% coverage
                </Badge>
              </div>
              <h2 className="heading-xl mb-1" style={{ color: "var(--text-primary)" }}>
                Optimized Weekly Plan
              </h2>
              <p className="body-md" style={{ color: "var(--text-secondary)" }}>
                Earlier picker coverage, demand-aligned packer blocks, and reduced overtime deliver{" "}
                <strong style={{ color: "var(--positive)" }}>{formatCurrency(Math.abs(costDelta))}/week savings</strong>{" "}
                ({costDeltaPct.toFixed(1)}%) with service risk bounded at {formatPercent(a.slaMissRate)} SLA miss rate.
              </p>
            </div>
            <div className="xl:text-right shrink-0">
              <p className="label-sm mb-1" style={{ color: "var(--text-secondary)" }}>Weekly cost delta</p>
              <p className="heading-2xl tabular-nums" style={{ color: "var(--positive)" }}>
                −{formatCurrency(Math.abs(costDelta))}
              </p>
              <p className="body-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                vs baseline · {formatPercent(Math.abs(costDeltaPct))} reduction
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 xl:gap-3 mt-5 pt-4 flex-wrap"
            style={{ borderTop: "1px solid var(--brand-100)" }}
          >
            {[
              { href: "/workload", label: "Inspect coverage gaps" },
              { href: "/shift-plan", label: "Edit shift plan" },
              { href: "/roster", label: "Resolve roster issues" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 action-sm transition-opacity hover:opacity-80"
                style={{
                  background: "var(--accent-primary-soft)",
                  color: "var(--accent-primary)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {link.label} <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Unresolved risk strip */}
        <div
          className="p-4 flex items-center gap-4 flex-wrap"
          style={{
            background: highIssues.length > 0 ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
            border: `1px solid ${highIssues.length > 0 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
            borderRadius: "var(--radius-sm)",
          }}
        >
          <ShieldAlert size={16} style={{ color: highIssues.length > 0 ? "#ef4444" : "#f59e0b" }} />
          <span className="action-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Unresolved risks:
          </span>
          <RiskCount count={highIssues.length} label="high" color="#ef4444" />
          <RiskCount count={medIssues.length} label="medium" color="#f59e0b" />
          <RiskCount count={lowIssues.length} label="low" color="#6b7280" />
          <Link href="/roster" className="ml-auto flex items-center gap-1 action-xs" style={{ color: "var(--accent-primary)" }}>
            <ExternalLink size={10} /> Fix in Roster
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Value Waterfall */}
          <SectionCard>
            <div className="flex items-center justify-between mb-2">
              <SectionHeader title="Value Contribution" subtitle="Weekly savings by lever" />
              <Link href="/scenarios" className="action-xs flex items-center gap-1" style={{ color: "var(--accent-primary)" }}>
                Compare scenarios <ExternalLink size={10} />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={waterfallData} layout="vertical" margin={{ left: 100, right: 40, top: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 10, fontFamily: '"Roboto", sans-serif' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: '"Roboto", sans-serif' }} width={95} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}/week`, "Savings"]} contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {waterfallData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Operational Proof with thresholds */}
          <SectionCard>
            <div className="flex items-center justify-between mb-2">
              <SectionHeader title="Operational Proof" subtitle="Baseline vs optimized key metrics" />
              <Link href="/workload" className="action-xs flex items-center gap-1" style={{ color: "var(--accent-primary)" }}>
                Inspect gaps <ExternalLink size={10} />
              </Link>
            </div>
            <div className="space-y-3">
              {proofData.map((d) => {
                const improved = d.lowerBetter ? d.optimized < d.baseline : d.optimized > d.baseline;
                const maxVal = Math.max(d.baseline, d.optimized);
                const baselinePct = d.unit === "%" ? d.baseline : (d.baseline / maxVal) * 100;
                const optPct = d.unit === "%" ? d.optimized : (d.optimized / maxVal) * 100;
                const threshold = thresholdLabel(d.optimized, d.good, d.warn, d.lowerBetter);

                return (
                  <div key={d.metric}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.metric}</span>
                        <span
                          className="action-xs px-1.5 py-0.5"
                          style={{
                            background: `${threshold.color}15`,
                            color: threshold.color,
                            borderRadius: "var(--radius-xs)",
                            fontWeight: 600,
                          }}
                        >
                          {threshold.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 body-sm tabular-nums">
                        <span style={{ color: "var(--text-secondary)" }}>{d.baseline}{d.unit}</span>
                        <ArrowRight size={10} style={{ color: "var(--icon-tertiary)" }} />
                        <span className="font-semibold" style={{ color: improved ? "var(--positive)" : "var(--negative)" }}>
                          {d.optimized}{d.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div
                        className="h-full"
                        style={{
                          width: `${baselinePct}%`,
                          background: "var(--outline-secondary)",
                          borderRadius: "var(--radius-2xs)",
                          minWidth: "4px",
                        }}
                      />
                      <div
                        className="h-full"
                        style={{
                          width: `${optPct}%`,
                          background: improved ? "var(--positive)" : "var(--negative)",
                          borderRadius: "var(--radius-2xs)",
                          minWidth: "4px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Evidence Previews with inspect-and-fix links */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href="/workload"
            className="group p-5 transition-all hover:opacity-90"
            style={{
              background: "var(--canvas-surface)",
              border: "1px solid var(--outline-secondary)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="heading-sm" style={{ color: "var(--text-primary)" }}>Workload Peaks</h4>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-primary)" }} />
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={dailyWorkload} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Area type="monotone" dataKey="hours" stroke="var(--accent-primary)" fill="var(--accent-primary-soft)" strokeWidth={1.5} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: '"Roboto", sans-serif' }} axisLine={false} tickLine={false} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="body-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              Tue–Fri peak · {coverage.summary.totalGapHours}h total gap
            </p>
            <p className="action-xs mt-1" style={{ color: "var(--accent-primary)" }}>
              Inspect coverage gaps →
            </p>
          </Link>

          <Link
            href="/shift-plan"
            className="group p-5 transition-all hover:opacity-90"
            style={{
              background: "var(--canvas-surface)",
              border: "1px solid var(--outline-secondary)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="heading-sm" style={{ color: "var(--text-primary)" }}>Shift Architecture</h4>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="space-y-1.5">
              {["picker", "packer", "receiver", "loader"].map((skill) => {
                const skillShifts = active.shifts.filter((s) => s.skill === skill && s.day === 2);
                const color = skill === "picker" ? ACTIVITY_COLORS.picking
                  : skill === "packer" ? ACTIVITY_COLORS.packing
                  : skill === "receiver" ? ACTIVITY_COLORS.receiving
                  : ACTIVITY_COLORS.loading;
                return (
                  <div key={skill} className="flex items-center gap-2">
                    <span className="body-sm w-12 text-right capitalize" style={{ color: "var(--text-secondary)" }}>
                      {skill}
                    </span>
                    <div className="flex-1 flex gap-0.5 h-3 relative" style={{ background: "var(--brand-100)", borderRadius: "var(--radius-2xs)" }}>
                      {skillShifts.map((s) => (
                        <div
                          key={s.id}
                          className="absolute h-full"
                          style={{
                            left: `${((s.startHour - 6) / 16) * 100}%`,
                            width: `${(s.duration / 16) * 100}%`,
                            background: color,
                            opacity: 0.8,
                            borderRadius: "var(--radius-2xs)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="body-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              Wed sample · {active.shifts.length} shift blocks
            </p>
            <p className="action-xs mt-1" style={{ color: "var(--accent-primary)" }}>
              Edit shift plan →
            </p>
          </Link>

          <Link
            href="/roster"
            className="group p-5 transition-all hover:opacity-90"
            style={{
              background: "var(--canvas-surface)",
              border: `1px solid ${active.rosterExceptions.filter((e) => e.severity === "high").length > 0 ? "rgba(239,68,68,0.3)" : "var(--outline-secondary)"}`,
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="heading-sm" style={{ color: "var(--text-primary)" }}>Roster Feasibility</h4>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <FeasibilityBadge label="Assigned" value={`${assignedCount}`} color="#10b981" />
              <FeasibilityBadge label="Exceptions" value={`${active.rosterExceptions.length}`} color="#f59e0b" />
              <FeasibilityBadge label="High" value={`${active.rosterExceptions.filter((e) => e.severity === "high").length}`} color="#ef4444" />
              <FeasibilityBadge label="Agency pending" value={`${agencyPending}`} color="#f59e0b" />
              <FeasibilityBadge label="Skill gaps" value={`${skillMismatches}`} color="#6366f1" />
              <FeasibilityBadge label="Leave conflict" value={`${leaveConflicts}`} color="#ef4444" />
            </div>
            <div className="flex gap-1">
              {[...Array(planContext.workers.length)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 flex-1"
                  style={{
                    background: i < assignedCount ? "var(--accent-primary)" : i < assignedCount + 2 ? "var(--warning)" : "var(--outline-secondary)",
                    opacity: i < assignedCount ? 0.7 : 1,
                    borderRadius: "var(--radius-2xs)",
                  }}
                />
              ))}
            </div>
            <p className="action-xs mt-2" style={{ color: "var(--accent-primary)" }}>
              Resolve exceptions →
            </p>
          </Link>
        </div>
      </div>
    </ScreenWrapper>
  );
}

function RiskCount({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <span className="flex items-center gap-1 action-xs" style={{ color }}>
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {count} {label}
    </span>
  );
}

function FeasibilityBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="heading-sm tabular-nums" style={{ color }}>{value}</div>
      <div style={{ fontSize: "9px", color: "var(--text-tertiary)" }}>{label}</div>
    </div>
  );
}
