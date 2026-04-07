import { AI_PRESETS } from "@/data/ai-presets";
import type { AiPreset } from "@/lib/ai/types";

const byId = new Map<string, AiPreset>(AI_PRESETS.map((p) => [p.id, p]));

export function findPresetById(id: string): AiPreset | undefined {
  return byId.get(id);
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Filter by routeTag, then: prefix match on preset.prompt, then keyword match (higher priority first), else generic for route.
 */
export function matchPresetFromQuery(query: string, routeTag: string): AiPreset | undefined {
  const q = normalize(query);
  if (!q) {
    return genericForRoute(routeTag);
  }

  const scoped = AI_PRESETS.filter((p) => p.routeTags.includes(routeTag));
  if (scoped.length === 0) {
    return undefined;
  }

  const promptNorm = (p: AiPreset) => normalize(p.prompt);

  // (a) Prefix: user query starts with preset prompt or preset prompt starts with query
  const prefixHit = scoped.find((p) => {
    const pn = promptNorm(p);
    return q.startsWith(pn) || pn.startsWith(q);
  });
  if (prefixHit) {
    return prefixHit;
  }

  // (b) Keyword rules — higher matchPriority first among keyword matches
  const withKeywords = scoped
    .filter((p) => p.keywords?.length)
    .sort((a, b) => b.matchPriority - a.matchPriority);

  for (const p of withKeywords) {
    if (p.keywords!.some((kw) => q.includes(normalize(kw)))) {
      return p;
    }
  }

  // Whole-query fuzzy: contains full preset prompt substring
  const containsPrompt = scoped
    .filter((p) => p.matchPriority > 0)
    .sort((a, b) => b.matchPriority - a.matchPriority)
    .find((p) => q.includes(promptNorm(p)) || promptNorm(p).includes(q));
  if (containsPrompt) {
    return containsPrompt;
  }

  return genericForRoute(routeTag);
}

function genericForRoute(routeTag: string): AiPreset | undefined {
  const generics: Record<string, string> = {
    recommendation: "rec-generic",
    workload: "wl-generic",
    "shift-plan": "sp-generic",
    roster: "rs-generic",
    scenarios: "sc-generic",
  };
  const id = generics[routeTag];
  return id ? byId.get(id) : undefined;
}
