"use client";

import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterChip } from "@/components/ui/filter-chip";
import { ShiftBlockEditor } from "@/components/shift/shift-block-editor";
import { ConstraintEditorPanel } from "@/components/shift/constraint-editor-panel";
import { StickyDeltaBar } from "@/components/layout/sticky-delta-bar";
import { getActiveScenario, getBaselineScenario, planContext, defaultConstraints } from "@/data/mock-data";
import { computeCoverage, getAggregatedBucket } from "@/lib/coverage";
import { useAppStore } from "@/lib/store";
import { DAYS, ACTIVITY_COLORS, formatNumber, formatCurrency } from "@/lib/utils";
import { Sparkles, ArrowRight, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line, Bar, BarChart,
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const HOUR_START = 6;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const skillMeta: Record<string, { label: string; color: string }> = {
  receiver: { label: "Receiving", color: ACTIVITY_COLORS.receiving },
  "putaway-op": { label: "Putaway", color: ACTIVITY_COLORS.putaway },
  picker: { label: "Picking", color: ACTIVITY_COLORS.picking },
  packer: { label: "Packing", color: ACTIVITY_COLORS.packing },
  loader: { label: "Loading", color: ACTIVITY_COLORS.loading },
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
  const baseline = getBaselineScenario();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const workingShifts = useAppStore((s) => s.workingShifts);
  const setWorkingShifts = useAppStore((s) => s.setWorkingShifts);
  const constraints = useAppStore((s) => s.constraints);
  const setConstraints = useAppStore((s) => s.setConstraints);
  const updateShift = useAppStore((s) => s.updateShift);
  const removeShift = useAppStore((s) => s.removeShift);
  const duplicateShift = useAppStore((s) => s.duplicateShift);
  const toggleShiftLock = useAppStore((s) => s.toggleShiftLock);
  const addShift = useAppStore((s) => s.addShift);

  useEffect(() => {
    if (workingShifts.length === 0) {
      setWorkingShifts(active.shifts);
    }
  }, [active.shifts, workingShifts.length, setWorkingShifts]);

  const shifts = workingShifts.length > 0 ? workingShifts : active.shifts;
  const skills = Object.keys(skillMeta);
  const filteredShifts = selectedDay !== null ? shifts.filter((s) => s.day === selectedDay) : shifts;

  const coverage = useMemo(
    () => computeCoverage(planContext.demand, shifts, active.rosterAssignments, planContext.workers, planContext.laborStandards, constraints),
    [shifts, active.rosterAssignments, constraints]
  );

  const gapHoursByDayHour = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const b of coverage.buckets) {
      if (b.severity === "critical" || b.severity === "understaffed") {
        map.set(`${b.day}-${b.hour}`, true);
      }
    }
    return map;
  }, [coverage.buckets]);

  const coverageData = useMemo(() => {
    return DAYS.map((day, di) => {
      const dayDemand = planContext.demand.filter((d) => d.day === di);
      const required = Math.round(dayDemand.reduce((sum, d) => sum + d.laborHours, 0));
      const dayShifts = shifts.filter((s) => s.day === di);
      const planned = dayShifts.reduce((sum, s) => sum + s.duration * s.workerCount, 0);
      return { day, required, planned, gap: Math.max(0, required - planned) };
    });
  }, [shifts]);

  // Hourly coverage for selected day
  const hourlyCoverage = useMemo(() => {
    const day = selectedDay ?? 2;
    const hours: { hour: string; required: number; planned: number }[] = [];
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      const agg = getAggregatedBucket(coverage.buckets, day, h);
      hours.push({ hour: `${h}:00`, required: Math.round(agg.required * 10) / 10, planned: Math.round(agg.planned * 10) / 10 });
    }
    return hours;
  }, [coverage.buckets, selectedDay]);

  const shiftSummary = useMemo(() => {
    return skills.map((skill) => {
      const ss = filteredShifts.filter((s) => s.skill === skill);
      const totalWorkerHours = ss.reduce((sum, s) => sum + s.duration * s.workerCount, 0);
      const totalWorkers = ss.reduce((sum, s) => sum + s.workerCount, 0);
      const totalCost = ss.reduce((sum, s) => sum + s.duration * s.workerCount * s.costPerHour, 0);
      return { skill, ...skillMeta[skill], shiftCount: ss.length, totalWorkers, totalWorkerHours, totalCost };
    });
  }, [filteredShifts, skills]);

  const selectedShift = shifts.find((s) => s.id === selectedShiftId) ?? null;

  const handleAddShift = () => {
    const day = selectedDay ?? 0;
    addShift({
      id: `S-new-${Date.now()}`,
      day,
      skill: "picker",
      startHour: 8,
      endHour: 16,
      duration: 8,
      workerCount: 1,
      label: "NEW",
      costPerHour: 24,
      shiftType: "agency",
      locked: false,
    });
  };

  const validateShift = (s: typeof selectedShift) => {
    if (!s) return null;
    const dur = s.endHour - s.startHour;
    if (dur < constraints.shiftMinHours) return `Below min shift (${constraints.shiftMinHours}h)`;
    if (dur > constraints.shiftMaxHours) return `Exceeds max shift (${constraints.shiftMaxHours}h)`;
    if (s.startHour < constraints.shiftStartEarliest) return `Before earliest start (${constraints.shiftStartEarliest}:00)`;
    if (s.startHour > constraints.shiftStartLatest) return `After latest start (${constraints.shiftStartLatest}:00)`;
    return null;
  };

  return (
    <ScreenWrapper screenId="shift-plan" defaultAiOpen={false}>
      <div className="p-6 space-y-6" style={{ paddingBottom: 80 }}>
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
              Three key moves: <strong style={{ color: "var(--text-primary)" }}>earlier picker start (07:00)</strong>, <strong style={{ color: "var(--text-primary)" }}>staggered packer blocks</strong>, and <strong style={{ color: "var(--text-primary)" }}>late loader shifts on peak days</strong>. Click any shift to edit, drag edges to resize, or use +/− to adjust headcount.
            </p>
          </div>
        </div>

        {/* Constraint Editor */}
        <ConstraintEditorPanel
          constraints={constraints}
          onChange={setConstraints}
          baselineConstraints={defaultConstraints}
        />

        {/* Day filter + add shift */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="body-sm font-medium" style={{ color: "var(--text-secondary)" }}>Day:</span>
          <FilterChip label="Full week" active={selectedDay === null} onClick={() => setSelectedDay(null)} />
          {DAYS.map((day, i) => (
            <FilterChip key={i} label={day} active={selectedDay === i} onClick={() => setSelectedDay(i)} />
          ))}
          <button
            onClick={handleAddShift}
            className="flex items-center gap-1 px-2.5 py-1.5 action-sm transition-all"
            style={{
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--accent-primary)",
              background: "transparent",
              color: "var(--accent-primary)",
              marginLeft: "auto",
            }}
          >
            <Plus size={12} /> Add shift
          </button>
        </div>

        {/* Shift Architecture — Editable */}
        <SectionCard>
          <SectionHeader
            title="Shift Architecture"
            subtitle={`${selectedDay !== null ? `${DAYS[selectedDay]}` : "Full week"} · Click to select, drag edges to resize, +/− headcount`}
          />
          {/* Time axis */}
          <div className="flex items-center gap-2 mb-2" style={{ minWidth: "640px" }}>
            <div className="w-[100px] shrink-0" />
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

          <div className="space-y-0 overflow-x-auto" style={{ minWidth: "640px" }}>
            {(selectedDay !== null ? [selectedDay] : [0, 1, 2, 3, 4, 5, 6]).map((day) => {
              const dayHasGap = Array.from({ length: TOTAL_HOURS }, (_, h) => gapHoursByDayHour.has(`${day}-${h + HOUR_START}`)).some(Boolean);
              return (
                <div key={day}>
                  {selectedDay === null && (
                    <div className="flex items-center gap-2 mt-3 mb-2 pl-1">
                      <span className="action-sm" style={{ color: "var(--text-secondary)" }}>{DAYS[day]}</span>
                      {dayHasGap && <AlertTriangle size={10} style={{ color: "#ef4444" }} />}
                    </div>
                  )}
                  {skills.map((skill) => {
                    const meta = skillMeta[skill];
                    const daySkillShifts = shifts
                      .filter((s) => s.day === day && s.skill === skill)
                      .sort((a, b) => a.startHour - b.startHour);
                    if (daySkillShifts.length === 0) return null;

                    return (
                      <div key={`${day}-${skill}`} className="mb-1.5">
                        {daySkillShifts.map((s) => (
                          <div key={s.id} className="flex items-stretch gap-2 mb-1">
                            <div className="w-[100px] shrink-0 flex items-center justify-end pr-1">
                              <span className="action-xs truncate" style={{ color: meta.color, fontWeight: 600 }}>
                                {meta.label}
                              </span>
                            </div>
                            <div className="flex-1 relative" style={{ background: "var(--brand-100)", borderRadius: "var(--radius-xs)" }}>
                              {/* Gap markers */}
                              {Array.from({ length: TOTAL_HOURS }, (_, hi) => {
                                const hour = hi + HOUR_START;
                                if (!gapHoursByDayHour.has(`${day}-${hour}`)) return null;
                                const agg = getAggregatedBucket(coverage.buckets, day, hour);
                                const hasSkillGap = coverage.buckets.some(
                                  (b) => b.day === day && b.hour === hour && b.skill === skill && b.gap > 0
                                );
                                if (!hasSkillGap) return null;
                                return (
                                  <div
                                    key={hi}
                                    className="absolute top-0 h-1"
                                    style={{
                                      left: `${((hour - HOUR_START) / TOTAL_HOURS) * 100}%`,
                                      width: `${(1 / TOTAL_HOURS) * 100}%`,
                                      background: agg.severity === "critical" ? "#ef4444" : "#f59e0b",
                                      borderRadius: "0 0 2px 2px",
                                    }}
                                  />
                                );
                              })}
                              <ShiftBlockEditor
                                shift={s}
                                isSelected={selectedShiftId === s.id}
                                onSelect={() => setSelectedShiftId(selectedShiftId === s.id ? null : s.id)}
                                onUpdate={updateShift}
                                onDuplicate={duplicateShift}
                                onRemove={removeShift}
                                onToggleLock={toggleShiftLock}
                                timelineStart={HOUR_START}
                                timelineEnd={HOUR_END}
                                validationError={selectedShiftId === s.id ? validateShift(s) : null}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hourly coverage */}
          <SectionCard>
            <SectionHeader
              title={`Hourly Coverage — ${DAYS[selectedDay ?? 2]}`}
              subtitle="Required demand vs planned supply by hour"
            />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyCoverage} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="planned" fill="rgba(54,158,168,0.2)" stroke="#369ea8" strokeWidth={2} name="Planned" />
                <Area type="monotone" dataKey="required" fill="rgba(239,68,68,0.08)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" name="Required" />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Daily coverage bars */}
          <SectionCard>
            <SectionHeader title="Daily Coverage" subtitle="Planned vs required — gap shown in red" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={coverageData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value}h`, name === "required" ? "Required" : name === "planned" ? "Planned" : "Gap"]} />
                <Bar dataKey="required" fill="var(--outline-secondary)" radius={[3, 3, 0, 0]} barSize={20} name="required" />
                <Bar dataKey="planned" fill="#369ea8" radius={[3, 3, 0, 0]} barSize={20} name="planned" />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* Shift Summary Table */}
        <SectionCard>
          <SectionHeader
            title="Shift Summary"
            subtitle={`By skill · ${selectedDay !== null ? DAYS[selectedDay] : "Full week"}`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-secondary)" }}>
                  {["Skill", "Shifts", "Workers", "Worker-hours", "Est. cost"].map((h) => (
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
              Can this plan be staffed?
            </h3>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              Review roster assignments, exceptions, and unresolved staffing issues.
            </p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--accent-primary)" }} />
        </Link>
      </div>

      {/* Shift Inspector Drawer */}
      <AnimatePresence>
        {selectedShift && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              background: "var(--canvas-surface)",
              borderTop: "1px solid var(--outline-secondary)",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div className="px-5 py-3 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: skillMeta[selectedShift.skill]?.color ?? "#888" }} />
                <span className="heading-sm" style={{ color: "var(--text-primary)" }}>{selectedShift.label}</span>
                <span className="action-xs px-1.5 py-0.5" style={{ background: "var(--brand-100)", borderRadius: "var(--radius-xs)", color: "var(--text-secondary)" }}>
                  {selectedShift.shiftType.replace("-", " ")}
                </span>
                {selectedShift.locked && (
                  <span className="action-xs px-1.5 py-0.5" style={{ background: "rgba(245,158,11,0.15)", borderRadius: "var(--radius-xs)", color: "#f59e0b" }}>
                    Locked
                  </span>
                )}
              </div>
              <InspectorKpi label="Time" value={`${selectedShift.startHour}:00–${selectedShift.endHour}:00`} />
              <InspectorKpi label="Workers" value={`${selectedShift.workerCount}`} />
              <InspectorKpi label="Worker-h" value={`${selectedShift.duration * selectedShift.workerCount}`} />
              <InspectorKpi label="Cost" value={formatCurrency(selectedShift.duration * selectedShift.workerCount * selectedShift.costPerHour)} />
              <InspectorKpi label="Rate" value={`${formatCurrency(selectedShift.costPerHour)}/h`} />
              {validateShift(selectedShift) && (
                <span className="action-xs px-2 py-1" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: "var(--radius-xs)", fontWeight: 600 }}>
                  <AlertTriangle size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
                  {validateShift(selectedShift)}
                </span>
              )}
              <button
                onClick={() => setSelectedShiftId(null)}
                className="ml-auto p-1.5 rounded-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StickyDeltaBar
        workingShifts={shifts}
        baselineShifts={active.shifts}
        baselineKpis={active.kpis}
      />
    </ScreenWrapper>
  );
}

function InspectorKpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "9px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div className="tabular-nums" style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
