"use client";

import type { RosterAssignment, RosterException, ShiftBlock, Worker } from "@/data/types";
import { ACTIVITY_COLORS, DAYS } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

const DAY_START_HOUR = 5;
const DAY_END_HOUR = 23;
const HOUR_SPAN = DAY_END_HOUR - DAY_START_HOUR;

function skillToColor(skill: string): string {
  if (skill.includes("picker")) return ACTIVITY_COLORS.picking;
  if (skill.includes("packer")) return ACTIVITY_COLORS.packing;
  if (skill.includes("receiver")) return ACTIVITY_COLORS.receiving;
  if (skill.includes("putaway")) return ACTIVITY_COLORS.putaway;
  if (skill.includes("loader")) return ACTIVITY_COLORS.loading;
  return ACTIVITY_COLORS.fixed;
}

function formatShortDate(weekStartIso: string, dayIndex: number): string {
  const d = new Date(weekStartIso + "T12:00:00");
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function clampHour(h: number): number {
  return Math.min(DAY_END_HOUR, Math.max(DAY_START_HOUR, h));
}

export interface TimelineSegment {
  day: number;
  startHour: number;
  endHour: number;
  label: string;
  sublabel?: string;
  color: string;
  borderColor?: string;
  kind: "shift" | "state";
  shiftId?: string;
}

function buildSegments(
  worker: Worker,
  workerAssignments: RosterAssignment[],
  shifts: ShiftBlock[],
): TimelineSegment[] {
  const segments: TimelineSegment[] = [];

  for (const a of workerAssignments) {
    if (a.state === "assigned" && a.shiftId) {
      const shift = shifts.find((s) => s.id === a.shiftId);
      if (shift) {
        const color = skillToColor(shift.skill);
        segments.push({
          day: a.day,
          startHour: shift.startHour,
          endHour: shift.endHour,
          label: `${shift.label}`,
          sublabel: `${shift.startHour}:00–${shift.endHour}:00`,
          color,
          borderColor: "rgba(0,0,0,0.15)",
          kind: "shift",
          shiftId: shift.id,
        });
        continue;
      }
    }

    if (a.state === "training") {
      const h = a.hours ?? 4;
      segments.push({
        day: a.day,
        startHour: 8,
        endHour: 8 + h,
        label: "Training",
        sublabel: `${h}h`,
        color: "rgba(106,90,205,0.85)",
        kind: "state",
      });
      continue;
    }

    if (a.state === "leave") {
      segments.push({
        day: a.day,
        startHour: DAY_START_HOUR,
        endHour: DAY_END_HOUR,
        label: "Leave",
        color: "rgba(240,177,19,0.35)",
        borderColor: "rgba(240,177,19,0.5)",
        kind: "state",
      });
      continue;
    }

    if (a.state === "off") {
      segments.push({
        day: a.day,
        startHour: DAY_START_HOUR,
        endHour: DAY_END_HOUR,
        label: "Off",
        color: "rgba(111,115,122,0.2)",
        borderColor: "rgba(111,115,122,0.35)",
        kind: "state",
      });
      continue;
    }

    if (a.state === "reserve") {
      segments.push({
        day: a.day,
        startHour: DAY_START_HOUR,
        endHour: DAY_END_HOUR,
        label: "Reserve",
        color: "rgba(84,100,131,0.25)",
        borderColor: "rgba(84,100,131,0.45)",
        kind: "state",
      });
      continue;
    }

    if (a.state === "unassigned") {
      segments.push({
        day: a.day,
        startHour: DAY_START_HOUR,
        endHour: DAY_END_HOUR,
        label: "Unassigned",
        color: "rgba(189,193,201,0.35)",
        borderColor: "rgba(189,193,201,0.55)",
        kind: "state",
      });
    }
  }

  return segments;
}

function barStyle(seg: TimelineSegment): { left: string; width: string } {
  const s = clampHour(seg.startHour);
  const e = clampHour(seg.endHour);
  const effS = Math.max(DAY_START_HOUR, s);
  const effE = Math.min(DAY_END_HOUR, Math.max(e, effS + 0.25));
  const leftPct = ((effS - DAY_START_HOUR) / HOUR_SPAN) * 100;
  const widthPct = ((effE - effS) / HOUR_SPAN) * 100;
  return { left: `${leftPct}%`, width: `${Math.max(widthPct, 1.2)}%` };
}

const stateConfig: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned shift", color: "#369ea8", bg: "rgba(54,158,168,0.15)" },
  off: { label: "Off", color: "#6f737a", bg: "#e9ebf0" },
  training: { label: "Training", color: "#6a5acd", bg: "rgba(106,90,205,0.1)" },
  leave: { label: "Leave", color: "#f0b113", bg: "rgba(240,177,19,0.12)" },
  reserve: { label: "Reserve", color: "#546483", bg: "rgba(84,100,131,0.1)" },
  unassigned: { label: "Unassigned", color: "#bdc1c9", bg: "#f2f4f7" },
};

interface RosterTimelineViewProps {
  weekStartIso: string;
  workers: Worker[];
  assignments: RosterAssignment[];
  exceptions: RosterException[];
  shifts: ShiftBlock[];
  selectedWorkerId: string | null;
  onWorkerClick: (workerId: string) => void;
}

export function RosterTimelineView({
  weekStartIso,
  workers,
  assignments,
  exceptions,
  shifts,
  selectedWorkerId,
  onWorkerClick,
}: RosterTimelineViewProps) {
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    lines: { title: string; body: string; swatch: string }[];
  } | null>(null);

  const hourTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 6; h <= 18; h += 6) {
      ticks.push(h);
    }
    return ticks;
  }, []);

  const hideTip = useCallback(() => setTip(null), []);

  const showTipForSegments = useCallback(
    (e: React.MouseEvent, worker: Worker, daySegs: TimelineSegment[]) => {
      if (daySegs.length === 0) return;
      const lines = daySegs.map((seg) => {
        const shift = seg.kind === "shift" && seg.shiftId ? shifts.find((s) => s.id === seg.shiftId) : undefined;
        const hrs = seg.endHour - seg.startHour;
        const roleLabel = shift?.skill
          ? shift.skill.replace("-op", "").replace(/^\w/, (c) => c.toUpperCase())
          : (worker.skills[0] ?? "worker").replace("-op", "").replace(/^\w/, (c) => c.toUpperCase());
        const datePart = `${DAYS[seg.day]} ${formatShortDate(weekStartIso, seg.day)}`;
        const timePart =
          seg.kind === "state" && (seg.label === "Off" || seg.label === "Leave" || seg.label === "Reserve" || seg.label === "Unassigned")
            ? "All day"
            : `${seg.startHour}:00–${seg.endHour}:00`;
        let body: string;
        if (seg.kind === "shift" && shift) {
          const cost = hrs * shift.costPerHour;
          body = `${roleLabel} · ${seg.label} · ${datePart} ${timePart} · ${hrs.toFixed(1)}h · $${Math.round(cost)}`;
        } else {
          body = `${seg.label} · ${datePart} · ${timePart}`;
        }
        return {
          title: `${worker.name} (${worker.id})`,
          body,
          swatch: seg.color,
        };
      });
      setTip({ x: e.clientX, y: e.clientY, lines: lines.slice(0, 6) });
    },
    [shifts, weekStartIso],
  );

  return (
    <div className="overflow-hidden flex flex-col min-h-[320px]" onMouseLeave={hideTip}>
      <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-2 flex-wrap">
        <div>
          <h3 className="heading-md" style={{ color: "var(--text-primary)" }}>
            Worker schedule
          </h3>
          <p className="body-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {workers.length} workers across 7 days · {formatShortDate(weekStartIso, 0)} –{" "}
            {formatShortDate(weekStartIso, 6)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="label-sm" style={{ color: "var(--text-secondary)" }}>
            Role (assigned)
          </span>
          {[
            ["Picker", ACTIVITY_COLORS.picking],
            ["Packer", ACTIVITY_COLORS.packing],
            ["Receiver", ACTIVITY_COLORS.receiving],
            ["Putaway", ACTIVITY_COLORS.putaway],
            ["Loader", ACTIVITY_COLORS.loading],
            ["Other", ACTIVITY_COLORS.fixed],
          ].map(([label, c]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm shrink-0" style={{ background: c }} />
              <span className="body-sm" style={{ color: "var(--text-secondary)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-4 pb-3">
        {Object.entries(stateConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: cfg.bg, border: `1px solid ${cfg.color}40` }}
            />
            <span className="body-sm" style={{ color: "var(--text-secondary)" }}>
              {cfg.label}
            </span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto flex-1 pb-4">
        <div className="min-w-[880px] px-4">
          {/* Header: hour ticks row */}
          <div className="flex">
            <div
              className="shrink-0 sticky left-0 z-20 py-2 pr-2"
              style={{ width: "140px", background: "var(--canvas-surface)" }}
            />
            <div className="flex-1 grid grid-cols-7 gap-0 border-b" style={{ borderColor: "var(--outline-secondary)" }}>
              {DAYS.map((day, di) => (
                <div
                  key={day}
                  className="text-center py-2 px-1 border-l first:border-l-0"
                  style={{ borderColor: "var(--outline-secondary)" }}
                >
                  <div className="label-sm" style={{ color: "var(--text-secondary)" }}>
                    {day}
                  </div>
                  <div className="body-sm font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {formatShortDate(weekStartIso, di)}
                  </div>
                  <div className="flex justify-between mt-1 px-0.5">
                    {hourTicks.map((h) => (
                      <span
                        key={h}
                        className="action-xs tabular-nums"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {h.toString().padStart(2, "0")}:00
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {workers.map((worker) => {
            const workerAssignments = assignments.filter((a) => a.workerId === worker.id);
            const segs = buildSegments(worker, workerAssignments, shifts);
            const byDay = new Map<number, TimelineSegment[]>();
            for (const s of segs) {
              const arr = byDay.get(s.day) ?? [];
              arr.push(s);
              byDay.set(s.day, arr);
            }
            const hasException = exceptions.some((e) => e.workerId === worker.id);

            return (
              <div key={worker.id} className="flex border-b" style={{ borderColor: "var(--brand-100)" }}>
                <button
                  type="button"
                  onClick={() => onWorkerClick(worker.id)}
                  className="shrink-0 sticky left-0 z-10 text-left py-2 pr-2 pl-1 flex items-center gap-2 min-h-[44px] delight-focus"
                  style={{
                    width: "140px",
                    background:
                      selectedWorkerId === worker.id
                        ? "var(--accent-primary-soft)"
                        : hasException
                          ? "rgba(229,72,41,0.04)"
                          : "var(--canvas-surface)",
                  }}
                >
                  {hasException && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--negative)" }} />
                  )}
                  <span className="body-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {worker.name}
                  </span>
                </button>
                <div className="flex-1 grid grid-cols-7 gap-0 min-h-[44px]">
                  {DAYS.map((_, di) => {
                    const daySegs = byDay.get(di) ?? [];
                    return (
                      <div
                        key={di}
                        className="relative border-l first:border-l-0 py-1.5 px-0.5"
                        style={{ borderColor: "var(--outline-secondary)", background: "var(--canvas-surface)" }}
                        onMouseMove={(e) => {
                          if (daySegs.length) showTipForSegments(e, worker, daySegs);
                        }}
                        onMouseLeave={hideTip}
                      >
                        <div
                          className="relative h-7 rounded-sm"
                          style={{ background: "var(--brand-100)" }}
                        >
                          {daySegs.map((seg, idx) => (
                            <div
                              key={`${seg.day}-${idx}-${seg.label}`}
                              className="absolute top-0.5 bottom-0.5 rounded-sm overflow-hidden"
                              style={{
                                ...barStyle(seg),
                                background: seg.color,
                                border: seg.borderColor ? `1px solid ${seg.borderColor}` : undefined,
                                minWidth: "2px",
                              }}
                              title={`${seg.label}${seg.sublabel ? ` · ${seg.sublabel}` : ""}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tip && (
        <div
          className="fixed z-50 pointer-events-none max-w-sm rounded-md px-3 py-2 shadow-lg border"
          style={{
            left: Math.min(tip.x + 12, typeof window !== "undefined" ? window.innerWidth - 280 : tip.x),
            top: Math.min(tip.y + 12, typeof window !== "undefined" ? window.innerHeight - 200 : tip.y),
            background: "var(--canvas-surface-raised)",
            borderColor: "var(--outline-secondary)",
            boxShadow: "var(--elevation-300)",
          }}
        >
          {tip.lines.map((line, i) => (
            <div key={i} className={i > 0 ? "mt-2 pt-2 border-t" : ""} style={{ borderColor: "var(--outline-secondary)" }}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: line.swatch }} />
                <span className="body-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {line.title}
                </span>
              </div>
              <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
                {line.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
