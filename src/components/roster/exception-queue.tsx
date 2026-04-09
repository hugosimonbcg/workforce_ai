"use client";

import { useState } from "react";
import { AlertTriangle, Check, RefreshCw, ArrowUpRight } from "lucide-react";
import type { RosterException } from "@/data/types";

interface ExceptionQueueProps {
  exceptions: RosterException[];
  onResolve: (id: string) => void;
  onSwap: (ex: RosterException) => void;
  onEscalate: (ex: RosterException) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6b7280",
};

export function ExceptionQueue({ exceptions, onResolve, onSwap, onEscalate }: ExceptionQueueProps) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const handleResolve = (id: string) => {
    setResolved((prev) => new Set(prev).add(id));
    onResolve(id);
  };

  const sorted = [...exceptions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return (
    <div className="space-y-2">
      {sorted.map((ex) => {
        const isResolved = resolved.has(ex.id);
        return (
          <div
            key={ex.id}
            className="p-3 transition-all"
            style={{
              background: isResolved ? "rgba(16,185,129,0.06)" : "var(--canvas-default)",
              border: `1px solid ${isResolved ? "rgba(16,185,129,0.2)" : `${SEVERITY_COLORS[ex.severity]}30`}`,
              borderRadius: "var(--radius-xs)",
              opacity: isResolved ? 0.6 : 1,
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={12}
                className="mt-0.5 shrink-0"
                style={{ color: isResolved ? "#10b981" : SEVERITY_COLORS[ex.severity] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="action-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {ex.workerName}
                  </span>
                  <span className="action-xs px-1.5 py-0.5" style={{ background: `${SEVERITY_COLORS[ex.severity]}15`, color: SEVERITY_COLORS[ex.severity], borderRadius: "var(--radius-xs)", fontWeight: 600, textTransform: "capitalize" }}>
                    {ex.severity}
                  </span>
                  <span className="action-xs" style={{ color: "var(--text-tertiary)" }}>{ex.dayLabel}</span>
                  {isResolved && (
                    <span className="action-xs px-1.5 py-0.5" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: "var(--radius-xs)", fontWeight: 600 }}>
                      Resolved
                    </span>
                  )}
                </div>
                <p className="body-sm" style={{ color: "var(--text-secondary)" }}>{ex.description}</p>
                <p className="body-sm mt-0.5" style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>{ex.suggestion}</p>
              </div>
            </div>
            {!isResolved && (
              <div className="flex items-center gap-2 mt-2 ml-5">
                <button
                  onClick={() => handleResolve(ex.id)}
                  className="flex items-center gap-1 px-2 py-1 action-xs transition-colors"
                  style={{ border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-xs)", color: "#10b981", background: "transparent" }}
                >
                  <Check size={10} /> Resolve
                </button>
                <button
                  onClick={() => onSwap(ex)}
                  className="flex items-center gap-1 px-2 py-1 action-xs transition-colors"
                  style={{ border: "1px solid var(--outline-secondary)", borderRadius: "var(--radius-xs)", color: "var(--text-secondary)", background: "transparent" }}
                >
                  <RefreshCw size={10} /> Swap
                </button>
                <button
                  onClick={() => onEscalate(ex)}
                  className="flex items-center gap-1 px-2 py-1 action-xs transition-colors"
                  style={{ border: "1px solid var(--outline-secondary)", borderRadius: "var(--radius-xs)", color: "var(--text-secondary)", background: "transparent" }}
                >
                  <ArrowUpRight size={10} /> Escalate
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
