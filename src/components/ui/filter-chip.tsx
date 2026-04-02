"use client";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  className?: string;
}

export function FilterChip({ label, active, onClick, color, className }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn("action-sm px-2.5 py-1.5 transition-all", className)}
      style={{
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${active ? (color || "var(--accent-primary)") : "var(--outline-secondary)"}`,
        background: active ? (color ? `${color}15` : "var(--accent-primary-soft)") : "transparent",
        color: active ? (color || "var(--accent-primary)") : "var(--text-secondary)",
      }}
    >
      {label}
    </button>
  );
}
