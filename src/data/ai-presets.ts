import type { AiPreset } from "@/lib/ai/types";

export const AI_PRESETS: AiPreset[] = [
  // ─── Recommendation ─────────────────────────────────────────────
  {
    id: "rec-exec-summary-30s",
    prompt: "Draft the 30-second executive summary",
    routeTags: ["recommendation"],
    matchPriority: 10,
    keywords: ["executive", "summary", "30-second", "30 second"],
    response: {
      summary:
        "CL-DC-01 optimized plan cuts weekly labor cost by $9,200 (−10.5%) vs baseline, lifts shift coverage compliance to 96.2% from 88.5%, and holds SLA miss at 1.8%. Drivers: earlier picker start (07:00), realigned packer blocks, OT down 12.8%→6.1%, agency spend nearly halved.",
      reasoning: [
        "The late-morning understaffing gap drove reactive OT under baseline; the plan closes it with demand-aligned picker coverage.",
        "Packer blocks follow picking peaks so downstream labor matches flow instead of batching into overtime.",
        "Service metrics stay within the stated SLA miss guardrail while economics improve.",
      ],
      confidence: 0.92,
      sources: ["Current scenario KPIs", "Baseline comparison", "Shift architecture"],
      lineage: ["planContext.scenarios", "planContext.demand", "valuLevers"],
    },
    followUps: [
      { label: "Top value drivers", promptId: "rec-top-value" },
      { label: "Remaining risks", promptId: "rec-biggest-risk" },
    ],
  },
  {
    id: "rec-top-value",
    prompt: "What are the top 3 sources of value?",
    routeTags: ["recommendation"],
    matchPriority: 10,
    keywords: ["value", "sources", "drivers", "top 3"],
    response: {
      summary:
        "The three largest weekly value levers are overtime reduction (~$6,400), agency reduction (~$4,400), and staffing balance (~$90K annualized from fewer overstaffing hours).",
      reasoning: [
        "**Overtime reduction** — $6,400/week ($333K annualized) from demand-aligned shift timing that removes reactive OT.",
        "**Agency reduction** — $4,400/week ($229K annualized) from better use of permanent staff at peaks.",
        "**Staffing balance** — 46 fewer overstaffing hours/week tightens labor-to-demand fit (~$90K annualized).",
      ],
      confidence: 0.9,
      sources: ["Value levers", "Shift plan delta"],
      lineage: ["activeScenario.valuLevers", "kpis"],
    },
    followUps: [
      { label: "Executive summary", promptId: "rec-exec-summary-30s" },
      { label: "Biggest risk", promptId: "rec-biggest-risk" },
    ],
  },
  {
    id: "rec-biggest-risk",
    prompt: "What is the biggest remaining risk?",
    routeTags: ["recommendation"],
    matchPriority: 10,
    keywords: ["risk", "biggest", "remaining"],
    response: {
      summary:
        "Primary risks are agency confirmation for Picker A on Wednesday and David Kim’s Thu–Fri leave during peak outbound, which erodes picker buffer Thursday afternoon even after Olivia Davis covers via swap.",
      reasoning: [
        "**Agency confirmation gap** — Picker A (Wed) pending; fallback Amy Wilson (W016) is available.",
        "**Leave overlap** — Thu–Fri leave during peak; swap helps but leaves zero picker buffer Thursday PM.",
      ],
      confidence: 0.88,
      sources: ["Roster exceptions", "Worker availability"],
      lineage: ["workerPool", "assignments"],
    },
    followUps: [
      { label: "Executive summary", promptId: "rec-exec-summary-30s" },
      { label: "Value drivers", promptId: "rec-top-value" },
    ],
  },
  {
    id: "rec-generic",
    prompt: "Ask about this recommendation view",
    routeTags: ["recommendation"],
    matchPriority: 0,
    response: {
      summary:
        "This view compares the optimized weekly plan to baseline for CL-DC-01: labor cost, OT, agency, coverage, and SLA risk—all grounded in the active scenario in plan data.",
      reasoning: [
        "Use the KPI strip and charts for numeric truth; copilot text restates those relationships without inventing new figures.",
        "For a tailored answer, pick one of the suggested prompts or rephrase using words like “summary”, “value”, or “risk”.",
      ],
      confidence: 0.55,
      sources: ["planContext", "active scenario"],
      lineage: ["mock seed data"],
    },
    followUps: [
      { label: "30-second summary", promptId: "rec-exec-summary-30s" },
      { label: "Top value", promptId: "rec-top-value" },
    ],
  },

  // ─── Workload ─────────────────────────────────────────────────
  {
    id: "wl-pressure-windows",
    prompt: "Where are the pressure windows this week?",
    routeTags: ["workload"],
    matchPriority: 10,
    keywords: ["pressure", "windows", "when", "peak"],
    response: {
      summary:
        "Tue–Fri 10:00–15:00 holds ~62% of weekly picking demand and ~58% of packing—this band drives the recommended shift architecture.",
      reasoning: [
        "Concentrated demand in a 20-hour window across four days explains early picker coverage and mid-day packer blocks.",
        "Aligning capacity to this window reduces reactive overtime versus spreading staff evenly.",
      ],
      confidence: 0.9,
      sources: ["Demand heatmap", "Labor standards"],
      lineage: ["planContext.demand", "laborStandards"],
    },
    followUps: [
      { label: "Bottleneck skills", promptId: "wl-bottleneck-skills" },
      { label: "Turn into scenario", promptId: "wl-scenario-turn" },
    ],
  },
  {
    id: "wl-bottleneck-skills",
    prompt: "Which skills are most constrained?",
    routeTags: ["workload"],
    matchPriority: 10,
    keywords: ["skills", "bottleneck", "constrained", "picker", "packer"],
    response: {
      summary:
        "**Pickers** and **packers** are the tightest skills; Wed 11:00–14:00 picking needs ~8.2 FTE vs baseline ~5 staffed; optimized plan reaches ~7 via overlap.",
      reasoning: [
        "Packing lags picking by about an hour, so the same pressure pattern appears slightly offset.",
        "Loader demand spikes later; the plan adds late coverage on peak days for that tail.",
      ],
      confidence: 0.88,
      sources: ["Labor translation", "Shift plan"],
      lineage: ["demand by activity", "skills"],
    },
    followUps: [
      { label: "Pressure windows", promptId: "wl-pressure-windows" },
      { label: "Scenario idea", promptId: "wl-scenario-turn" },
    ],
  },
  {
    id: "wl-scenario-turn",
    prompt: "Turn this workload profile into a scenario",
    routeTags: ["workload"],
    matchPriority: 10,
    keywords: ["scenario", "turn", "profile", "create"],
    response: {
      summary:
        "To turn this workload into a scenario in the demo: capture Tue–Fri 10–15 as the demand spine, picker/packer as constrained skills, and OT/agency caps from policy—then compare variants in Scenario Lab.",
      reasoning: [
        "Name the scenario after the stress pattern (e.g. “Midweek peak”) and pin demand multipliers to the heatmap highs.",
        "Use optimized default as the cost anchor; spike volume or tighten OT to generate trade-off curves already in seed KPIs.",
      ],
      confidence: 0.72,
      sources: ["Workload view", "Scenarios"],
      lineage: ["planContext", "scenarios"],
    },
    followUps: [
      { label: "Pressure windows", promptId: "wl-pressure-windows" },
      { label: "Bottlenecks", promptId: "wl-bottleneck-skills" },
    ],
  },
  {
    id: "wl-generic",
    prompt: "Ask about this workload view",
    routeTags: ["workload"],
    matchPriority: 0,
    response: {
      summary:
        "Workload shows demand translated through labor standards into hours by activity and time window for CL-DC-01’s horizon.",
      reasoning: [
        "Figures come from seeded demand and standards—not from the language model.",
        "Try prompts about pressure windows, skills, or scenarios for structured answers.",
      ],
      confidence: 0.5,
      sources: ["planContext.demand"],
      lineage: ["mock seed data"],
    },
    followUps: [{ label: "Pressure windows", promptId: "wl-pressure-windows" }],
  },

  // ─── Shift plan ────────────────────────────────────────────────
  {
    id: "sp-early-picker",
    prompt: "Why did the optimizer add early picker coverage?",
    routeTags: ["shift-plan"],
    matchPriority: 10,
    keywords: ["early", "picker", "07:00", "why", "optimizer"],
    response: {
      summary:
        "Earlier picker start (07:00 vs 09:00) catches the 08:00–10:00 ramp baseline missed, cutting understaffing by about 28 hours/week in the seed narrative.",
      reasoning: [
        "Demand rises before the old shift start, creating a systematic gap and reactive OT.",
        "Overlapping picker intervals increase headcount in the mid-morning peak without extending total weekly hours unsustainably.",
      ],
      confidence: 0.9,
      sources: ["Constraint solver", "Demand-capacity matching"],
      lineage: ["shifts", "demand"],
    },
    followUps: [
      { label: "OT cap at 5%", promptId: "sp-ot-cap-5" },
      { label: "Hardest blocks", promptId: "sp-hardest-blocks" },
    ],
  },
  {
    id: "sp-ot-cap-5",
    prompt: "What happens if OT cap drops to 5%?",
    routeTags: ["shift-plan"],
    matchPriority: 10,
    keywords: ["ot", "overtime", "5%", "cap"],
    response: {
      summary:
        "In the demo trade-off narrative, a tighter OT cap saves OT spend but pushes more volume to agency and slightly lowers coverage compliance—net economics and service both worsen unless OT is a hard policy line.",
      reasoning: [
        "Optimizer rebalances to agency and shift shape when OT is constrained; seed comparison shows +agency, −compliance vs default optimized.",
        "Use Scenario Lab KPI rows to quantify for your exact scenario IDs in mock data.",
      ],
      confidence: 0.78,
      sources: ["Scenario comparison", "Constraint rules"],
      lineage: ["scenarios", "kpis"],
    },
    followUps: [
      { label: "Early picker rationale", promptId: "sp-early-picker" },
      { label: "Hardest shifts", promptId: "sp-hardest-blocks" },
    ],
  },
  {
    id: "sp-hardest-blocks",
    prompt: "Which shift blocks are hardest to staff?",
    routeTags: ["shift-plan"],
    matchPriority: 10,
    keywords: ["hardest", "staff", "blocks", "shifts"],
    response: {
      summary:
        "Hardest blocks in seed data: PCK-Late Thu (14–20) with leave + thin pool; PAK-PM Fri with training/preference conflicts; LDG-Late Wed with cert gap.",
      reasoning: [
        "**PCK-Late Thu** — David Kim on leave; agency Picker A as fallback.",
        "**PAK-PM Fri** — training and preference conflict; consider swap.",
        "**LDG-Late Wed** — Thomas Wright cert gap; pair with Jessica Lee.",
      ],
      confidence: 0.87,
      sources: ["Roster feasibility", "Worker qualifications"],
      lineage: ["workers", "shifts"],
    },
    followUps: [
      { label: "Early picker", promptId: "sp-early-picker" },
      { label: "OT cap", promptId: "sp-ot-cap-5" },
    ],
  },
  {
    id: "sp-generic",
    prompt: "Ask about this shift plan view",
    routeTags: ["shift-plan"],
    matchPriority: 0,
    response: {
      summary:
        "Shift plan shows optimized blocks by skill and time versus demand; all staffing claims trace to seed shift and roster data.",
      reasoning: [
        "Ask specifically about early coverage, OT caps, or staffing difficulty for grounded answers.",
      ],
      confidence: 0.52,
      sources: ["Shift plan"],
      lineage: ["mock seed data"],
    },
    followUps: [{ label: "Why early pickers", promptId: "sp-early-picker" }],
  },

  // ─── Roster ───────────────────────────────────────────────────
  {
    id: "rs-exception-queue",
    prompt: "Summarize the exception queue",
    routeTags: ["roster"],
    matchPriority: 10,
    keywords: ["exception", "queue", "summarize", "summary"],
    response: {
      summary:
        "20/24 workers assigned cleanly; 5 exceptions—2 medium (leave overlap, skill gap), 2 low (max-hours, preference), 1 high (agency confirmation). Feasibility strong if agency confirms.",
      reasoning: [
        "High-severity item is agency confirmation; medium items are leave overlap and skill gap.",
        "Thursday PM picker depth is the main residual exposure if agency fails.",
      ],
      confidence: 0.89,
      sources: ["Roster assignments", "Exception queue"],
      lineage: ["assignments", "exceptions"],
    },
    followUps: [
      { label: "Which conflicts matter", promptId: "rs-conflicts" },
      { label: "Soft conflict ideas", promptId: "rs-soft-alternatives" },
    ],
  },
  {
    id: "rs-conflicts",
    prompt: "Which conflicts matter most?",
    routeTags: ["roster"],
    matchPriority: 10,
    keywords: ["conflicts", "matter", "which", "priority"],
    response: {
      summary:
        "Prioritize agency confirmation (high), then leave overlap and cert/skill gaps (medium); max-hours and pure preference issues are lower unless they stack on the same window.",
      reasoning: [
        "Unconfirmed agency on a peak window can collapse coverage; address before fine-tuning preferences.",
        "Skill gaps need pairing or certification paths—not just swaps.",
      ],
      confidence: 0.85,
      sources: ["Exception severity", "Peak windows"],
      lineage: ["roster exceptions"],
    },
    followUps: [
      { label: "Exception summary", promptId: "rs-exception-queue" },
      { label: "Soft alternatives", promptId: "rs-soft-alternatives" },
    ],
  },
  {
    id: "rs-soft-alternatives",
    prompt: "Suggest alternatives for soft conflicts",
    routeTags: ["roster"],
    matchPriority: 10,
    keywords: ["soft", "alternatives", "suggest", "conflict"],
    response: {
      summary:
        "For soft conflicts (preferences, minor max-hour touches), try same-skill swaps within the day, voluntary OT-eligible workers, or sliding start times within grace windows—without changing demand-facing coverage.",
      reasoning: [
        "Preserve hard constraints (certs, legal max hours) before optimizing preferences.",
        "Use the exception list in seed data to name specific workers already flagged as swap candidates where applicable.",
      ],
      confidence: 0.74,
      sources: ["Roster rules", "Worker preferences"],
      lineage: ["workers"],
    },
    followUps: [
      { label: "Exception queue", promptId: "rs-exception-queue" },
      { label: "Top conflicts", promptId: "rs-conflicts" },
    ],
  },
  {
    id: "rs-generic",
    prompt: "Ask about this roster view",
    routeTags: ["roster"],
    matchPriority: 0,
    response: {
      summary:
        "Roster view lists assignments and exceptions for the demo workforce; copilot only narrates what seed data already encodes.",
      reasoning: [
        "Use suggested prompts for exceptions, conflict priority, or soft fixes.",
      ],
      confidence: 0.5,
      sources: ["Roster"],
      lineage: ["mock seed data"],
    },
    followUps: [{ label: "Exception summary", promptId: "rs-exception-queue" }],
  },

  // ─── Scenarios ────────────────────────────────────────────────
  {
    id: "sc-recommend-exec",
    prompt: "Recommend the best scenario for an ops exec",
    routeTags: ["scenarios"],
    matchPriority: 10,
    keywords: ["recommend", "best", "exec", "ops", "scenario"],
    response: {
      summary:
        "**Optimized default** — lowest weekly cost ($78,200), SLA miss ~1.8%, OT ~6.1%. Demand-spike costs ~$6,400 more with ~2.6% SLA miss if volume materializes. Reduced-agency raises OT to ~9.7%—avoid for burnout risk unless policy mandates.",
      reasoning: [
        "Ops exec focus: cost, service, and operational risk; optimized balances all three in seed KPIs.",
        "Spike scenario is the conditional play when forecast confidence is high.",
      ],
      confidence: 0.91,
      sources: ["All scenario KPIs", "Constraint analysis"],
      lineage: ["planContext.scenarios"],
    },
    followUps: [
      { label: "vs demand-spike", promptId: "sc-optimized-vs-spike" },
      { label: "MDP summary", promptId: "sc-mdp-summary" },
    ],
  },
  {
    id: "sc-optimized-vs-spike",
    prompt: "Compare optimized vs demand-spike trade-offs",
    routeTags: ["scenarios"],
    matchPriority: 10,
    keywords: ["compare", "optimized", "demand", "spike", "trade"],
    response: {
      summary:
        "Optimized minimizes cost at target service; demand-spike buys volume headroom for ~$6,400/week and slightly higher SLA miss—choose spike when upside demand is credible.",
      reasoning: [
        "KPI deltas are read from scenario seed rows, not inferred.",
        "If SLA tolerance is fixed, optimized dominates; if revenue scales with throughput, spike can be rational.",
      ],
      confidence: 0.88,
      sources: ["Scenario comparison"],
      lineage: ["scenarios"],
    },
    followUps: [
      { label: "Exec recommendation", promptId: "sc-recommend-exec" },
      { label: "MDP summary", promptId: "sc-mdp-summary" },
    ],
  },
  {
    id: "sc-mdp-summary",
    prompt: "Write the MDP-ready summary",
    routeTags: ["scenarios"],
    matchPriority: 10,
    keywords: ["mdp", "summary", "ready", "write"],
    response: {
      summary:
        "MDP-ready (demo): Decision — adopt optimized weekly plan for CL-DC-01 Week 15. Rationale — $9,200/week labor savings vs baseline, coverage 96.2%, SLA miss 1.8%, OT 6.1%. Risks — agency confirmation Wed; Thu PM picker depth. Alternatives — demand-spike if forecast upgrades; avoid reduced-agency unless OT cap is non-negotiable.",
      reasoning: [
        "Structured for exec sign-off: decision, numbers, risks, alternatives—all from seed KPIs.",
        "Attach scenario IDs and evidence links from the product when moving beyond the demo.",
      ],
      confidence: 0.82,
      sources: ["Scenarios", "KPIs", "Risks"],
      lineage: ["planContext"],
    },
    followUps: [
      { label: "Exec pick", promptId: "sc-recommend-exec" },
      { label: "Optimized vs spike", promptId: "sc-optimized-vs-spike" },
    ],
  },
  {
    id: "sc-generic",
    prompt: "Ask about this scenarios view",
    routeTags: ["scenarios"],
    matchPriority: 0,
    response: {
      summary:
        "Scenario Lab compares named plans in seed data—cost, service, OT, agency—with no LLM-invented scenarios.",
      reasoning: [
        "Pick a suggested prompt or name a scenario from the cards for a focused preset answer.",
      ],
      confidence: 0.52,
      sources: ["Scenarios"],
      lineage: ["mock seed data"],
    },
    followUps: [{ label: "Ops exec pick", promptId: "sc-recommend-exec" }],
  },
];

/** Maps UI suggested-prompt label → preset id (exact string match from CopilotRail). */
export const SUGGESTED_PROMPT_TO_PRESET_ID: Record<string, string> = {
  "Draft the 30-second executive summary": "rec-exec-summary-30s",
  "What are the top 3 sources of value?": "rec-top-value",
  "What is the biggest remaining risk?": "rec-biggest-risk",
  "Where are the pressure windows this week?": "wl-pressure-windows",
  "Which skills are most constrained?": "wl-bottleneck-skills",
  "Turn this workload profile into a scenario": "wl-scenario-turn",
  "Why did the optimizer add early picker coverage?": "sp-early-picker",
  "What happens if OT cap drops to 5%?": "sp-ot-cap-5",
  "Which shift blocks are hardest to staff?": "sp-hardest-blocks",
  "Summarize the exception queue": "rs-exception-queue",
  "Which conflicts matter most?": "rs-conflicts",
  "Suggest alternatives for soft conflicts": "rs-soft-alternatives",
  "Recommend the best scenario for an ops exec": "sc-recommend-exec",
  "Compare optimized vs demand-spike trade-offs": "sc-optimized-vs-spike",
  "Write the MDP-ready summary": "sc-mdp-summary",
};
