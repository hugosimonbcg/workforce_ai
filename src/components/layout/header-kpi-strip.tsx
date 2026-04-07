"use client";

import { useAppStore } from "@/lib/store";
import { getScenario, getBaselineScenario, planContext } from "@/data/mock-data";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

/** Cards sit on shell chrome — subtle lift, no separate “blue” strip. */
function DeltaPill({ text, positive }: { text: string; positive: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-px tabular-nums shrink-0 max-w-full"
      style={{
        background: positive ? "var(--bg-green-secondary)" : "var(--bg-red-secondary)",
        color: positive ? "var(--text-green)" : "var(--text-red)",
        fontSize: "10px",
        fontWeight: 600,
        lineHeight: "13px",
      }}
    >
      {text}
    </span>
  );
}

function OdmKpiCard({
  title,
  currentValue,
  baselineValue,
  deltaText,
  deltaPositive,
  sublabel,
  comparisonLabel = "Baseline",
  className,
}: {
  title: string;
  currentValue: string;
  baselineValue: string;
  deltaText: string;
  deltaPositive: boolean;
  sublabel?: string;
  comparisonLabel?: string;
  className?: string;
}) {
  const muted = "rgba(255, 255, 255, 0.62)";
  const baselineMuted = "rgba(255, 255, 255, 0.72)";

  return (
    <div
      className={cn(
        "flex flex-col rounded-[var(--radius-sm)] p-2 shrink-0 min-w-[118px]",
        className,
      )}
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 1px 0 rgba(255, 255, 255, 0.04) inset",
      }}
    >
      <p className="heading-sm truncate leading-tight mb-1.5" style={{ color: "var(--text-inverse)" }} title={title}>
        {title}
      </p>

      {/* Two equal columns: label above value in each — rows align across columns. */}
      <div className="flex min-w-0 gap-3" style={{ marginTop: "2px" }}>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <p className="label-sm leading-none" style={{ color: muted }}>
            Current
          </p>
          <p
            className="w-full tabular-nums font-semibold tracking-tight truncate leading-6"
            style={{
              color: "var(--text-inverse)",
              fontSize: "1.0625rem",
              lineHeight: "1.375rem",
            }}
            title={currentValue}
          >
            {currentValue}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5 text-right">
          <p className="label-sm w-full text-right leading-none" style={{ color: muted }}>
            {comparisonLabel}
          </p>
          <div className="flex max-w-full flex-wrap items-baseline justify-end gap-1">
            <span
              className="tabular-nums font-semibold leading-5 truncate"
              style={{ color: baselineMuted, fontSize: "0.9375rem" }}
              title={baselineValue}
            >
              {baselineValue}
            </span>
            {deltaText && deltaText !== "—" ? (
              <DeltaPill text={deltaText} positive={deltaPositive} />
            ) : null}
          </div>
        </div>
      </div>

      {sublabel && (
        <p className="action-xs mt-1.5 truncate leading-tight" style={{ color: muted }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}

export function HeaderKpiStrip() {
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const active =
    getScenario(activeScenarioId) ??
    planContext.scenarios.find((s) => s.id === planContext.activeScenarioId)!;
  const baseline = getBaselineScenario();
  const a = active.kpis;
  const b = baseline.kpis;

  const costDelta = a.totalLaborCost - b.totalLaborCost;
  const annualizedFull = active.valuLevers.reduce((s, v) => s + v.annualizedSaving, 0);
  const annualizedConservative = annualizedFull * 0.8;

  return (
    <div className="w-full px-5 py-2" style={{ background: "var(--shell-bg)" }}>
      <div className="flex flex-wrap gap-2 w-full">
        <OdmKpiCard
          className="flex-1 min-w-[118px]"
          title="Total labor cost"
          currentValue={formatCurrency(a.totalLaborCost)}
          baselineValue={formatCurrency(b.totalLaborCost)}
          deltaText={costDelta <= 0 ? `−${formatCurrency(Math.abs(costDelta))}` : `+${formatCurrency(costDelta)}`}
          deltaPositive={costDelta <= 0}
        />
        <OdmKpiCard
          className="flex-1 min-w-[118px]"
          title="Overtime cost"
          currentValue={formatCurrency(a.overtimeCost)}
          baselineValue={formatCurrency(b.overtimeCost)}
          deltaText={`−${formatCurrency(b.overtimeCost - a.overtimeCost)}`}
          deltaPositive={a.overtimeCost <= b.overtimeCost}
        />
        <OdmKpiCard
          className="flex-1 min-w-[118px]"
          title="Overtime %"
          currentValue={formatPercent(a.overtimePercent)}
          baselineValue={formatPercent(b.overtimePercent)}
          deltaText={`−${formatPercent(b.overtimePercent - a.overtimePercent)}`}
          deltaPositive={a.overtimePercent <= b.overtimePercent}
        />
        <OdmKpiCard
          className="flex-1 min-w-[118px]"
          title="Agency cost"
          currentValue={formatCurrency(a.agencyCost)}
          baselineValue={formatCurrency(b.agencyCost)}
          deltaText={`−${formatCurrency(b.agencyCost - a.agencyCost)}`}
          deltaPositive={a.agencyCost <= b.agencyCost}
        />
        <OdmKpiCard
          className="flex-1 min-w-[118px]"
          title="Cost per unit"
          currentValue={`$${a.costPerUnit.toFixed(2)}`}
          baselineValue={`$${b.costPerUnit.toFixed(2)}`}
          deltaText={`−$${(b.costPerUnit - a.costPerUnit).toFixed(2)}`}
          deltaPositive={a.costPerUnit <= b.costPerUnit}
        />
        <OdmKpiCard
          className="flex-1 min-w-[118px]"
          title="Annualized value"
          currentValue={formatCurrency(annualizedConservative, true)}
          baselineValue={formatCurrency(annualizedFull, true)}
          comparisonLabel="Expected"
          deltaText={annualizedFull > 0 ? `${formatCurrency(annualizedFull, true)}` : "—"}
          deltaPositive
          sublabel="Conservative est. (80%)"
        />
      </div>
    </div>
  );
}
