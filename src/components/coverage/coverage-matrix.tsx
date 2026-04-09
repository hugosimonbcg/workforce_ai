"use client";

import { useMemo } from "react";
import type { CoverageBucket, CoverageMode } from "@/data/types";
import { getAggregatedBucket } from "@/lib/coverage";

interface CoverageMatrixProps {
  buckets: CoverageBucket[];
  mode: CoverageMode;
  selectedCell: { day: number; hour: number } | null;
  onCellClick: (day: number, hour: number) => void;
  days?: number;
  startHour?: number;
  endHour?: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function cellColor(mode: CoverageMode, agg: ReturnType<typeof getAggregatedBucket>): string {
  if (mode === "demand") {
    if (agg.required === 0) return "var(--canvas-surface)";
    const intensity = Math.min(1, agg.required / 12);
    return `rgba(99, 102, 241, ${0.1 + intensity * 0.6})`;
  }
  if (mode === "supply") {
    if (agg.planned === 0) return "var(--canvas-surface)";
    const intensity = Math.min(1, agg.planned / 12);
    return `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`;
  }
  if (mode === "risk") {
    if (agg.required === 0) return "var(--canvas-surface)";
    const assigned = agg.assigned;
    const required = agg.required;
    if (assigned === 0 && required > 0) return "rgba(239, 68, 68, 0.7)";
    const ratio = assigned / required;
    if (ratio >= 1) return "rgba(16, 185, 129, 0.35)";
    if (ratio >= 0.7) return "rgba(245, 158, 11, 0.45)";
    return "rgba(239, 68, 68, 0.55)";
  }
  // gap mode (default)
  const { severity } = agg;
  switch (severity) {
    case "critical": return "rgba(239, 68, 68, 0.6)";
    case "understaffed": return "rgba(245, 158, 11, 0.45)";
    case "tight": return "rgba(245, 158, 11, 0.2)";
    case "overstaffed": return "rgba(59, 130, 246, 0.3)";
    case "covered": return agg.required > 0 ? "rgba(16, 185, 129, 0.25)" : "var(--canvas-surface)";
    default: return "var(--canvas-surface)";
  }
}

function cellValue(mode: CoverageMode, agg: ReturnType<typeof getAggregatedBucket>): string {
  if (mode === "demand") return agg.required > 0 ? agg.required.toFixed(1) : "";
  if (mode === "supply") return agg.planned > 0 ? agg.planned.toFixed(0) : "";
  if (mode === "risk") {
    if (agg.required === 0) return "";
    return agg.assigned > 0 ? `${agg.assigned}/${Math.ceil(agg.required)}` : "0";
  }
  if (agg.gap > 0) return `-${agg.gap.toFixed(1)}`;
  if (agg.surplus > 0.5) return `+${agg.surplus.toFixed(1)}`;
  if (agg.required > 0) return "✓";
  return "";
}

export function CoverageMatrix({
  buckets,
  mode,
  selectedCell,
  onCellClick,
  days = 7,
  startHour = 6,
  endHour = 22,
}: CoverageMatrixProps) {
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = startHour; i <= endHour; i++) h.push(i);
    return h;
  }, [startHour, endHour]);

  const dayRange = useMemo(() => Array.from({ length: days }, (_, i) => i), [days]);

  const cornerBg = "var(--canvas-surface)";
  const stickyShadow = "2px 0 8px -2px rgba(0,0,0,0.08)";
  const stickyShadowTop = "0 2px 8px -2px rgba(0,0,0,0.06)";

  return (
    <div
      className="rounded-[var(--radius-xs)] border overflow-auto max-h-[min(58vh,560px)]"
      style={{ borderColor: "var(--outline-secondary)" }}
    >
      <table
        className="border-collapse w-full min-w-[720px] sm:min-w-[880px]"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: "4.25rem" }} />
          {hours.map((h) => (
            <col key={h} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              className="text-left align-bottom px-3 py-2.5"
              style={{
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.02em",
                position: "sticky",
                left: 0,
                top: 0,
                zIndex: 4,
                background: cornerBg,
                boxShadow: `${stickyShadow}, ${stickyShadowTop}`,
                borderBottom: "1px solid var(--outline-secondary)",
              }}
            >
              Day
            </th>
            {hours.map((h) => (
              <th
                key={h}
                className="text-center align-bottom px-1 py-2.5 tabular-nums"
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "11px",
                  lineHeight: 1.2,
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  background: "var(--canvas-surface)",
                  boxShadow: stickyShadowTop,
                  borderBottom: "1px solid var(--outline-secondary)",
                }}
              >
                <span className="block whitespace-nowrap">{String(h).padStart(2, "0")}</span>
                <span className="block font-medium opacity-70" style={{ fontSize: "10px", fontWeight: 500 }}>
                  :00
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayRange.map((day) => (
            <tr key={day}>
              <th
                scope="row"
                className="text-left px-3 py-2.5 tabular-nums"
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: "13px",
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  background: cornerBg,
                  boxShadow: stickyShadow,
                  borderBottom: "1px solid var(--outline-secondary)",
                  borderRight: "1px solid var(--outline-secondary)",
                }}
              >
                {DAY_LABELS[day]}
              </th>
              {hours.map((hour) => {
                const agg = getAggregatedBucket(buckets, day, hour);
                const isSelected = selectedCell?.day === day && selectedCell?.hour === hour;
                return (
                  <td
                    key={hour}
                    onClick={() => onCellClick(day, hour)}
                    className="text-center cursor-pointer transition-[box-shadow,transform] duration-150 hover:brightness-[1.02] active:scale-[0.98] tabular-nums"
                    style={{
                      background: cellColor(mode, agg),
                      color: agg.gap > 0 ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: agg.gap > 0 ? 600 : 500,
                      padding: "10px 6px",
                      borderBottom: "1px solid var(--outline-secondary)",
                      borderRight: "1px solid var(--outline-secondary)",
                      fontSize: "12px",
                      lineHeight: 1.25,
                      boxShadow: isSelected ? "inset 0 0 0 2px var(--accent-primary)" : undefined,
                    }}
                    title={`${DAY_LABELS[day]} ${hour}:00 — Req: ${agg.required.toFixed(1)}h, Plan: ${agg.planned}h, Gap: ${agg.gap.toFixed(1)}h`}
                  >
                    <span className="inline-block min-h-[1.25rem] min-w-[1.25rem] whitespace-nowrap leading-none">
                      {cellValue(mode, agg) || "\u00a0"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
