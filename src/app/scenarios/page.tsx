"use client";

import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { planContext, getScenario } from "@/data/mock-data";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { CheckCircle2, Sparkles, Plus } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, ZAxis,
} from "recharts";
import { useState } from "react";

const tooltipStyle = {
  background: "var(--canvas-surface)",
  border: "1px solid var(--outline-secondary)",
  borderRadius: "var(--radius-sm)",
  fontSize: 12,
  fontFamily: '"Roboto", sans-serif',
};

const kpiRows: { label: string; key: string; format: (v: number) => string; lowerBetter: boolean }[] = [
  { label: "Total labor cost", key: "totalLaborCost", format: (v) => formatCurrency(v), lowerBetter: true },
  { label: "Overtime cost", key: "overtimeCost", format: (v) => formatCurrency(v), lowerBetter: true },
  { label: "Overtime %", key: "overtimePercent", format: (v) => formatPercent(v), lowerBetter: true },
  { label: "Agency cost", key: "agencyCost", format: (v) => formatCurrency(v), lowerBetter: true },
  { label: "Cost per unit", key: "costPerUnit", format: (v) => `$${v.toFixed(2)}`, lowerBetter: true },
  { label: "Understaffing hours", key: "understaffingHours", format: (v) => `${v}h`, lowerBetter: true },
  { label: "Coverage compliance", key: "shiftCoverageCompliance", format: (v) => formatPercent(v), lowerBetter: false },
  { label: "SLA miss rate", key: "slaMissRate", format: (v) => formatPercent(v), lowerBetter: true },
  { label: "Backlog hours", key: "backlogHours", format: (v) => `${v}h`, lowerBetter: true },
  { label: "Throughput attainment", key: "throughputAttainment", format: (v) => formatPercent(v), lowerBetter: false },
];

export default function ScenariosPage() {
  const { activeScenarioId, setActiveScenario, compareScenarioId, setCompareScenario } = useAppStore();
  const scenarios = planContext.scenarios;
  const active = getScenario(activeScenarioId)!;
  const compare = compareScenarioId ? getScenario(compareScenarioId) : null;

  const [showCreate, setShowCreate] = useState(false);

  const scatterData = scenarios.filter(s => !s.isBaseline).map(s => ({
    name: s.name,
    cost: s.kpis.totalLaborCost,
    slaMiss: s.kpis.slaMissRate,
    isActive: s.id === activeScenarioId,
    isRecommended: s.isRecommended,
    id: s.id,
  }));

  return (
    <ScreenWrapper screenId="scenarios" defaultAiOpen={true}>
      <div className="p-6 space-y-6">

        {/* Recommendation Banner */}
        <SectionCard>
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 shrink-0"
              style={{ background: "var(--positive-soft)", borderRadius: "var(--radius-sm)" }}
            >
              <CheckCircle2 size={16} style={{ color: "var(--positive)" }} />
            </div>
            <div>
              <h2 className="heading-lg" style={{ color: "var(--text-primary)" }}>
                Optimized default is recommended
              </h2>
              <p className="body-sm mt-1 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
                Achieves the lowest weekly cost ({formatCurrency(active.kpis.totalLaborCost)}) while staying within the 2% SLA miss target and keeping overtime at {formatPercent(active.kpis.overtimePercent)}. It balances cost reduction with service reliability and minimizes roster stress.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Scenario Cards */}
        <div>
          <h3 className="label-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            Scenarios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {scenarios.filter(s => !s.isBaseline).map((s) => {
              const isActive = s.id === activeScenarioId;
              const isCompare = s.id === compareScenarioId;
              return (
                <div
                  key={s.id}
                  className="p-4 transition-all cursor-pointer"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    border: isActive ? "2px solid var(--brand-600)" : "1px solid var(--outline-secondary)",
                    background: isActive ? "var(--bg-brand-tertiary)" : "var(--canvas-surface)",
                  }}
                  onClick={() => setCompareScenario(s.id === compareScenarioId ? null : s.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {s.isRecommended && <Badge variant="green">Recommended</Badge>}
                    {isActive && <Badge variant="brand">Active</Badge>}
                    {isCompare && <Badge variant="default">Compare</Badge>}
                  </div>
                  <h4 className="heading-sm mb-1" style={{ color: "var(--text-primary)" }}>{s.name}</h4>
                  <p className="body-sm mb-2" style={{ color: "var(--text-secondary)" }}>{s.description}</p>
                  <div className="flex items-center gap-3 body-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    <span>{formatCurrency(s.kpis.totalLaborCost)}</span>
                    <span>{formatPercent(s.kpis.overtimePercent)} OT</span>
                    <span>{formatPercent(s.kpis.slaMissRate)} SLA miss</span>
                  </div>
                </div>
              );
            })}
            <div
              onClick={() => setShowCreate(!showCreate)}
              className="flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-70"
              style={{
                borderRadius: "var(--radius-sm)",
                border: "2px dashed var(--outline-secondary)",
                color: "var(--text-secondary)",
                padding: "var(--space-lg)",
              }}
            >
              <Plus size={20} />
              <span className="action-sm">Create scenario</span>
            </div>
          </div>
        </div>

        {/* Scenario Creator */}
        {showCreate && (
          <div
            className="p-5"
            style={{
              background: "var(--ai-surface)",
              border: "1px solid var(--ai-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: "var(--ai-accent)" }} />
              <h3 className="action-sm" style={{ color: "var(--ai-accent)" }}>Create scenario from natural language</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {["+15% outbound demand", "Picker availability −10%", "OT cap to 5%", "Agency budget −40%", "Service target ≤1.5%", "Peak week + absenteeism"].map(preset => (
                <button
                  key={preset}
                  className="text-left px-3 py-2 body-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    border: "1px solid var(--ai-border)",
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Describe a scenario change..."
                className="flex-1 px-3 py-2 body-sm"
                style={{
                  border: "1px solid var(--ai-border)",
                  background: "white",
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Button size="sm" style={{ background: "var(--ai-accent)" }}>
                Generate
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* KPI Delta Matrix */}
          <SectionCard>
            <SectionHeader
              title="KPI Comparison"
              subtitle={`${active.name} vs ${compare?.name || "baseline"}`}
            />
            <div className="space-y-0">
              {kpiRows.map((row) => {
                const activeVal = (active.kpis as unknown as Record<string, number>)[row.key];
                const compareVal = compare
                  ? (compare.kpis as unknown as Record<string, number>)[row.key]
                  : (planContext.scenarios.find(s => s.isBaseline)!.kpis as unknown as Record<string, number>)[row.key];
                const delta = activeVal - compareVal;
                const isBetter = row.lowerBetter ? delta < 0 : delta > 0;

                return (
                  <div key={row.key} className="flex items-center py-2" style={{ borderBottom: "1px solid var(--brand-100)" }}>
                    <span className="body-sm w-[140px] shrink-0" style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                    <span className="body-sm tabular-nums font-semibold flex-1 text-right" style={{ color: "var(--text-primary)" }}>
                      {row.format(activeVal)}
                    </span>
                    <span className="body-sm tabular-nums flex-1 text-right" style={{ color: "var(--text-secondary)" }}>
                      {row.format(compareVal)}
                    </span>
                    <span
                      className="body-sm tabular-nums font-semibold w-[80px] text-right"
                      style={{ color: Math.abs(delta) < 0.01 ? "var(--text-secondary)" : isBetter ? "var(--positive)" : "var(--negative)" }}
                    >
                      {delta > 0 ? "+" : ""}{row.format(delta)}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Trade-off Scatter */}
          <SectionCard>
            <SectionHeader title="Cost vs Service Trade-off" subtitle="Lower-left is better · Weekly cost vs SLA miss rate" />
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <XAxis
                  type="number" dataKey="slaMiss" name="SLA Miss"
                  tick={{ fontSize: 10, fontFamily: '"Roboto", sans-serif' }}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "SLA miss rate →", position: "bottom", fontSize: 10, fill: "var(--text-secondary)" }}
                />
                <YAxis
                  type="number" dataKey="cost" name="Cost"
                  tick={{ fontSize: 10, fontFamily: '"Roboto", sans-serif' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  label={{ value: "Weekly cost →", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--text-secondary)" }}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    name === "Cost" ? formatCurrency(Number(value)) : `${value}%`,
                    name === "Cost" ? "Weekly cost" : "SLA miss rate",
                  ]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""}
                />
                <ReferenceLine y={80000} stroke="var(--outline-secondary)" strokeDasharray="3 3" />
                <ReferenceLine x={2} stroke="var(--outline-secondary)" strokeDasharray="3 3" />
                <Scatter data={scatterData} fill="#369ea8">
                  {scatterData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isRecommended ? "#52ab32" : entry.isActive ? "#369ea8" : "#bdc1c9"}
                      stroke={entry.isActive ? "#369ea8" : "none"}
                      strokeWidth={entry.isActive ? 2 : 0}
                      r={entry.isRecommended ? 8 : 6}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--positive)" }} />
                <span className="body-sm" style={{ color: "var(--text-secondary)" }}>Recommended</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--accent-primary)" }} />
                <span className="body-sm" style={{ color: "var(--text-secondary)" }}>Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--icon-tertiary)" }} />
                <span className="body-sm" style={{ color: "var(--text-secondary)" }}>Other</span>
              </div>
              <span className="body-sm ml-auto" style={{ color: "var(--text-secondary)" }}>↙ Better</span>
            </div>
          </SectionCard>
        </div>

      </div>
    </ScreenWrapper>
  );
}
