"use client";

import { useMemo } from "react";
import type { ShiftBlock, ScenarioKPIs } from "@/data/types";

interface StickyDeltaBarProps {
  workingShifts: ShiftBlock[];
  baselineShifts: ShiftBlock[];
  baselineKpis: ScenarioKPIs;
}

function computeShiftMetrics(shifts: ShiftBlock[]) {
  let totalCost = 0;
  let totalHours = 0;
  let otHours = 0;
  let agencyHours = 0;
  for (const s of shifts) {
    const hours = s.duration * s.workerCount;
    totalHours += hours;
    totalCost += hours * s.costPerHour;
    if (s.shiftType === "overtime") otHours += hours;
    if (s.shiftType === "agency") agencyHours += hours;
  }
  return { totalCost, totalHours, otHours, agencyHours, otPct: totalHours > 0 ? (otHours / totalHours) * 100 : 0, agencyPct: totalHours > 0 ? (agencyHours / totalHours) * 100 : 0 };
}

export function StickyDeltaBar({ workingShifts, baselineShifts, baselineKpis }: StickyDeltaBarProps) {
  const current = useMemo(() => computeShiftMetrics(workingShifts), [workingShifts]);
  const baseline = useMemo(() => computeShiftMetrics(baselineShifts), [baselineShifts]);

  const deltas = useMemo(() => {
    const costDelta = current.totalCost - baseline.totalCost;
    const hoursDelta = current.totalHours - baseline.totalHours;
    const otDelta = current.otPct - baseline.otPct;
    const agencyDelta = current.agencyPct - baseline.agencyPct;
    return { costDelta, hoursDelta, otDelta, agencyDelta };
  }, [current, baseline]);

  const hasDelta = Math.abs(deltas.costDelta) > 0 || Math.abs(deltas.hoursDelta) > 0;

  if (!hasDelta) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-6 px-6 py-2"
      style={{
        background: "var(--canvas-surface)",
        borderTop: "1px solid var(--outline-secondary)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <DeltaChip label="Cost" value={`$${Math.abs(Math.round(deltas.costDelta)).toLocaleString()}`} positive={deltas.costDelta < 0} direction={deltas.costDelta} />
      <DeltaChip label="Hours" value={`${Math.abs(Math.round(deltas.hoursDelta))}h`} positive={deltas.hoursDelta < 0} direction={deltas.hoursDelta} />
      <DeltaChip label="OT %" value={`${Math.abs(deltas.otDelta).toFixed(1)}pp`} positive={deltas.otDelta < 0} direction={deltas.otDelta} />
      <DeltaChip label="Agency %" value={`${Math.abs(deltas.agencyDelta).toFixed(1)}pp`} positive={deltas.agencyDelta < 0} direction={deltas.agencyDelta} />
      <DeltaChip label="Coverage" value={`${baselineKpis.shiftCoverageCompliance.toFixed(0)}%`} positive={true} direction={0} neutral />
    </div>
  );
}

function DeltaChip({ label, value, positive, direction, neutral }: { label: string; value: string; positive: boolean; direction: number; neutral?: boolean }) {
  const color = neutral ? "var(--text-secondary)" : positive ? "#10b981" : "#ef4444";
  const arrow = direction < 0 ? "↓" : direction > 0 ? "↑" : "";
  return (
    <div className="flex items-center gap-1.5" style={{ fontSize: "11px" }}>
      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
      <span className="tabular-nums" style={{ color, fontWeight: 600 }}>
        {!neutral && arrow} {!neutral && (positive ? "−" : "+")}{value}
      </span>
    </div>
  );
}
