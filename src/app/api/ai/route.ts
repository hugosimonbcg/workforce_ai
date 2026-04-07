import { NextResponse } from "next/server";
import { findPresetById, matchPresetFromQuery } from "@/lib/ai/routing";
import { polishWithGroq } from "@/lib/ai/groq-polish";
import type { AiPresetPayload, NarrativeSource } from "@/lib/ai/types";
import type { MergedPresetResponse } from "@/lib/ai/preset-to-insights";

function toPayload(preset: { id: string; prompt: string; routeTags: string[]; response: MergedPresetResponse; followUps: { label: string; promptId: string }[] }): AiPresetPayload {
  return {
    id: preset.id,
    prompt: preset.prompt,
    routeTags: preset.routeTags,
    response: preset.response,
    followUps: preset.followUps,
  };
}

export async function POST(req: Request) {
  let body: { prompt?: string; routeTag?: string; presetId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "BAD_JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const routeTag = typeof body.routeTag === "string" ? body.routeTag : "recommendation";
  const presetId = typeof body.presetId === "string" ? body.presetId : undefined;

  const preset = presetId ? findPresetById(presetId) : matchPresetFromQuery(prompt, routeTag);
  if (!preset) {
    return NextResponse.json({ ok: false, code: "NO_PRESET" }, { status: 404 });
  }

  const base: MergedPresetResponse = {
    summary: preset.response.summary,
    reasoning: [...preset.response.reasoning],
    confidence: preset.response.confidence,
    sources: [...preset.response.sources],
    lineage: [...preset.response.lineage],
  };

  const apiKey = process.env.GROQ_API_KEY ?? process.env.AI_API_KEY ?? "";
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      code: "NO_API_KEY",
      preset: toPayload(preset),
      mergedResponse: base,
      narrativeSource: "preset" as NarrativeSource,
    });
  }

  try {
    const polished = await polishWithGroq(
      { summary: base.summary, reasoning: base.reasoning },
      apiKey,
    );
    const mergedResponse: MergedPresetResponse = {
      ...base,
      summary: polished.summary,
      reasoning: polished.reasoning,
    };
    const modelId = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
    return NextResponse.json({
      ok: true,
      code: "OK",
      preset: toPayload(preset),
      mergedResponse,
      narrativeSource: "groq" as NarrativeSource,
      narrativeModelId: modelId,
    });
  } catch (e) {
    console.error("[api/ai] Groq error:", e);
    return NextResponse.json({
      ok: false,
      code: "MODEL_ERROR",
      preset: toPayload(preset),
      mergedResponse: base,
      narrativeSource: "preset" as NarrativeSource,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
