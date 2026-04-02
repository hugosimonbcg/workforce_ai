"use client";

import { useAppStore } from "@/lib/store";
import { getInsightsForScreen, type AIInsight } from "@/data/mock-data";
import { Sparkles, ChevronRight, Lightbulb, AlertTriangle, TrendingUp, FileText, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

const typeIcons: Record<string, React.ElementType> = {
  summary: FileText,
  risk: AlertTriangle,
  value: TrendingUp,
  action: Zap,
  explanation: Lightbulb,
};

const typeLabels: Record<string, string> = {
  summary: "Summary",
  risk: "Risk",
  value: "Value",
  action: "Action",
  explanation: "Insight",
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const Icon = typeIcons[insight.type] || Lightbulb;

  return (
    <div
      className="p-3.5 delight-card"
      style={{
        background: "var(--ai-surface)",
        border: "1px solid var(--ai-border)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex items-center justify-center w-5 h-5"
          style={{ background: "var(--ai-accent-soft)", borderRadius: "var(--radius-xs)" }}
        >
          <Icon size={12} style={{ color: "var(--ai-accent)" }} />
        </div>
        <span className="label-sm" style={{ color: "var(--ai-accent)" }}>
          {typeLabels[insight.type]}
        </span>
      </div>
      <h4 className="heading-sm mb-1.5" style={{ color: "var(--text-primary)" }}>
        {insight.title}
      </h4>
      <div
        className="body-sm whitespace-pre-line"
        style={{ color: "var(--text-secondary)" }}
        dangerouslySetInnerHTML={{
          __html: insight.content
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary)">$1</strong>')
            .replace(/\n/g, "<br />"),
        }}
      />
      {insight.sources && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {insight.sources.map((s) => (
            <span
              key={s}
              className="inline-flex items-center px-1.5 py-0.5 action-xs"
              style={{
                background: "var(--ai-accent-soft)",
                color: "var(--ai-accent)",
                borderRadius: "var(--radius-xs)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const suggestedPrompts: Record<string, string[]> = {
  recommendation: [
    "Draft the 30-second executive summary",
    "What are the top 3 sources of value?",
    "What is the biggest remaining risk?",
  ],
  workload: [
    "Where are the pressure windows this week?",
    "Which skills are most constrained?",
    "Turn this workload profile into a scenario",
  ],
  "shift-plan": [
    "Why did the optimizer add early picker coverage?",
    "What happens if OT cap drops to 5%?",
    "Which shift blocks are hardest to staff?",
  ],
  roster: [
    "Summarize the exception queue",
    "Which conflicts matter most?",
    "Suggest alternatives for soft conflicts",
  ],
  scenarios: [
    "Recommend the best scenario for an ops exec",
    "Compare optimized vs demand-spike trade-offs",
    "Write the MDP-ready summary",
  ],
};

export function CopilotRail() {
  const { aiRailOpen, activeScreen } = useAppStore();
  const insights = getInsightsForScreen(activeScreen);
  const prompts = suggestedPrompts[activeScreen] || suggestedPrompts.recommendation;
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {aiRailOpen && (
        <motion.aside
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="h-full shrink-0 overflow-hidden flex flex-col w-[260px] xl:w-[310px]"
          style={{
            borderLeft: "1px solid var(--outline-secondary)",
            background: "var(--canvas-surface)",
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--outline-secondary)" }}
          >
            <Sparkles size={14} style={{ color: "var(--ai-accent)" }} />
            <span className="heading-sm" style={{ color: "var(--text-primary)" }}>
              AI Copilot
            </span>
            <span
              className="action-xs px-1.5 py-0.5 ml-auto"
              style={{
                background: "var(--ai-accent-soft)",
                color: "var(--ai-accent)",
                borderRadius: "var(--radius-xl)",
              }}
            >
              Contextual
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}

            <div className="mt-2">
              <p className="label-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                Ask about this view
              </p>
              <div className="flex flex-col gap-1.5">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    className="flex items-center gap-2 px-3 py-2 text-left body-sm delight-press delight-focus"
                    style={{
                      border: "1px solid var(--ai-border)",
                      color: "var(--text-secondary)",
                      background: "var(--canvas-surface)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <ChevronRight size={11} style={{ color: "var(--ai-accent)" }} />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-3 py-2.5" style={{ borderTop: "1px solid var(--outline-secondary)" }}>
            <p className="body-sm text-center" style={{ color: "var(--text-secondary)" }}>
              Grounded in current scenario data · Deterministic outputs
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
