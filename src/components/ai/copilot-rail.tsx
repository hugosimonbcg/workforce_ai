"use client";

import { useAppStore } from "@/lib/store";
import { getInsightsForScreen, type AIInsight } from "@/data/mock-data";
import { SUGGESTED_PROMPT_TO_PRESET_ID } from "@/data/ai-presets";
import { findPresetById } from "@/lib/ai/routing";
import { presetResponseToInsights } from "@/lib/ai/preset-to-insights";
import type { MergedPresetResponse } from "@/lib/ai/preset-to-insights";
import type { NarrativeSource } from "@/lib/ai/types";
import {
  Sparkles,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  FileText,
  Zap,
  SendHorizontal,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

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

function InsightCard({
  insight,
  onOpenPreset,
}: {
  insight: AIInsight;
  onOpenPreset?: (presetId: string) => void;
}) {
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
      {insight.type === "action" && insight.actionPresetId && onOpenPreset && (
        <button
          type="button"
          onClick={() => onOpenPreset(insight.actionPresetId!)}
          className="mt-2.5 px-2.5 py-1.5 action-sm delight-press delight-focus w-full text-left"
          style={{
            background: "var(--ai-accent-soft)",
            color: "var(--ai-accent)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--ai-border)",
          }}
        >
          Open briefing
        </button>
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

type ApiAiJson = {
  ok: boolean;
  code?: string;
  preset?: { id: string };
  mergedResponse?: MergedPresetResponse;
  narrativeSource?: NarrativeSource;
  narrativeModelId?: string;
  error?: string;
};

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function chatId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function CopilotRail({ embedded = false }: { embedded?: boolean } = {}) {
  const {
    aiRailOpen,
    activeScreen,
    aiRailInsights,
    aiPhase,
    aiNarrativeSource,
    openAiPreset,
    hydrateAiCopilot,
    setAiPhase,
  } = useAppStore();
  const insights = aiRailInsights ?? getInsightsForScreen(activeScreen);
  const prompts = suggestedPrompts[activeScreen] || suggestedPrompts.recommendation;
  const [mounted, setMounted] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const chatInFlight = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setChatMessages([]);
    setChatInput("");
  }, [activeScreen]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages]);

  const runAiQuery = React.useCallback(
    async (prompt: string, presetId?: string): Promise<{ ok: boolean; summary?: string }> => {
      setAiPhase("thinking");
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, routeTag: activeScreen, presetId }),
        });
        const data = (await res.json()) as ApiAiJson;
        if (data.preset?.id && data.mergedResponse) {
          const preset = findPresetById(data.preset.id);
          if (preset) {
            const source: NarrativeSource = data.narrativeSource === "groq" ? "groq" : "preset";
            const nextInsights = presetResponseToInsights(preset, data.mergedResponse, source, activeScreen);
            hydrateAiCopilot(nextInsights, source, data.preset.id);
            return { ok: true, summary: data.mergedResponse.summary };
          }
        }
        if (presetId) {
          openAiPreset(presetId);
          const p = findPresetById(presetId);
          return { ok: true, summary: p?.response.summary ?? "See the briefing cards above." };
        }
        setAiPhase("idle");
        return { ok: false };
      } catch {
        if (presetId) {
          openAiPreset(presetId);
          const p = findPresetById(presetId);
          return { ok: true, summary: p?.response.summary ?? "See the briefing cards above." };
        }
        setAiPhase("idle");
        return { ok: false };
      }
    },
    [activeScreen, hydrateAiCopilot, openAiPreset, setAiPhase],
  );

  const handleSuggestedPrompt = React.useCallback(
    async (prompt: string) => {
      const presetId = SUGGESTED_PROMPT_TO_PRESET_ID[prompt];
      await runAiQuery(prompt, presetId);
    },
    [runAiQuery],
  );

  const handleChatSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = chatInput.trim();
      if (!text || aiPhase === "thinking" || chatInFlight.current) return;
      chatInFlight.current = true;
      setChatInput("");
      setChatMessages((prev) => [...prev, { id: chatId(), role: "user", content: text }]);
      try {
        const result = await runAiQuery(text);
        if (result.ok && result.summary) {
          const reply = result.summary;
          setChatMessages((prev) => [
            ...prev,
            {
              id: chatId(),
              role: "assistant",
              content: reply,
            },
          ]);
        } else {
          setChatMessages((prev) => [
            ...prev,
            {
              id: chatId(),
              role: "assistant",
              content:
                "I couldn’t match that to this screen’s briefing library. Try rephrasing, use a suggested prompt, or ask about risks, costs, or shifts for this view.",
            },
          ]);
        }
      } finally {
        chatInFlight.current = false;
      }
    },
    [aiPhase, chatInput, runAiQuery],
  );

  const thinking = aiPhase === "thinking";

  const footerText =
    aiNarrativeSource === "groq"
      ? "Summary wording polished by model · Facts and numbers stay on scenario seed data"
      : aiNarrativeSource === "preset"
        ? "Preset narrative from seed data · No generative facts added"
        : "Grounded in current scenario data · Deterministic outputs";

  if (!mounted) return null;

  const railContent = (
    <>
      {!embedded && (
        <div
          className="px-4 py-3 flex items-center gap-2 shrink-0"
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
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onOpenPreset={openAiPreset} />
        ))}

        <div className="mt-2">
          <p className="label-sm mb-2" style={{ color: "var(--text-secondary)" }}>
            Ask about this view
          </p>
          <div className="flex flex-col gap-1.5">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={thinking}
                onClick={() => void handleSuggestedPrompt(prompt)}
                className="flex items-center gap-2 px-3 py-2 text-left body-sm delight-press delight-focus disabled:opacity-50"
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

      <div
        className="shrink-0 px-3 pt-2 pb-2 flex flex-col gap-2 border-t"
        style={{ borderColor: "var(--outline-secondary)" }}
      >
        <p className="label-sm" style={{ color: "var(--text-secondary)" }}>
          Chat
        </p>
        {chatMessages.length > 0 && (
          <div
            className="max-h-[140px] overflow-y-auto space-y-2 rounded-md px-2 py-2"
            style={{ background: "var(--brand-100)" }}
          >
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[95%] rounded-lg px-2.5 py-1.5 body-sm whitespace-pre-wrap break-words",
                    m.role === "user"
                      ? "rounded-br-sm"
                      : "rounded-bl-sm",
                  )}
                  style={{
                    background:
                      m.role === "user" ? "var(--ai-accent-soft)" : "var(--canvas-surface)",
                    color: m.role === "user" ? "var(--ai-accent)" : "var(--text-primary)",
                    border:
                      m.role === "assistant" ? "1px solid var(--ai-border)" : undefined,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
        <form onSubmit={(e) => void handleChatSubmit(e)} className="flex gap-2 items-end">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleChatSubmit();
              }
            }}
            rows={2}
            placeholder="Ask a question…"
            disabled={thinking}
            className="flex-1 min-w-0 resize-none rounded-md px-2.5 py-2 body-sm outline-none focus-visible:ring-2 disabled:opacity-50"
            style={{
              background: "var(--canvas-surface)",
              border: "1px solid var(--ai-border)",
              color: "var(--text-primary)",
              boxShadow: "none",
            }}
            aria-label="Message to AI Copilot"
          />
          <button
            type="submit"
            disabled={thinking || !chatInput.trim()}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-md delight-press delight-focus disabled:opacity-40"
            style={{
              background: "var(--ai-accent)",
              color: "var(--text-inverse)",
            }}
            aria-label="Send message"
          >
            {thinking ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
          </button>
        </form>
      </div>

      <div
        className="px-3 py-2.5 shrink-0"
        style={{ borderTop: "1px solid var(--outline-secondary)" }}
      >
        <p className="body-sm text-center" style={{ color: "var(--text-secondary)" }}>
          {footerText}
        </p>
      </div>
    </>
  );

  if (embedded) {
    return <div className="h-full flex flex-col">{railContent}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      {aiRailOpen && (
        <motion.aside
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="h-full min-h-0 shrink-0 overflow-hidden flex flex-col w-[260px] xl:w-[310px]"
          style={{
            borderLeft: "1px solid var(--outline-secondary)",
            background: "var(--canvas-surface)",
          }}
        >
          {railContent}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
