"use client";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function SectionCard({ children, className, padding = "lg" }: SectionCardProps) {
  return (
    <div
      className={cn(paddingMap[padding], "delight-card", className)}
      style={{
        background: "var(--canvas-surface)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--outline-secondary)",
      }}
    >
      {children}
    </div>
  );
}
