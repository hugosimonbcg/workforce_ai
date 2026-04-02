"use client";

import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { KPICard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { getActiveScenario, getBaselineScenario, planContext } from "@/data/mock-data";
import { formatCurrency, formatPercent, formatNumber, ACTIVITY_COLORS, DAYS } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from "recharts";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const tooltipStyle = {
  background: "var(--canvas-surface)",
  border: "1px solid var(--outline-secondary)",
  borderRadius: "var(--radius-sm)",
  fontSize: 12,
  fontFamily: '"Roboto", sans-serif',
};

export default function RecommendationPage() {
  const active = getActiveScenario();
  const baseline = getBaselineScenario();
  const a = active.kpis;
  const b = baseline.kpis;

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
    { metric: "Understaffing hrs", baseline: b.understaffingHours, optimized: a.understaffingHours, unit: "h" },
    { metric: "Overstaffing hrs", baseline: b.overstaffingHours, optimized: a.overstaffingHours, unit: "h" },
    { metric: "Coverage compliance", baseline: b.shiftCoverageCompliance, optimized: a.shiftCoverageCompliance, unit: "%" },
    { metric: "SLA miss rate", baseline: b.slaMissRate, optimized: a.slaMissRate, unit: "%" },
  ];

  const dailyWorkload = DAYS.map((day, i) => {
    const dayDemand = planContext.demand.filter(d => d.day === i);
    const total = dayDemand.reduce((sum, d) => sum + d.laborHours, 0);
    return { day, hours: Math.round(total) };
  });

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
                  96.2% coverage compliance
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
              { href: "/workload", label: "See workload drivers" },
              { href: "/shift-plan", label: "Inspect shift plan" },
              { href: "/roster", label: "Review roster feasibility" },
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

        {/* KPI Spine */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KPICard label="Total labor cost" value={formatCurrency(a.totalLaborCost)} baseline={formatCurrency(b.totalLaborCost)} delta={`−${formatCurrency(Math.abs(costDelta))}`} deltaDirection="positive" />
          <KPICard label="Overtime cost" value={formatCurrency(a.overtimeCost)} baseline={formatCurrency(b.overtimeCost)} delta={`−${formatCurrency(b.overtimeCost - a.overtimeCost)}`} deltaDirection="positive" />
          <KPICard label="Overtime %" value={formatPercent(a.overtimePercent)} baseline={formatPercent(b.overtimePercent)} delta={`−${formatPercent(b.overtimePercent - a.overtimePercent)}`} deltaDirection="positive" />
          <KPICard label="Agency cost" value={formatCurrency(a.agencyCost)} baseline={formatCurrency(b.agencyCost)} delta={`−${formatCurrency(b.agencyCost - a.agencyCost)}`} deltaDirection="positive" />
          <KPICard label="Cost per unit" value={`$${a.costPerUnit.toFixed(2)}`} baseline={`$${b.costPerUnit.toFixed(2)}`} delta={`−$${(b.costPerUnit - a.costPerUnit).toFixed(2)}`} deltaDirection="positive" />
          <KPICard label="Annualized value" value={formatCurrency(active.valuLevers.reduce((s, v) => s + v.annualizedSaving, 0) * 0.8, true)} sublabel="Conservative est. (80%)" delta={`${formatCurrency(active.valuLevers.reduce((s, v) => s + v.annualizedSaving, 0), true)} expected`} deltaDirection="positive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Value Waterfall */}
          <SectionCard>
            <SectionHeader title="Value Contribution" subtitle="Weekly savings by lever" />
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

          {/* Operational Proof */}
          <SectionCard>
            <SectionHeader title="Operational Proof" subtitle="Baseline vs optimized key metrics" />
            <div className="space-y-3">
              {proofData.map((d) => {
                const isLowerBetter = d.metric !== "Coverage compliance";
                const improved = isLowerBetter ? d.optimized < d.baseline : d.optimized > d.baseline;
                const maxVal = Math.max(d.baseline, d.optimized);
                const baselinePct = d.unit === "%" ? d.baseline : (d.baseline / maxVal) * 100;
                const optPct = d.unit === "%" ? d.optimized : (d.optimized / maxVal) * 100;

                return (
                  <div key={d.metric}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.metric}</span>
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

        {/* Evidence Previews */}
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
              <h4 className="heading-sm" style={{ color: "var(--text-primary)", fontSize: "12px" }}>Workload Peaks</h4>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-primary)" }} />
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={dailyWorkload} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Area type="monotone" dataKey="hours" stroke="var(--accent-primary)" fill="var(--accent-primary-soft)" strokeWidth={1.5} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: '"Roboto", sans-serif' }} axisLine={false} tickLine={false} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="body-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              Tue–Fri peak · Picking & packing constrained
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
              <h4 className="heading-sm" style={{ color: "var(--text-primary)", fontSize: "12px" }}>Shift Architecture</h4>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="space-y-1.5">
              {["picker", "packer", "receiver", "loader"].map((skill) => {
                const skillShifts = active.shifts.filter(s => s.skill === skill && s.day === 2);
                const color = skill === "picker" ? ACTIVITY_COLORS.picking
                  : skill === "packer" ? ACTIVITY_COLORS.packing
                  : skill === "receiver" ? ACTIVITY_COLORS.receiving
                  : ACTIVITY_COLORS.loading;
                return (
                  <div key={skill} className="flex items-center gap-2">
                    <span className="body-sm w-12 text-right capitalize" style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
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
              Wed sample · Staggered coverage 06:00–21:00
            </p>
          </Link>

          <Link
            href="/roster"
            className="group p-5 transition-all hover:opacity-90"
            style={{
              background: "var(--canvas-surface)",
              border: "1px solid var(--outline-secondary)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="heading-sm" style={{ color: "var(--text-primary)", fontSize: "12px" }}>Roster Feasibility</h4>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="heading-xl tabular-nums" style={{ color: "var(--text-primary)" }}>20</p>
                <p className="body-sm" style={{ color: "var(--text-secondary)" }}>Assigned</p>
              </div>
              <div>
                <p className="heading-xl tabular-nums" style={{ color: "var(--warning)" }}>5</p>
                <p className="body-sm" style={{ color: "var(--text-secondary)" }}>Exceptions</p>
              </div>
              <div>
                <p className="heading-xl tabular-nums" style={{ color: "var(--negative)" }}>1</p>
                <p className="body-sm" style={{ color: "var(--text-secondary)" }}>High severity</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 flex-1"
                  style={{
                    background: i < 20 ? "var(--accent-primary)" : i < 22 ? "var(--warning)" : "var(--outline-secondary)",
                    opacity: i < 20 ? 0.7 : 1,
                    borderRadius: "var(--radius-2xs)",
                  }}
                />
              ))}
            </div>
            <p className="body-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              24 workers · Agency confirmation pending Wed
            </p>
          </Link>
        </div>

      </div>
    </ScreenWrapper>
  );
}
