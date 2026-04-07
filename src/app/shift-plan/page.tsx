"use client";

import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterChip } from "@/components/ui/filter-chip";
import { getActiveScenario, planContext } from "@/data/mock-data";
import { DAYS, ACTIVITY_COLORS, formatNumber, formatCurrency } from "@/lib/utils";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useState, useMemo } from "react";

const HOUR_START = 6;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const skillMeta: Record<string, { label: string; color: string }> = {
  "receiver": { label: "Receiving", color: ACTIVITY_COLORS.receiving },
  "putaway-op": { label: "Putaway", color: ACTIVITY_COLORS.putaway },
  "picker": { label: "Picking", color: ACTIVITY_COLORS.picking },
  "packer": { label: "Packing", color: ACTIVITY_COLORS.packing },
  "loader": { label: "Loading", color: ACTIVITY_COLORS.loading },
};

const tooltipStyle = {
  background: "var(--canvas-surface)",
  border: "1px solid var(--outline-secondary)",
  borderRadius: "var(--radius-sm)",
  fontSize: 12,
  fontFamily: '"Roboto", sans-serif',
};

export default function ShiftPlanPage() {
  const active = getActiveScenario();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const shifts = active.shifts;
  const skills = Object.keys(skillMeta);

  const filteredShifts = selectedDay !== null ? shifts.filter(s => s.day === selectedDay) : shifts;

  const coverageData = useMemo(() => {
    return DAYS.map((day, di) => {
      const dayDemand = planContext.demand.filter(d => d.day === di);
      const required = Math.round(dayDemand.reduce((sum, d) => sum + d.laborHours, 0));
      const dayShifts = shifts.filter(s => s.day === di);
      const planned = dayShifts.reduce((sum, s) => sum + s.duration * s.workerCount, 0);
      return { day, required, planned, gap: planned - required };
    });
  }, [shifts]);

  const shiftSummary = useMemo(() => {
    return skills.map(skill => {
      const ss = filteredShifts.filter(s => s.skill === skill);
      const totalWorkerHours = ss.reduce((sum, s) => sum + s.duration * s.workerCount, 0);
      const totalWorkers = ss.reduce((sum, s) => sum + s.workerCount, 0);
      const totalCost = ss.reduce((sum, s) => sum + s.duration * s.workerCount * s.costPerHour, 0);
      return { skill, ...skillMeta[skill], shiftCount: ss.length, totalWorkers, totalWorkerHours, totalCost };
    });
  }, [filteredShifts, skills]);

  const constraints = [
    { label: "OT cap", value: "8%", active: true },
    { label: "Agency cap", value: "15% of hours", active: true },
    { label: "Service target", value: "≤2% SLA miss", active: true },
    { label: "Shift duration", value: "5–10h", active: true },
    { label: "Start window", value: "06:00–15:00", active: true },
    { label: "Max consecutive", value: "6 days", active: true },
  ];

  return (
    <ScreenWrapper screenId="shift-plan" defaultAiOpen={false}>
      <div className="p-6 space-y-6">

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
            <p className="action-sm mb-0.5" style={{ color: "var(--ai-accent)" }}>Why this plan</p>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              Three key optimizer moves: <strong style={{ color: "var(--text-primary)" }}>earlier picker start (07:00 vs 09:00)</strong> catches the morning ramp, <strong style={{ color: "var(--text-primary)" }}>staggered packer blocks</strong> match the picking-to-packing flow, and <strong style={{ color: "var(--text-primary)" }}>late loader shifts on peak days</strong> eliminate the Tuesday loading backlog.
            </p>
          </div>
        </div>

        {/* Day filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="body-sm font-medium" style={{ color: "var(--text-secondary)" }}>View:</span>
          <FilterChip label="Full week" active={selectedDay === null} onClick={() => setSelectedDay(null)} />
          {DAYS.map((day, i) => (
            <FilterChip key={i} label={day} active={selectedDay === i} onClick={() => setSelectedDay(i)} />
          ))}
        </div>

        {/* Shift Architecture — Hero */}
        <SectionCard>
          <SectionHeader
            title="Shift Architecture"
            subtitle={`${selectedDay !== null ? `${DAYS[selectedDay]} shift blocks` : "Weekly shift blocks by day"} · One row per block (time × headcount) — no overlap on the same line`}
          />
          <div className="space-y-0 overflow-x-auto">
            <div className="flex items-center gap-2 mb-2" style={{ minWidth: "640px" }}>
              <div className="w-[112px] shrink-0" aria-hidden />
              <div className="flex-1 flex">
                {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="label-sm tabular-nums"
                    style={{
                      width: `${100 / TOTAL_HOURS}%`,
                      color: "var(--text-secondary)",
                      textAlign: "left",
                      transform: "translateX(-50%)",
                    }}
                  >
                    {(i + HOUR_START).toString().padStart(2, "0")}
                  </div>
                ))}
              </div>
            </div>

            {(selectedDay !== null ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6]).map((day) => (
              <div key={day}>
                {selectedDay === null && (
                  <div className="action-sm mt-3 mb-2 pl-1" style={{ color: "var(--text-secondary)" }}>
                    {DAYS[day]}
                  </div>
                )}
                {skills.map((skill) => {
                  const meta = skillMeta[skill];
                  const daySkillShifts = filteredShifts
                    .filter((s) => s.day === day && s.skill === skill)
                    .sort((a, b) => a.startHour - b.startHour || a.label.localeCompare(b.label));
                  if (daySkillShifts.length === 0) return null;

                  return (
                    <div key={`${day}-${skill}`} className="space-y-1.5 mb-2 last:mb-0">
                      {daySkillShifts.map((s) => {
                        const left = ((s.startHour - HOUR_START) / TOTAL_HOURS) * 100;
                        const width = (s.duration / TOTAL_HOURS) * 100;
                        const workerHours = s.duration * s.workerCount;
                        const blockCost = workerHours * s.costPerHour;
                        return (
                          <div
                            key={s.id}
                            className="flex items-stretch gap-2"
                            style={{ minWidth: "640px" }}
                          >
                            <div className="w-[112px] shrink-0 flex flex-col justify-center text-right pr-1">
                              <span className="body-sm font-medium leading-tight truncate" style={{ color: meta.color }}>
                                {meta.label}
                              </span>
                              <span className="action-xs leading-tight truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                {s.label}
                              </span>
                            </div>
                            <div
                              className="flex-1 relative min-h-8 py-0.5"
                              style={{ background: "var(--brand-100)", borderRadius: "var(--radius-xs)" }}
                            >
                              <div
                                className="absolute top-1 bottom-1 flex items-center justify-center gap-1 px-2 text-white shadow-sm"
                                style={{
                                  left: `${left}%`,
                                  width: `${Math.max(width, 1.5)}%`,
                                  background: meta.color,
                                  opacity: 0.92,
                                  minWidth: "36px",
                                  borderRadius: "var(--radius-xs)",
                                  border: "1px solid rgba(0,0,0,0.12)",
                                }}
                                title={`${s.label} · ${s.startHour}:00–${s.endHour}:00 · ${s.workerCount} workers · ${workerHours} worker-h · ${formatCurrency(blockCost)}`}
                              >
                                <span className="action-xs font-semibold tabular-nums whitespace-nowrap">
                                  {s.startHour}:00–{s.endHour}:00
                                </span>
                                <span className="action-xs opacity-90 whitespace-nowrap">
                                  ×{s.workerCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard>
            <SectionHeader title="Coverage: Required vs Planned" subtitle="Labor hours by day — surplus above zero, deficit below" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={coverageData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: '"Roboto", sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: '"Roboto", sans-serif' }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [`${value}h`, name === "required" ? "Required" : "Planned"]}
                />
                <ReferenceLine y={0} stroke="var(--outline-secondary)" />
                <Bar dataKey="required" fill="var(--outline-secondary)" radius={[3, 3, 0, 0]} barSize={20} name="required" />
                <Bar dataKey="planned" fill="#369ea8" radius={[3, 3, 0, 0]} barSize={20} name="planned" />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard>
            <SectionHeader title="Active Constraints" subtitle="Boundaries the optimizer respects" />
            <div className="space-y-2">
              {constraints.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center justify-between p-2.5"
                  style={{ background: "var(--brand-100)", borderRadius: "var(--radius-sm)" }}
                >
                  <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="body-sm tabular-nums font-semibold" style={{ color: "var(--accent-primary)" }}>
                      {c.value}
                    </span>
                    <div className="w-2 h-2 rounded-full" style={{ background: "var(--positive)" }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Shift Summary Table */}
        <SectionCard>
          <SectionHeader
            title="Shift Summary"
            subtitle={`Aggregated by skill · ${selectedDay !== null ? DAYS[selectedDay] : "Full week"}`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-secondary)" }}>
                  {["Skill", "Shifts", "Workers", "Worker-hours", "Est. cost"].map(h => (
                    <th key={h} className="label-sm py-2 px-3" style={{ color: "var(--text-secondary)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shiftSummary.map((s) => (
                  <tr key={s.skill} style={{ borderBottom: "1px solid var(--brand-100)" }}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2" style={{ background: s.color, borderRadius: "var(--radius-2xs)" }} />
                        <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 body-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{s.shiftCount}</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{s.totalWorkers}</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>{formatNumber(s.totalWorkerHours)}h</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>{formatCurrency(s.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Bridge to Roster */}
        <Link
          href="/roster"
          className="flex items-center justify-between p-5 transition-opacity hover:opacity-90"
          style={{
            background: "var(--canvas-surface)",
            border: "1px solid var(--outline-secondary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div>
            <h3 className="heading-sm mb-1" style={{ color: "var(--text-primary)" }}>
              Can this plan actually be staffed?
            </h3>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              Review named worker assignments, exceptions, and feasibility for the recommended shift architecture.
            </p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--accent-primary)" }} />
        </Link>

      </div>
    </ScreenWrapper>
  );
}
