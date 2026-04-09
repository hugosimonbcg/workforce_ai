"use client";

import { useRef, useCallback, useState } from "react";
import { Lock, Copy, Trash2, MoreHorizontal, Plus, Minus, Repeat } from "lucide-react";
import type { ShiftBlock, ShiftType } from "@/data/types";

interface ShiftBlockEditorProps {
  shift: ShiftBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, patch: Partial<ShiftBlock>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleLock: (id: string) => void;
  timelineStart?: number;
  timelineEnd?: number;
  hasGap?: boolean;
  validationError?: string | null;
}

const SKILL_COLORS: Record<string, string> = {
  picker: "#f59e0b",
  packer: "#10b981",
  receiver: "#0ea5e9",
  "putaway-op": "#6366f1",
  loader: "#ef4444",
};

const TYPE_STYLES: Record<ShiftType, { border: string; bg: string; pattern?: string }> = {
  "permanent-template": { border: "solid", bg: "1" },
  agency: { border: "dashed", bg: "0.6" },
  overtime: { border: "solid", bg: "0.8", pattern: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 6px)" },
  reserve: { border: "dotted", bg: "0.3" },
};

export function ShiftBlockEditor({
  shift,
  isSelected,
  onSelect,
  onUpdate,
  onDuplicate,
  onRemove,
  onToggleLock,
  timelineStart = 6,
  timelineEnd = 22,
  hasGap = false,
  validationError = null,
}: ShiftBlockEditorProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState<"left" | "right" | null>(null);

  const totalHours = timelineEnd - timelineStart;
  const leftPct = ((shift.startHour - timelineStart) / totalHours) * 100;
  const widthPct = ((shift.endHour - shift.startHour) / totalHours) * 100;

  const color = SKILL_COLORS[shift.skill] ?? "#888";
  const typeStyle = TYPE_STYLES[shift.shiftType];

  const handleDragStart = useCallback(
    (edge: "left" | "right") => (e: React.MouseEvent) => {
      if (shift.locked) return;
      e.stopPropagation();
      setDragging(edge);

      const startX = e.clientX;
      const container = barRef.current?.parentElement;
      if (!container) return;
      const containerWidth = container.getBoundingClientRect().width;
      const hourWidth = containerWidth / totalHours;

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX;
        const dHours = Math.round(dx / hourWidth);
        if (dHours === 0) return;

        if (edge === "left") {
          const newStart = Math.max(timelineStart, Math.min(shift.endHour - 1, shift.startHour + dHours));
          if (newStart !== shift.startHour) onUpdate(shift.id, { startHour: newStart });
        } else {
          const newEnd = Math.min(timelineEnd, Math.max(shift.startHour + 1, shift.endHour + dHours));
          if (newEnd !== shift.endHour) onUpdate(shift.id, { endHour: newEnd });
        }
      };

      const onUp = () => {
        setDragging(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [shift, onUpdate, totalHours, timelineStart, timelineEnd]
  );

  const changeCount = (delta: number) => {
    if (shift.locked) return;
    const next = Math.max(1, shift.workerCount + delta);
    onUpdate(shift.id, { workerCount: next });
  };

  const cycleType = () => {
    if (shift.locked) return;
    const types: ShiftType[] = ["permanent-template", "agency", "overtime", "reserve"];
    const idx = types.indexOf(shift.shiftType);
    onUpdate(shift.id, { shiftType: types[(idx + 1) % types.length] });
  };

  return (
    <div className="relative" style={{ height: 36 }}>
      <div
        ref={barRef}
        onClick={onSelect}
        className="absolute top-0 flex items-center cursor-pointer transition-shadow group"
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          height: "100%",
          background: typeStyle.pattern
            ? `${typeStyle.pattern}, ${color}`
            : color,
          opacity: Number(typeStyle.bg),
          borderStyle: typeStyle.border,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? "var(--accent-primary)" : `${color}60`,
          borderRadius: "var(--radius-xs)",
          boxShadow: isSelected ? `0 0 0 2px var(--accent-primary)40` : hasGap ? "inset 0 -2px 0 0 #ef4444" : "none",
          minWidth: 60,
          zIndex: isSelected ? 10 : 1,
          overflow: "hidden",
        }}
      >
        {/* Drag handles */}
        {!shift.locked && (
          <>
            <div
              onMouseDown={handleDragStart("left")}
              className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-20"
              style={{ borderRadius: "var(--radius-xs) 0 0 var(--radius-xs)" }}
            />
            <div
              onMouseDown={handleDragStart("right")}
              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-20"
              style={{ borderRadius: "0 var(--radius-xs) var(--radius-xs) 0" }}
            />
          </>
        )}

        {/* Content */}
        <div className="flex items-center gap-1 px-2 w-full overflow-hidden" style={{ fontSize: "10px", color: "white", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
          {shift.locked && <Lock size={8} className="shrink-0" />}
          <span className="truncate">{shift.label}</span>
          <span className="shrink-0 opacity-80">{shift.workerCount}w</span>
          <span className="shrink-0 opacity-70">{shift.startHour}–{shift.endHour}</span>
        </div>

        {/* Headcount controls */}
        {isSelected && !shift.locked && (
          <div className="absolute -top-1 right-6 flex items-center gap-0.5 z-30" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => changeCount(-1)} className="w-4 h-4 flex items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white">
              <Minus size={8} />
            </button>
            <button onClick={() => changeCount(1)} className="w-4 h-4 flex items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white">
              <Plus size={8} />
            </button>
          </div>
        )}

        {/* Context menu trigger */}
        {isSelected && (
          <div className="absolute -top-1 right-0 z-30" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white"
            >
              <MoreHorizontal size={10} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-6 py-1 min-w-[120px] z-50"
                style={{
                  background: "var(--canvas-surface)",
                  border: "1px solid var(--outline-secondary)",
                  borderRadius: "var(--radius-xs)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <MenuBtn icon={<Copy size={10} />} label="Duplicate" onClick={() => { onDuplicate(shift.id); setMenuOpen(false); }} />
                <MenuBtn icon={<Repeat size={10} />} label={`Type: ${shift.shiftType.replace("-", " ")}`} onClick={() => { cycleType(); setMenuOpen(false); }} />
                <MenuBtn icon={<Lock size={10} />} label={shift.locked ? "Unlock" : "Lock"} onClick={() => { onToggleLock(shift.id); setMenuOpen(false); }} />
                {!shift.locked && (
                  <MenuBtn icon={<Trash2 size={10} />} label="Remove" onClick={() => { onRemove(shift.id); setMenuOpen(false); }} danger />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation error tooltip */}
      {validationError && isSelected && (
        <div
          className="absolute -bottom-6 left-0 px-2 py-0.5 z-50"
          style={{
            background: "rgba(239,68,68,0.95)",
            color: "white",
            fontSize: "9px",
            fontWeight: 600,
            borderRadius: "var(--radius-xs)",
            whiteSpace: "nowrap",
          }}
        >
          {validationError}
        </div>
      )}
    </div>
  );
}

function MenuBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--brand-100)] transition-colors"
      style={{
        color: danger ? "#ef4444" : "var(--text-primary)",
        fontSize: "11px",
        textAlign: "left",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
