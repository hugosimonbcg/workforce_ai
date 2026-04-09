"use client";

import { useMemo } from "react";
import { Users, AlertTriangle } from "lucide-react";
import type { CoverageBucket } from "@/data/types";
import { DAYS } from "@/lib/utils";

interface RequiredRolesPanelProps {
  buckets: CoverageBucket[];
}

const SKILL_COLORS: Record<string, string> = {
  picker: "#f59e0b",
  packer: "#10b981",
  receiver: "#0ea5e9",
  "putaway-op": "#6366f1",
  loader: "#ef4444",
};

interface OpenRole {
  day: number;
  skill: string;
  gapHours: number;
  peakHour: number;
  workerEquivalent: number;
}

export function RequiredRolesPanel({ buckets }: RequiredRolesPanelProps) {
  const openRoles = useMemo(() => {
    const roleMap = new Map<string, { gapHours: number; peakHour: number; peakGap: number }>();
    for (const b of buckets) {
      if (b.gap <= 0) continue;
      const key = `${b.day}-${b.skill}`;
      const existing = roleMap.get(key);
      if (existing) {
        existing.gapHours += b.gap;
        if (b.gap > existing.peakGap) {
          existing.peakHour = b.hour;
          existing.peakGap = b.gap;
        }
      } else {
        roleMap.set(key, { gapHours: b.gap, peakHour: b.hour, peakGap: b.gap });
      }
    }

    const roles: OpenRole[] = [];
    for (const [key, val] of roleMap) {
      const [dayStr, skill] = key.split("-", 2);
      const day = Number(dayStr);
      const skillName = key.slice(dayStr.length + 1);
      roles.push({
        day,
        skill: skillName,
        gapHours: Math.round(val.gapHours * 10) / 10,
        peakHour: val.peakHour,
        workerEquivalent: Math.ceil(val.gapHours / 8),
      });
    }
    return roles.sort((a, b) => b.gapHours - a.gapHours);
  }, [buckets]);

  if (openRoles.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: "var(--text-secondary)" }}>
        <Users size={20} className="mx-auto mb-2 opacity-50" />
        <p className="body-sm">All roles covered — no open staffing needs</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Users size={12} style={{ color: "var(--accent-primary)" }} />
        <span className="label-sm" style={{ color: "var(--text-secondary)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Open required roles ({openRoles.length})
        </span>
      </div>
      {openRoles.map((role) => (
        <div
          key={`${role.day}-${role.skill}`}
          className="flex items-center gap-3 p-2.5"
          style={{
            background: "var(--canvas-default)",
            border: "1px solid var(--outline-secondary)",
            borderRadius: "var(--radius-xs)",
          }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SKILL_COLORS[role.skill] ?? "#888" }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="action-xs font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                {role.skill.replace("-", " ")}
              </span>
              <span className="action-xs" style={{ color: "var(--text-tertiary)" }}>{DAYS[role.day]}</span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
              {role.gapHours}h gap · peak at {role.peakHour}:00 · ~{role.workerEquivalent} worker{role.workerEquivalent > 1 ? "s" : ""} needed
            </div>
          </div>
          <AlertTriangle size={10} style={{ color: role.gapHours > 4 ? "#ef4444" : "#f59e0b" }} />
        </div>
      ))}
    </div>
  );
}
