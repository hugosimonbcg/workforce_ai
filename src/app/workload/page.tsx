"use client";

import { ScreenWrapper } from "@/components/layout/screen-wrapper";
import { SectionCard } from "@/components/ui/section-card";
import { SectionHeader } from "@/components/ui/section-header";
import { planContext } from "@/data/mock-data";
import { DAYS, ACTIVITY_COLORS, ACTIVITY_LABELS, formatNumber, formatHours } from "@/lib/utils";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const tooltipStyle = {
  background: "var(--canvas-surface)",
  border: "1px solid var(--outline-secondary)",
  borderRadius: "var(--radius-sm)",
  fontSize: 12,
  fontFamily: '"Roboto", sans-serif',
};

export default function WorkloadPage() {
  const { demand, laborStandards, fixedWorkload, activities } = planContext;
  const [activeActivities, setActiveActivities] = useState<Set<string>>(
    new Set(activities.map(a => a.id))
  );

  const toggleActivity = (id: string) => {
    setActiveActivities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const heatmapData: { day: number; hour: number; value: number }[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour <= 22; hour++) {
      const val = demand
        .filter(d => d.day === day && d.hour === hour && activeActivities.has(d.activity))
        .reduce((sum, d) => sum + d.laborHours, 0);
      heatmapData.push({ day, hour, value: Math.round(val * 10) / 10 });
    }
  }
  const maxHeat = Math.max(...heatmapData.map(h => h.value));

  const activityMix = activities.map(a => {
    const total = demand.filter(d => d.activity === a.id).reduce((sum, d) => sum + d.laborHours, 0);
    return { ...a, totalHours: Math.round(total) };
  }).sort((a, b) => b.totalHours - a.totalHours);

  const totalDemandHours = activityMix.reduce((s, a) => s + a.totalHours, 0);

  const dailyByActivity = DAYS.map((day, i) => {
    const row: Record<string, number | string> = { day };
    for (const act of activities) {
      row[act.id] = Math.round(demand.filter(d => d.day === i && d.activity === act.id).reduce((sum, d) => sum + d.laborHours, 0));
    }
    return row;
  });

  const skillHours = activities.map(a => {
    const ls = laborStandards.find(l => l.activity === a.id);
    const totalUnits = demand.filter(d => d.activity === a.id).reduce((sum, d) => sum + d.units, 0);
    const totalLH = demand.filter(d => d.activity === a.id).reduce((sum, d) => sum + d.laborHours, 0);
    const peakHourDemand = Math.max(...Array.from({ length: 7 }, (_, day) =>
      Math.max(...Array.from({ length: 17 }, (_, h) =>
        demand.filter(d => d.day === day && d.hour === h + 6 && d.activity === a.id).reduce((sum, d) => sum + d.laborHours, 0)
      ))
    ));
    return {
      activity: a.name, skill: a.skill, color: a.color,
      unitsPerHour: ls?.unitsPerHour || 0,
      totalUnits: Math.round(totalUnits),
      totalLaborHours: Math.round(totalLH),
      peakWorkerEquivalent: Math.round(peakHourDemand * 10) / 10,
    };
  });

  const totalFixedHours = fixedWorkload.reduce((s, f) => s + f.totalHours, 0);

  return (
    <ScreenWrapper screenId="workload" defaultAiOpen={false}>
      <div className="p-6 space-y-6">

        {/* AI Insight Card */}
        <div
          className="p-4 flex items-start gap-3"
          style={{
            background: "var(--ai-surface)",
            border: "1px solid var(--ai-border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: "var(--ai-accent)" }} />
          <div>
            <p className="action-sm mb-0.5" style={{ color: "var(--ai-accent)" }}>Workload Insight</p>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Tue–Fri 10:00 to 15:00</strong> drives 62% of weekly picking demand and 58% of packing demand. This 20-hour window is why the recommended plan adds earlier picker coverage starting at 07:00 and staggers packer blocks.
            </p>
          </div>
        </div>

        {/* Activity Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="body-sm font-medium mr-1" style={{ color: "var(--text-secondary)" }}>Activities:</span>
          {activities.map(a => (
            <button
              key={a.id}
              onClick={() => toggleActivity(a.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 action-sm transition-all"
              style={{
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${activeActivities.has(a.id) ? a.color : "var(--outline-secondary)"}`,
                background: activeActivities.has(a.id) ? `${a.color}15` : "transparent",
                color: activeActivities.has(a.id) ? a.color : "var(--text-secondary)",
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: a.color, opacity: activeActivities.has(a.id) ? 1 : 0.3 }} />
              {a.name}
            </button>
          ))}
        </div>

        {/* Heatmap */}
        <SectionCard>
          <SectionHeader
            title="Demand Heatmap"
            subtitle={`Labor hours required by day and hour · ${formatHours(totalDemandHours)} total demand`}
          />
          <div className="overflow-x-auto">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: "48px repeat(17, 1fr)", minWidth: "700px" }}>
              <div />
              {Array.from({ length: 17 }, (_, i) => (
                <div key={i} className="text-center py-1 label-sm" style={{ color: "var(--text-secondary)" }}>
                  {(i + 6).toString().padStart(2, "0")}
                </div>
              ))}
              {DAYS.map((day, di) => (
                <>
                  <div key={`label-${di}`} className="body-sm font-medium flex items-center" style={{ color: "var(--text-primary)" }}>
                    {day}
                  </div>
                  {Array.from({ length: 17 }, (_, hi) => {
                    const cell = heatmapData.find(h => h.day === di && h.hour === hi + 6);
                    const intensity = cell && maxHeat > 0 ? cell.value / maxHeat : 0;
                    return (
                      <div
                        key={`${di}-${hi}`}
                        className="aspect-[2/1] flex items-center justify-center action-xs relative group cursor-default"
                        style={{
                          borderRadius: "var(--radius-2xs)",
                          background: intensity > 0
                            ? `rgba(54, 158, 168, ${0.08 + intensity * 0.72})`
                            : "var(--brand-100)",
                          color: intensity > 0.5 ? "white" : "var(--text-secondary)",
                        }}
                        title={`${day} ${hi + 6}:00 — ${cell?.value || 0}h`}
                      >
                        {cell && cell.value > 0 ? cell.value.toFixed(0) : ""}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="body-sm" style={{ color: "var(--text-secondary)" }}>Low</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                <div key={v} className="w-4 h-2" style={{ background: `rgba(54, 158, 168, ${0.08 + v * 0.72})`, borderRadius: "var(--radius-2xs)" }} />
              ))}
            </div>
            <span className="body-sm" style={{ color: "var(--text-secondary)" }}>High</span>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard>
            <SectionHeader title="Daily Labor Hours by Activity" subtitle="Stacked labor demand across the week" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyByActivity} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: '"Roboto", sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: '"Roboto", sans-serif' }} tickFormatter={(v) => `${v}h`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [`${value}h`, ACTIVITY_LABELS[String(name)] || name]}
                />
                {activities.map(a => (
                  <Bar key={a.id} dataKey={a.id} stackId="a" fill={a.color} radius={a.id === "loading" ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard>
            <SectionHeader title="Workload Mix" subtitle="Weekly labor hours by activity" />
            <div className="space-y-3">
              {activityMix.map(a => {
                const pct = (a.totalHours / totalDemandHours) * 100;
                return (
                  <div key={a.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5" style={{ background: a.color, borderRadius: "var(--radius-2xs)" }} />
                        <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                      </div>
                      <span className="body-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {formatNumber(a.totalHours)}h <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--brand-100)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Demand to Labor Translation */}
        <SectionCard>
          <SectionHeader
            title="Demand → Labor Translation"
            subtitle="How demand volume translates into required skill-hours and peak worker-equivalents"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-secondary)" }}>
                  {["Activity", "Skill", "Units/hr", "Total units", "Labor hours", "Peak workers"].map(h => (
                    <th key={h} className="label-sm py-2 px-3" style={{ color: "var(--text-secondary)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skillHours.map((s) => (
                  <tr key={s.activity} style={{ borderBottom: "1px solid var(--brand-100)" }}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2" style={{ background: s.color, borderRadius: "var(--radius-2xs)" }} />
                        <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.activity}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 body-sm capitalize" style={{ color: "var(--text-secondary)" }}>{s.skill}</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{s.unitsPerHour}</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{formatNumber(s.totalUnits)}</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>{formatNumber(s.totalLaborHours)}h</td>
                    <td className="py-2.5 px-3 body-sm tabular-nums font-semibold" style={{ color: s.peakWorkerEquivalent > 6 ? "var(--warning)" : "var(--text-primary)" }}>
                      {s.peakWorkerEquivalent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Fixed Workload */}
        <SectionCard>
          <SectionHeader
            title="Fixed Workload"
            subtitle={`Non-demand-driven roles required for facility operation · ${formatHours(totalFixedHours)} total`}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {fixedWorkload.map((fw) => (
              <div
                key={fw.role}
                className="p-3"
                style={{
                  background: "var(--brand-100)",
                  border: "1px solid var(--outline-secondary)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: ACTIVITY_COLORS.fixed }} />
                  <span className="body-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fw.role}</span>
                </div>
                <p className="heading-md tabular-nums" style={{ color: "var(--text-primary)" }}>{formatHours(fw.totalHours)}</p>
                <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
                  {fw.hoursPerDay}h/day · {fw.daysRequired.length} days
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Bridge to Plan */}
        <Link
          href="/shift-plan"
          className="flex items-center justify-between p-5 transition-opacity hover:opacity-90"
          style={{
            background: "var(--canvas-surface)",
            border: "1px solid var(--outline-secondary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div>
            <h3 className="heading-sm mb-1" style={{ color: "var(--text-primary)" }}>
              How does this workload map to shift architecture?
            </h3>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              See how the optimizer translates demand peaks into shift blocks, skill coverage, and worker allocation.
            </p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--accent-primary)" }} />
        </Link>

      </div>
    </ScreenWrapper>
  );
}
