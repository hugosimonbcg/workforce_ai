import type { AIInsight } from "@/data/mock-data";
import type { AiPreset, AiPresetResponse, NarrativeSource } from "@/lib/ai/types";

export interface MergedPresetResponse extends AiPresetResponse {
  summary: string;
  reasoning: string[];
}

/**
 * Maps a preset (+ optional LLM-polished summary/reasoning) into InsightCard rows.
 */
export function presetResponseToInsights(
  preset: AiPreset,
  merged: MergedPresetResponse,
  narrativeSource: NarrativeSource,
  screen: string,
): AIInsight[] {
  const suffix = narrativeSource === "groq" ? " (polished)" : "";
  const insights: AIInsight[] = [];

  insights.push({
    id: `${preset.id}-summary`,
    type: "summary",
    title: `Summary${suffix}`,
    content: merged.summary,
    sources: merged.sources,
    screen,
  });

  merged.reasoning.forEach((r, i) => {
    insights.push({
      id: `${preset.id}-reason-${i}`,
      type: "explanation",
      title: merged.reasoning.length > 1 ? `Reasoning ${i + 1}` : "Reasoning",
      content: r,
      screen,
    });
  });

  if (merged.lineage.length > 0) {
    insights.push({
      id: `${preset.id}-lineage`,
      type: "explanation",
      title: "Lineage",
      content: merged.lineage.map((l) => `• ${l}`).join("\n"),
      screen,
    });
  }

  insights.push({
    id: `${preset.id}-confidence`,
    type: "explanation",
    title: "Confidence",
    content: `Model confidence for this preset match: **${(merged.confidence * 100).toFixed(0)}%** · Narrative: **${narrativeSource}**${preset.narrativeModelId ? ` · ${preset.narrativeModelId}` : ""}`,
    screen,
  });

  preset.followUps.forEach((fu, i) => {
    insights.push({
      id: `${preset.id}-follow-${i}`,
      type: "action",
      title: fu.label,
      content: `Open related briefing: **${fu.label}**`,
      screen,
      actionPresetId: fu.promptId,
    });
  });

  return insights;
}

export function presetToMergedResponse(preset: AiPreset): MergedPresetResponse {
  return { ...preset.response };
}
