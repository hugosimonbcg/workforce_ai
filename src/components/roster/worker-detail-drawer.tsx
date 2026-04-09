"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, RefreshCw, UserPlus, Ban, Clock, Shield, Award } from "lucide-react";
import type { Worker, RosterAssignment, RosterException } from "@/data/types";
import { DAYS } from "@/lib/utils";

interface WorkerDetailDrawerProps {
  worker: Worker | null;
  assignments: RosterAssignment[];
  exceptions: RosterException[];
  onClose: () => void;
  onSwap: (worker: Worker) => void;
  onAgencyFill: (worker: Worker) => void;
  onMarkUnavailable: (worker: Worker) => void;
}

export function WorkerDetailDrawer({
  worker,
  assignments,
  exceptions,
  onClose,
  onSwap,
  onAgencyFill,
  onMarkUnavailable,
}: WorkerDetailDrawerProps) {
  if (!worker) return null;

  const workerAssignments = assignments.filter((a) => a.workerId === worker.id);
  const workerExceptions = exceptions.filter((e) => e.workerId === worker.id);
  const totalHours = workerAssignments.reduce((s, a) => s + (a.hours ?? 0), 0);
  const isAgency = worker.contractType === "agency";

  return (
    <AnimatePresence>
      {worker && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="fixed right-0 top-0 bottom-0 z-50 w-[340px] overflow-y-auto"
          style={{
            background: "var(--canvas-surface)",
            borderLeft: "1px solid var(--outline-secondary)",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          }}
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="heading-sm" style={{ color: "var(--text-primary)" }}>{worker.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="action-xs px-1.5 py-0.5"
                    style={{
                      background: isAgency ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                      color: isAgency ? "#f59e0b" : "#10b981",
                      borderRadius: "var(--radius-xs)",
                      fontWeight: 600,
                    }}
                  >
                    {worker.contractType}
                  </span>
                  <span className="action-xs" style={{ color: "var(--text-tertiary)" }}>Team {worker.team}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-sm hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Skills */}
            <Section label="Qualifications" icon={<Award size={12} />}>
              <div className="flex flex-wrap gap-1.5">
                {worker.skills.map((skill) => (
                  <span
                    key={skill}
                    className="action-xs px-2 py-1 capitalize"
                    style={{
                      background: "var(--brand-100)",
                      border: "1px solid var(--outline-secondary)",
                      borderRadius: "var(--radius-xs)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {skill.replace("-", " ")}
                  </span>
                ))}
              </div>
            </Section>

            {/* Hours */}
            <Section label="Weekly hours" icon={<Clock size={12} />}>
              <div className="flex items-end gap-2">
                <span className="heading-md tabular-nums" style={{ color: "var(--text-primary)" }}>{totalHours}</span>
                <span className="body-sm" style={{ color: "var(--text-secondary)" }}>/ {worker.maxHoursWeek}h max</span>
              </div>
              <div className="h-2 rounded-full mt-2" style={{ background: "var(--brand-100)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (totalHours / worker.maxHoursWeek) * 100)}%`,
                    background: totalHours > worker.maxHoursWeek * 0.9 ? "#ef4444" : totalHours > worker.maxHoursWeek * 0.75 ? "#f59e0b" : "#10b981",
                  }}
                />
              </div>
              {totalHours > worker.maxHoursWeek - 4 && (
                <p className="action-xs mt-1" style={{ color: "#f59e0b" }}>
                  {worker.maxHoursWeek - totalHours}h remaining before OT threshold
                </p>
              )}
            </Section>

            {/* Schedule */}
            <Section label="Weekly schedule" icon={<Shield size={12} />}>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day, i) => {
                  const a = workerAssignments.find((as) => as.day === i);
                  const stateColor: Record<string, string> = {
                    assigned: "#10b981",
                    off: "var(--outline-secondary)",
                    leave: "#ef4444",
                    training: "#6366f1",
                    reserve: "#f59e0b",
                    unassigned: "var(--outline-secondary)",
                    conflict: "#ef4444",
                  };
                  return (
                    <div key={day} className="text-center">
                      <div className="action-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{day.slice(0, 1)}</div>
                      <div
                        className="h-6 rounded-sm flex items-center justify-center"
                        style={{ background: `${stateColor[a?.state ?? "off"]}20`, border: `1px solid ${stateColor[a?.state ?? "off"]}40` }}
                        title={`${day}: ${a?.state ?? "off"}${a?.shiftLabel ? ` — ${a.shiftLabel}` : ""}`}
                      >
                        <span style={{ fontSize: "8px", color: stateColor[a?.state ?? "off"], fontWeight: 600 }}>
                          {a?.state === "assigned" ? (a.hours ?? 0) + "h" : a?.state?.charAt(0).toUpperCase() ?? "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Exceptions */}
            {workerExceptions.length > 0 && (
              <Section label={`Exceptions (${workerExceptions.length})`} icon={<span style={{ color: "#f59e0b" }}>⚠</span>}>
                <div className="space-y-2">
                  {workerExceptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-2"
                      style={{
                        background: "rgba(245,158,11,0.06)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: "var(--radius-xs)",
                      }}
                    >
                      <p className="action-xs font-semibold" style={{ color: "var(--text-primary)" }}>{ex.dayLabel} — {ex.type.replace("-", " ")}</p>
                      <p className="body-sm mt-0.5" style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{ex.description}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => onSwap(worker)}
                className="w-full flex items-center gap-2 p-2.5 action-sm transition-colors hover:bg-[var(--brand-100)]"
                style={{ border: "1px solid var(--outline-secondary)", borderRadius: "var(--radius-xs)", color: "var(--text-primary)", background: "transparent" }}
              >
                <RefreshCw size={12} /> Swap with another worker
              </button>
              <button
                onClick={() => onAgencyFill(worker)}
                className="w-full flex items-center gap-2 p-2.5 action-sm transition-colors hover:bg-[var(--brand-100)]"
                style={{ border: "1px solid var(--outline-secondary)", borderRadius: "var(--radius-xs)", color: "var(--text-primary)", background: "transparent" }}
              >
                <UserPlus size={12} /> Fill with agency
              </button>
              <button
                onClick={() => onMarkUnavailable(worker)}
                className="w-full flex items-center gap-2 p-2.5 action-sm transition-colors hover:bg-[var(--brand-100)]"
                style={{ border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-xs)", color: "#ef4444", background: "transparent" }}
              >
                <Ban size={12} /> Mark unavailable
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2" style={{ color: "var(--text-secondary)" }}>
        {icon}
        <span className="label-sm" style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}
