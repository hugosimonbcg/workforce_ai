# Workforce AI Planning — Demo Script

## 30-Second Executive Opening

> "This is Workforce AI Planning — a decision cockpit for warehouse workforce planning. What you're seeing is the recommended weekly plan for our distribution center CL-DC-01. In one glance: the optimized plan saves $9,200 per week versus baseline — that's a 10.5% reduction in labor cost — while improving shift coverage from 88% to 96% and keeping SLA risk bounded at under 2%. The AI copilot on the right explains why."

## 5-Minute Live Demo Talk Track

### 1. Recommendation (60 seconds)

Start on the landing page.

- **Point to the hero**: "The recommended plan is the Optimized Default. One sentence tells you what it does: earlier picker coverage, better packer placement, lower overtime."
- **Point to the −$9,200 delta**: "Weekly savings are $9,200 — annualized, that's $571K conservative, $714K expected."
- **Walk the KPI spine**: "Overtime drops from 12.8% to 6.1%. Agency cost cut nearly in half. Cost per unit improves by 30 cents."
- **Point to value waterfall**: "The biggest lever is overtime reduction at $6,400/week, followed by agency reduction at $4,400."
- **Point to operational proof**: "Understaffing hours drop from 42 to 14. Coverage compliance goes from 88.5% to 96.2%."
- **Point to AI rail**: "The AI copilot summarizes this for an exec in structured cards — not a chatbot, a co-planner."

### 2. Workload (60 seconds)

Click "See workload drivers" or navigate to Workload.

- **Point to heatmap**: "This shows labor demand by day and hour. You can see the Tue–Fri 10:00–15:00 peak clearly — that's where picker and packer pressure concentrates."
- **Point to AI insight card**: "The AI tells you upfront: this 20-hour window drives 62% of picking demand. That's why the plan adds earlier picker coverage."
- **Toggle an activity chip**: "I can filter by activity — let me show just Picking to see its demand curve."
- **Point to workload mix**: "Picking is 36% of total labor demand, followed by Packing at 28%."
- **Point to labor translation table**: "This translates volume into skill-hours. At peak, we need 8+ picker-equivalents simultaneously."
- **Bridge**: "Now let me show you how the optimizer turns this into a shift architecture."

### 3. Shift Plan (90 seconds)

Navigate to Shift Plan.

- **Point to swim lanes**: "This is the shift architecture — every colored block is a shift, labeled with time range and worker count. You can see how shifts are staggered to match demand curves."
- **Highlight picking row**: "Picking has three coverage layers on peak days: an early shift at 7AM, a mid-day shift at 10AM, and a late shift at 2PM. That's what eliminates the understaffing gap."
- **Click a single day**: "Let me zoom into Wednesday — you can see the full coverage picture for one day. Receiver coverage starts at 6AM, pickers overlap from 7 to 6PM, packers follow the picking flow."
- **Point to constraints**: "These are the constraints the optimizer respects: 8% OT cap, 15% agency cap, under 2% SLA miss target, 5–10 hour shift windows."
- **Point to coverage chart**: "Required vs planned — every day has a small surplus. That's by design — buffer for real-world variance."
- **Bridge**: "The question is: can this plan actually be staffed with real people?"

### 4. Roster Feasibility (60 seconds)

Navigate to Roster.

- **Point to grid**: "24 workers, 7 days. Each cell shows the shift assignment, leave, training, or off status. Red dots flag exceptions."
- **Point to David Kim**: "David Kim is on leave Thu–Fri during peak outbound days. That's a medium-severity exception."
- **Click on the exception**: "The system suggests shifting Olivia Davis to cover or activating Agency Picker A."
- **Point to agency row**: "Agency workers show as reserve by default — they're activated only when needed."
- **Point to exception queue**: "5 total exceptions, 1 high severity — the agency confirmation gap on Wednesday. Everything else is manageable."
- **Click a worker**: "Clicking any worker opens their detail panel — qualifications, max hours, weekly schedule, and any conflicts."

### 5. Scenario Lab (60 seconds)

Navigate to Scenarios.

- **Point to banner**: "The system explicitly recommends the Optimized Default and tells you why."
- **Point to scenario cards**: "We've modeled 5 scenarios: the optimized base case, a demand spike, reduced picker availability, tighter OT cap, and reduced agency budget."
- **Point to KPI matrix**: "This delta matrix compares any two scenarios. Optimized vs baseline: every metric improves."
- **Click a different scenario card**: "If I click Outbound Demand Spike, the matrix recalculates — costs go up $6,400, SLA miss increases to 2.6%."
- **Point to scatter chart**: "The trade-off visualization puts all scenarios on a cost vs. service frontier. Lower-left is better. The recommended scenario is the green dot."
- **Open AI rail**: "The AI copilot here can generate executive summaries, recommend scenarios, or create new ones from natural language."

### Closing (30 seconds)

> "This is Workforce AI Planning. Five screens, one story: what plan is recommended, why it's recommended, what value it creates, what operational risks remain, and how AI helps interpret the decision. The data is mocked but the structure is ready for client data. We can swap in real demand, real worker pools, and real cost parameters without redesigning the product."

## 30-Second AI Moment

On the Recommendation screen with the AI Copilot rail open:

> "The AI copilot isn't a chatbot. It's a contextual co-planner. On the recommendation screen, it generates three things automatically: an executive summary, the top 3 value drivers, and the key remaining risks — all grounded in the current scenario data. On the Scenario Lab, it can explain trade-offs, recommend scenarios, or create new ones from natural language. Every output is structured, every source is cited."

## Likely Questions and How to Answer

| Question | Answer |
|----------|--------|
| "Is the data real?" | "The data is mocked but structurally accurate — the same schema accepts client data without UI changes." |
| "How does the optimizer work?" | "Constraint-based optimization respecting OT caps, agency limits, skill requirements, and service targets. Currently mocked but the planning logic is well-defined." |
| "Can it handle our specific constraints?" | "Yes — the constraint panel is configurable. We've modeled OT caps, agency limits, shift windows, duration limits, and max consecutive days." |
| "What about day-of-operations?" | "This product focuses on pre-operations planning. Day-of task allocation is a separate use case we've deliberately scoped out." |
| "How does the AI work?" | "The AI is bounded to structured scenario data. It interprets and summarizes — it doesn't hallucinate. Outputs are deterministic and grounded." |
| "Is this production-ready?" | "This is a working prototype with the right product architecture. The path to production is data integration, real optimization, and API connectivity." |
| "What's the annualized value?" | "Conservative estimate is $571K, expected is $714K. Based on 52-week projection from single-week optimization. The value levers are OT reduction, agency reduction, staffing balance, and service improvement." |
