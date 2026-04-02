"use client";

import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  baseline?: string;
  delta?: string;
  deltaDirection?: "positive" | "negative" | "neutral";
  sublabel?: string;
  className?: string;
}

export function KPICard({ label, value, baseline, delta, deltaDirection = "neutral", sublabel, className }: KPICardProps) {
  const deltaColor = deltaDirection === "positive"
    ? "var(--positive)"
    : deltaDirection === "negative"
    ? "var(--negative)"
    : "var(--text-secondary)";

  return (
    <div
      className={cn("p-4", className)}
      style={{
        background: "var(--canvas-surface)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--outline-secondary)",
        boxShadow: "var(--elevation-100)",
      }}
    >
      <p className="label-sm mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p className="heading-lg tabular-nums tracking-tight" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      {(baseline || delta) && (
        <div className="flex items-center gap-2 mt-1">
          {baseline && (
            <span className="body-sm" style={{ color: "var(--text-secondary)" }}>
              vs {baseline}
            </span>
          )}
          {delta && (
            <span className="action-xs" style={{ color: deltaColor }}>
              {delta}
            </span>
          )}
        </div>
      )}
      {sublabel && (
        <p className="body-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}
