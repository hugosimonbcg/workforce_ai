"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";
import type { CoverageIssue, OperationalIssue } from "@/data/types";
import Link from "next/link";

interface UnresolvedIssuesRailProps {
  coverageIssues: CoverageIssue[];
  operationalIssues: OperationalIssue[];
}

type UnifiedIssue = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  suggestedAction: string;
  jumpTo?: { href: string; label: string };
  source: "coverage" | "operational";
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
const SEVERITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#6b7280",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function screenForIssueType(type: string): { href: string; label: string } {
  switch (type) {
    case "agency-pending":
    case "leave-overlap":
    case "cert-expiry":
      return { href: "/roster", label: "Roster" };
    case "understaffed":
    case "critical-gap":
    case "skill-shortage":
      return { href: "/workload", label: "Workload" };
    case "ot-cap":
    case "ot-creep":
    case "rule-violation":
      return { href: "/shift-plan", label: "Shift Plan" };
    default:
      return { href: "/workload", label: "Workload" };
  }
}

export function UnresolvedIssuesRail({ coverageIssues, operationalIssues }: UnresolvedIssuesRailProps) {
  const unified = useMemo(() => {
    const items: UnifiedIssue[] = [];

    for (const ci of coverageIssues.slice(0, 10)) {
      items.push({
        id: ci.id,
        severity: ci.severity,
        title: `${DAY_LABELS[ci.day]} ${ci.hour}:00 — ${ci.skill} gap`,
        description: ci.description,
        suggestedAction: ci.suggestedAction,
        jumpTo: screenForIssueType(ci.type),
        source: "coverage",
      });
    }

    for (const oi of operationalIssues) {
      items.push({
        id: oi.id,
        severity: oi.severity,
        title: oi.title,
        description: oi.description,
        suggestedAction: oi.suggestedAction,
        jumpTo: screenForIssueType(oi.type),
        source: "operational",
      });
    }

    return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [coverageIssues, operationalIssues]);

  const grouped = useMemo(() => {
    const groups: Record<string, UnifiedIssue[]> = { high: [], medium: [], low: [] };
    for (const item of unified) groups[item.severity].push(item);
    return groups;
  }, [unified]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} style={{ color: "#ef4444" }} />
        <span className="action-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Unresolved Issues ({unified.length})
        </span>
      </div>

      {/* Severity summary */}
      <div className="flex items-center gap-3">
        {(["high", "medium", "low"] as const).map((sev) => (
          <span key={sev} className="flex items-center gap-1 action-xs" style={{ color: SEVERITY_COLORS[sev] }}>
            <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[sev] }} />
            {grouped[sev].length} {sev}
          </span>
        ))}
      </div>

      {/* Issue groups */}
      {(["high", "medium", "low"] as const).map((sev) => {
        const items = grouped[sev];
        if (items.length === 0) return null;
        return (
          <div key={sev}>
            <div
              className="action-xs font-semibold mb-2 px-2 py-1"
              style={{
                color: SEVERITY_COLORS[sev],
                background: `${SEVERITY_COLORS[sev]}10`,
                borderRadius: "var(--radius-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {sev} ({items.length})
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5"
                  style={{
                    background: "var(--canvas-default)",
                    border: `1px solid ${SEVERITY_COLORS[item.severity]}20`,
                    borderRadius: "var(--radius-xs)",
                  }}
                >
                  <p className="action-xs font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p style={{ fontSize: "10px", color: "var(--text-secondary)", lineHeight: 1.4 }}>{item.description}</p>
                  <p className="mt-1" style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                    <ArrowRight size={8} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} />
                    {item.suggestedAction}
                  </p>
                  {item.jumpTo && (
                    <Link
                      href={item.jumpTo.href}
                      className="flex items-center gap-1 mt-1.5 action-xs"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      <ExternalLink size={8} /> Jump to {item.jumpTo.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
