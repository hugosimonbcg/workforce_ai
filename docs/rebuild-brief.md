# Workforce AI Planning — Rebuild Brief

## Product Thesis

Workforce AI Planning is a **decision cockpit** for warehouse workforce planning before day-of-operations. It answers one question per screen, flows from recommendation → workload → shift plan → roster → scenarios, and embeds AI as a contextual co-planner rather than a bolted-on chatbot.

The product is built for a single contract logistics distribution center (CL-DC-01), one week planning horizon, and five core warehouse activities: receiving, putaway, picking, packing, and outbound loading.

## Source Alignment

- **Use case 1 only** — pre-day-of-operations workforce planning
- **Use case 2 excluded** — no day-of task allocation
- **Product logic flow**: forecast demand → translate to labor hours → optimize shift plan → preview roster feasibility → compare scenarios → quantify value
- **AI layer**: bounded copilot grounded in scenario data, structured outputs, visible on Recommendation and Scenario Lab by default

## Design Concept

**Decision-led, not tab-led.** Each screen answers a primary question for the demo audience (ops executives and senior leadership). The main canvas uses a light analytical surface with a deep navy nav rail and contextual AI rail. Information density is high but hierarchy is crisp.

### Visual System
- **Shell**: Deep navy (#0f172a) left rail, 72px wide
- **Canvas**: Light analytical (#f8fafc) with white surfaces
- **Accent**: Cobalt blue (#2563eb) for primary, violet (#7c3aed) for AI
- **Activity colors**: Consistent across all screens (sky blue for receiving, indigo for putaway, amber for picking, emerald for packing, red for loading)

## Screen Map

| Route | Screen | Primary Question |
|-------|--------|-----------------|
| `/` | Recommendation | What plan is recommended, what value, why trust it? |
| `/workload` | Workload | Where is demand pressure, which skills are needed? |
| `/shift-plan` | Shift Plan | How is the optimized shift architecture built? |
| `/roster` | Roster Feasibility | Can this plan actually be staffed? |
| `/scenarios` | Scenario Lab | Which scenario is recommended, what are trade-offs? |

### Secondary Layers
- **Evidence drawer**: Slide-over showing planning inputs, confidence areas, assumptions, value logic
- **AI Copilot rail**: 320px collapsible right rail with contextual insights, suggested prompts, structured cards

## Component System

### Layout
- `AppShell` — orchestrates nav, top bar, main canvas, copilot rail
- `NavRail` — compact icon + label navigation, 72px
- `TopBar` — facility context, horizon, evidence/AI toggles
- `ScreenWrapper` — sets active screen and AI rail state
- `CopilotRail` — contextual AI insights and prompts
- `EvidenceDrawer` — planning inputs and confidence

### UI Primitives
- `KPICard` — metric with baseline, delta, confidence

### Feature Components
- Recommendation hero, KPI spine, value waterfall, operational proof, evidence previews
- Workload heatmap, activity mix, demand-labor translation, fixed workload
- Shift architecture swim lanes, coverage chart, constraint panel, shift summary
- Roster grid, exception queue, worker detail panel
- Scenario cards, KPI delta matrix, trade-off scatter, scenario creator

## Data Model Summary

### Core Entities
- Facility, Activities, Skills, Labor Standards
- Demand (day × hour × activity → units + labor hours)
- Fixed Workload (supervision, safety, admin)
- Workers (24 total, skills, max hours, contract type)
- Shift Blocks (skill, day, start/end, worker count, cost)
- Roster Assignments (worker × day → state + shift)
- Roster Exceptions (5 realistic conflicts)
- Scenarios (6: baseline, optimized, demand spike, reduced pickers, tight OT, reduced agency)
- KPI Outputs (financial, operational, business outcome per scenario)
- Value Levers (OT, agency, staffing balance, service uplift)

### AI Mock Outputs
- 10 structured insights across all screens
- Types: summary, risk, value, explanation
- Grounded in scenario data with source pills

## Build Order

1. ✅ Project scaffold (Next.js 16 + Tailwind 4 + TypeScript)
2. ✅ Design tokens and globals
3. ✅ Layout shell (nav rail, top bar, app shell)
4. ✅ Mock data layer (typed, comprehensive)
5. ✅ Recommendation screen
6. ✅ Workload screen
7. ✅ Shift Plan screen
8. ✅ Roster Feasibility screen
9. ✅ Scenario Lab screen
10. ✅ AI Copilot rail
11. ✅ Evidence drawer
12. ✅ Documentation
