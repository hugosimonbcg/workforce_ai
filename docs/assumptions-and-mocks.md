# Assumptions & Mocked Inputs

## Mocked Inputs

| Input | Status | Detail |
|-------|--------|--------|
| **Historical demand** | Mocked | Synthetic weekly pattern with day-of-week multipliers and activity-specific peak profiles |
| **Forecast demand** | Mocked | Same as historical pattern — no forecasting model applied |
| **Fixed workload** | Modeled | Supervision (10h/day × 7 days), Safety (4h/day × 5 days), Admin (8h/day × 5 days) |
| **Labor standards** | Modeled | Units/hour by activity: Receiving 42, Putaway 35, Picking 28, Packing 32, Loading 50 |
| **Worker pool** | Mocked | 24 workers (20 permanent + 4 agency) with realistic skill distributions |
| **Worker availability** | Mocked | Leave, training, off-day patterns applied. David Kim leave Thu–Fri, Amy Wilson part-time |
| **Shift rules** | Modeled | Min 5h / max 10h duration, start window 06:00–15:00, max 6 consecutive days |
| **Cost parameters** | Proxy | Hourly rates $21–$26 base, OT premium at ~$30–32, agency at market + markup |
| **Facility constraints** | Modeled | Operating hours 06:00–22:00 |
| **Equipment capacity** | Not represented | Forklift/scanner constraints not yet in model |
| **Historical shifts** | Proxy | Baseline scenario represents a typical scheduling pattern |

## Proxies Used

- **Cost rates**: Market-directional hourly rates by skill level, not client-specific
- **Demand pattern**: Typical CL-DC profile, not based on actual WMS/TMS data
- **Baseline shift pattern**: Representative "before optimization" pattern, not a real client schedule
- **Annualized values**: 52-week linear projection with conservative (80%), expected (100%), and upside (120%) ranges

## Where Client Data Slots In

The data model is designed for clean swap-in:

| Data Layer | Current State | Client Integration Point |
|-----------|--------------|--------------------------|
| Demand | `generateDemand()` function | Replace with WMS/TMS historical data → forecast model output |
| Workers | `workerPool` array | Replace with HRIS/WFM worker export |
| Availability | Hardcoded leave/training maps | Replace with leave management system feed |
| Shift rules | Hardcoded constraint objects | Replace with client-specific CBA/labor law rules |
| Cost params | Inline cost-per-hour values | Replace with payroll data + agency contracts |
| Facility | Single facility object | Replace with facility master data |
| KPIs | Hardcoded per-scenario | Replace with optimizer output + calculated values |

### Integration Architecture (Future)

```
Client data sources
  → Data ingestion layer (ETL / API)
    → Planning data model (typed TypeScript interfaces, same as current)
      → Optimizer service (constraint solver)
        → KPI calculation engine
          → UI renders same components with real data
```

The UI components reference the `PlanContext` type. Any data source that produces a valid `PlanContext` object will render correctly without UI changes.

## Key Assumptions

1. **Demand is non-stochastic** — we use a point forecast, not a distribution
2. **Skills are binary** — a worker either has a skill or doesn't (no proficiency levels)
3. **Shifts are contiguous** — no split shifts modeled
4. **Cost is linear** — no volume discounts, step functions, or penalty tiers
5. **One facility** — no cross-facility balancing or shared worker pools
6. **One week horizon** — no multi-week carry-over effects (fatigue, leave accrual)
7. **Agency is elastic** — agency workers are available on demand within budget caps
8. **Equipment is unconstrained** — forklift/scanner bottlenecks not modeled

## Confidence Assessment

| Output Area | Confidence | Rationale |
|------------|-----------|-----------|
| Demand forecast | Medium | Synthetic pattern, directionally accurate for CL profile |
| Labor translation | High | Industry-standard units/hour methodology |
| Shift plan optimization | High | Clear constraint model with well-defined parameters |
| Roster feasibility | Medium | Named assignments with known gaps; agency TBD |
| Value annualization | Low | 52-week projection from single week; conservative bounds applied |
