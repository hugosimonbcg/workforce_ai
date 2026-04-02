import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "" : ""}${value.toFixed(decimals)}%`;
}

export function formatDelta(value: number, suffix = ""): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}${suffix}`;
}

export function formatHours(hours: number): string {
  return `${formatNumber(hours)}h`;
}

export const ACTIVITY_COLORS: Record<string, string> = {
  receiving: "#4b91d1",
  putaway: "#7b8bc4",
  picking: "#c9a04f",
  packing: "#52ab32",
  loading: "#e54829",
  fixed: "#9b7ec8",
  reserve: "#546483",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  receiving: "Receiving",
  putaway: "Putaway",
  picking: "Picking",
  packing: "Packing",
  loading: "Outbound Loading",
  fixed: "Fixed / Supervision",
  reserve: "Reserve",
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
