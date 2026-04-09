"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { PlanConstraints } from "@/data/types";

interface ConstraintEditorPanelProps {
  constraints: PlanConstraints;
  onChange: (patch: Partial<PlanConstraints>) => void;
  baselineConstraints: PlanConstraints;
}

interface SliderConfig {
  key: keyof PlanConstraints;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SLIDERS: SliderConfig[] = [
  { key: "otCapPercent", label: "OT cap", min: 0, max: 25, step: 1, unit: "%" },
  { key: "agencyCapPercent", label: "Agency cap", min: 0, max: 30, step: 1, unit: "%" },
  { key: "slaMissTarget", label: "SLA miss target", min: 0.5, max: 5, step: 0.5, unit: "%" },
  { key: "shiftMinHours", label: "Min shift", min: 3, max: 8, step: 1, unit: "h" },
  { key: "shiftMaxHours", label: "Max shift", min: 6, max: 12, step: 1, unit: "h" },
  { key: "shiftStartEarliest", label: "Earliest start", min: 4, max: 10, step: 1, unit: ":00" },
  { key: "shiftStartLatest", label: "Latest start", min: 10, max: 18, step: 1, unit: ":00" },
  { key: "maxConsecutiveDays", label: "Max consecutive", min: 4, max: 7, step: 1, unit: " days" },
];

export function ConstraintEditorPanel({ constraints, onChange, baselineConstraints }: ConstraintEditorPanelProps) {
  const [open, setOpen] = useState(false);

  const hasChanges = SLIDERS.some((s) => constraints[s.key] !== baselineConstraints[s.key]);

  return (
    <div
      style={{
        background: "var(--canvas-surface)",
        border: "1px solid var(--outline-secondary)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--brand-100)]"
        style={{ borderRadius: "var(--radius-sm)" }}
      >
        <div className="flex items-center gap-2">
          <Settings size={14} style={{ color: "var(--accent-primary)" }} />
          <span className="action-sm" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Constraints</span>
          {hasChanges && (
            <span
              className="action-xs px-1.5 py-0.5"
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "#f59e0b",
                borderRadius: "var(--radius-xs)",
                fontWeight: 600,
              }}
            >
              Modified
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} style={{ color: "var(--text-secondary)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-secondary)" }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                {SLIDERS.map((slider) => {
                  const value = constraints[slider.key];
                  const baseline = baselineConstraints[slider.key];
                  const changed = value !== baseline;
                  return (
                    <div key={slider.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="label-sm" style={{ color: changed ? "var(--accent-primary)" : "var(--text-secondary)", fontSize: "10px" }}>
                          {slider.label}
                        </label>
                        <span
                          className="tabular-nums"
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: changed ? "var(--accent-primary)" : "var(--text-primary)",
                          }}
                        >
                          {value}{slider.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={value}
                        onChange={(e) => onChange({ [slider.key]: Number(e.target.value) })}
                        className="w-full h-1.5 accent-[var(--accent-primary)]"
                        style={{ cursor: "pointer" }}
                      />
                      {changed && (
                        <div style={{ fontSize: "9px", color: "var(--text-tertiary)", marginTop: 2 }}>
                          was {baseline}{slider.unit}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {hasChanges && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onChange({ ...baselineConstraints })}
                    className="action-xs px-2 py-1"
                    style={{
                      border: "1px solid var(--outline-secondary)",
                      borderRadius: "var(--radius-xs)",
                      color: "var(--text-secondary)",
                      background: "transparent",
                    }}
                  >
                    Reset to baseline
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
