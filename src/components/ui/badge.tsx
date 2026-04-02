"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "green" | "red" | "yellow" | "turquoise" | "neutral" | "brand";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: "var(--brand-100)", color: "var(--text-secondary)" },
  green: { bg: "var(--bg-green-tertiary)", color: "var(--text-green)" },
  red: { bg: "var(--bg-red-tertiary)", color: "var(--text-red)" },
  yellow: { bg: "var(--bg-yellow-tertiary)", color: "var(--text-yellow)" },
  turquoise: { bg: "var(--bg-turquoise-tertiary)", color: "var(--text-turquoise)" },
  neutral: { bg: "var(--bg-neutral-tertiary)", color: "var(--text-neutral)" },
  brand: { bg: "var(--bg-brand-secondary)", color: "var(--brand-600)" },
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={cn("inline-flex items-center px-1.5 py-0.5 action-xs", className)}
      style={{
        background: styles.bg,
        color: styles.color,
        borderRadius: "var(--radius-xs)",
      }}
    >
      {children}
    </span>
  );
}
