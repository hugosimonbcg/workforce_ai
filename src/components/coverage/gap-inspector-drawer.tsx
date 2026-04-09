"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle, ArrowRight, Users } from "lucide-react";
import type { CoverageBucket, ShiftBlock } from "@/data/types";
import { getBucketForCell } from "@/lib/coverage";

interface GapInspectorDrawerProps {
  buckets: CoverageBucket[];
  shifts: ShiftBlock[];
  day: number | null;
  hour: number | null;
  onClose: () => void;
}

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SKILL_COLORS: Record<string, string> = {
  picker: "#f59e0b",
  packer: "#10b981",
  receiver: "#0ea5e9",
  "putaway-op": "#6366f1",
  loader: "#ef4444",
};

export function GapInspectorDrawer({ buckets, shifts, day, hour, onClose }: GapInspectorDrawerProps) {
  const isOpen = day !== null && hour !== null;

  const cells = useMemo(() => {
    if (day === null || hour === null) return [];
    return getBucketForCell(buckets, day, hour);
  }, [buckets, day, hour]);

  const coveringShifts = useMemo(() => {
    if (day === null || hour === null) return [];
    return shifts.filter((s) => s.day === day && s.startHour <= hour && s.endHour > hour);
  }, [shifts, day, hour]);

  const totalRequired = cells.reduce((s, c) => s + c.requiredHours, 0);
  const totalPlanned = cells.reduce((s, c) => s + c.plannedHours, 0);
  const totalGap = Math.max(0, totalRequired - totalPlanned);
  const totalSurplus = Math.max(0, totalPlanned - totalRequired);

  return (
    <AnimatePresence>
      {isOpen && (
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
            maxHeight: "45vh",
            overflowY: "auto",
          }}
        >
          <div className="px-5 py-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="heading-sm" style={{ color: "var(--text-primary)" }}>
                  {DAY_LABELS[day!]} {hour}:00–{hour! + 1}:00
                </span>
                {totalGap > 0 && (
                  <span
                    className="action-xs px-2 py-0.5"
                    style={{
                      background: totalGap > 2 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                      color: totalGap > 2 ? "#ef4444" : "#f59e0b",
                      borderRadius: "var(--radius-xs)",
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
                    Gap: {totalGap.toFixed(1)}h
                  </span>
                )}
                {totalSurplus > 0.5 && (
                  <span
                    className="action-xs px-2 py-0.5"
                    style={{
                      background: "rgba(59,130,246,0.15)",
                      color: "#3b82f6",
                      borderRadius: "var(--radius-xs)",
                      fontWeight: 600,
                    }}
                  >
                    Surplus: +{totalSurplus.toFixed(1)}h
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Skill breakdown */}
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {cells.filter((c) => c.requiredHours > 0 || c.plannedHours > 0).map((cell) => {
                const gap = cell.gap;
                return (
                  <div
                    key={cell.skill}
                    className="p-3"
                    style={{
                      background: "var(--canvas-default)",
                      borderRadius: "var(--radius-xs)",
                      border: `1px solid ${gap > 0 ? "rgba(239,68,68,0.3)" : "var(--outline-secondary)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: SKILL_COLORS[cell.skill] ?? "#888" }} />
                      <span className="action-sm" style={{ color: "var(--text-primary)", fontWeight: 600, textTransform: "capitalize" }}>
                        {cell.skill.replace("-", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: "11px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>
                        Required: <strong style={{ color: "var(--text-primary)" }}>{cell.requiredHours.toFixed(1)}h</strong>
                      </span>
                      <ArrowRight size={10} style={{ color: "var(--text-tertiary)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>
                        Planned: <strong style={{ color: "var(--text-primary)" }}>{cell.plannedHours.toFixed(0)}</strong>
                      </span>
                      {gap > 0 && (
                        <span style={{ color: "#ef4444", fontWeight: 600 }}>
                          Gap: {gap.toFixed(1)}h
                        </span>
                      )}
                    </div>
                    {cell.blockers.length > 0 && (
                      <div className="mt-1.5" style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                        {cell.blockers.join(" · ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Covering shifts */}
            {coveringShifts.length > 0 && (
              <div className="mt-3">
                <div className="action-xs mb-1.5" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                  <Users size={10} className="inline mr-1" style={{ verticalAlign: "-1px" }} />
                  Shifts covering this window
                </div>
                <div className="flex flex-wrap gap-2">
                  {coveringShifts.map((s) => (
                    <span
                      key={s.id}
                      className="action-xs px-2 py-1"
                      style={{
                        background: "var(--canvas-default)",
                        border: `1px solid ${s.shiftType === "agency" ? "rgba(245,158,11,0.4)" : "var(--outline-secondary)"}`,
                        borderRadius: "var(--radius-xs)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {s.label} · {s.workerCount}w · {s.startHour}:00–{s.endHour}:00
                      {s.shiftType !== "permanent-template" && (
                        <span style={{ color: "var(--text-tertiary)", marginLeft: 4 }}>({s.shiftType})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended actions */}
            {totalGap > 0 && (
              <div className="mt-3 p-2.5" style={{ background: "rgba(245,158,11,0.08)", borderRadius: "var(--radius-xs)" }}>
                <div className="action-xs mb-1" style={{ color: "#f59e0b", fontWeight: 600 }}>Recommended actions</div>
                <ul style={{ fontSize: "11px", color: "var(--text-secondary)", paddingLeft: 16, margin: 0 }}>
                  {cells.filter((c) => c.gap > 0).map((c) => (
                    <li key={c.skill} className="mb-0.5">
                      {c.gap > 2
                        ? `Add agency ${c.skill} block ${hour}:00–${Math.min(hour! + 4, 22)}:00 (${Math.ceil(c.gap)} workers)`
                        : `Extend nearest ${c.skill} shift to cover ${hour}:00`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
