import { PlanContext, Facility, Activity, DemandCell, FixedWorkload, LaborStandard, Worker, ShiftBlock, RosterAssignment, RosterException, Scenario, ScenarioKPIs, ValueLever, EvidenceInput, ConfidenceArea, PlanConstraints, OperationalIssue } from "./types";

// ─── Facility ───────────────────────────────────────────────────────────────
const facility: Facility = {
  id: "CL-DC-01",
  name: "CL-DC-01 — Central Distribution Hub",
  type: "Contract Logistics",
  location: "Midwest Region",
};

// ─── Activities ─────────────────────────────────────────────────────────────
const activities: Activity[] = [
  { id: "receiving", name: "Receiving", color: "#0ea5e9", skill: "receiver" },
  { id: "putaway", name: "Putaway", color: "#6366f1", skill: "putaway-op" },
  { id: "picking", name: "Picking", color: "#f59e0b", skill: "picker" },
  { id: "packing", name: "Packing", color: "#10b981", skill: "packer" },
  { id: "loading", name: "Outbound Loading", color: "#ef4444", skill: "loader" },
];

// ─── Labor Standards ────────────────────────────────────────────────────────
const laborStandards: LaborStandard[] = [
  { activity: "receiving", unitsPerHour: 42, skill: "receiver" },
  { activity: "putaway", unitsPerHour: 35, skill: "putaway-op" },
  { activity: "picking", unitsPerHour: 28, skill: "picker" },
  { activity: "packing", unitsPerHour: 32, skill: "packer" },
  { activity: "loading", unitsPerHour: 50, skill: "loader" },
];

// ─── Fixed Workload ─────────────────────────────────────────────────────────
const fixedWorkload: FixedWorkload[] = [
  { role: "Site Supervisor", hoursPerDay: 10, daysRequired: [0,1,2,3,4,5,6], totalHours: 70 },
  { role: "Safety & Compliance", hoursPerDay: 4, daysRequired: [0,1,2,3,4], totalHours: 20 },
  { role: "Admin / Inventory Control", hoursPerDay: 8, daysRequired: [0,1,2,3,4], totalHours: 40 },
];

// ─── Demand Generation ──────────────────────────────────────────────────────
function generateDemand(): DemandCell[] {
  const cells: DemandCell[] = [];
  const dayMultipliers = [0.85, 1.1, 1.15, 1.2, 1.05, 0.55, 0.45];

  const activityProfiles: Record<string, { peakHour: number; spread: number; baseUnits: number }> = {
    receiving:  { peakHour: 8,  spread: 3, baseUnits: 120 },
    putaway:    { peakHour: 9,  spread: 3, baseUnits: 100 },
    picking:    { peakHour: 12, spread: 4, baseUnits: 180 },
    packing:    { peakHour: 13, spread: 4, baseUnits: 160 },
    loading:    { peakHour: 15, spread: 3, baseUnits: 140 },
  };

  const standards: Record<string, number> = {};
  laborStandards.forEach(ls => { standards[ls.activity] = ls.unitsPerHour; });

  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour <= 22; hour++) {
      for (const [activity, profile] of Object.entries(activityProfiles)) {
        const dist = Math.abs(hour - profile.peakHour);
        const curve = Math.max(0, 1 - (dist / profile.spread) ** 2);
        const units = Math.round(profile.baseUnits * curve * dayMultipliers[day] * (0.9 + Math.random() * 0.2));
        if (units > 0) {
          cells.push({
            day,
            hour,
            activity,
            units,
            laborHours: Math.round((units / standards[activity]) * 10) / 10,
          });
        }
      }
    }
  }
  return cells;
}

const demand = generateDemand();

// ─── Workers ────────────────────────────────────────────────────────────────
const workerPool: Worker[] = [
  { id: "W001", name: "Marcus Johnson", skills: ["picker", "packer"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W002", name: "Sarah Chen", skills: ["picker"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W003", name: "David Kim", skills: ["picker", "receiver"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W004", name: "Emily Rodriguez", skills: ["packer"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W005", name: "James Walker", skills: ["packer", "picker"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W006", name: "Lisa Nguyen", skills: ["receiver", "putaway-op"], maxHoursWeek: 40, team: "Bravo", contractType: "permanent" },
  { id: "W007", name: "Michael Brown", skills: ["receiver"], maxHoursWeek: 40, team: "Bravo", contractType: "permanent" },
  { id: "W008", name: "Anna Patel", skills: ["putaway-op"], maxHoursWeek: 40, team: "Bravo", contractType: "permanent" },
  { id: "W009", name: "Robert Martinez", skills: ["putaway-op", "receiver"], maxHoursWeek: 40, team: "Bravo", contractType: "permanent" },
  { id: "W010", name: "Jessica Lee", skills: ["loader"], maxHoursWeek: 40, team: "Charlie", contractType: "permanent" },
  { id: "W011", name: "Thomas Wright", skills: ["loader", "receiver"], maxHoursWeek: 40, team: "Charlie", contractType: "permanent" },
  { id: "W012", name: "Olivia Davis", skills: ["picker", "packer"], maxHoursWeek: 40, team: "Charlie", contractType: "permanent" },
  { id: "W013", name: "Daniel Garcia", skills: ["picker"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W014", name: "Rachel Thompson", skills: ["packer", "picker"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W015", name: "Kevin Anderson", skills: ["loader", "putaway-op"], maxHoursWeek: 40, team: "Charlie", contractType: "permanent" },
  { id: "W016", name: "Amy Wilson", skills: ["picker"], maxHoursWeek: 32, team: "Bravo", contractType: "permanent" },
  { id: "W017", name: "Chris Taylor", skills: ["receiver", "putaway-op"], maxHoursWeek: 40, team: "Bravo", contractType: "permanent" },
  { id: "W018", name: "Maria Hernandez", skills: ["packer"], maxHoursWeek: 40, team: "Alpha", contractType: "permanent" },
  { id: "W019", name: "Agency - Picker A", skills: ["picker"], maxHoursWeek: 40, team: "Agency", contractType: "agency" },
  { id: "W020", name: "Agency - Picker B", skills: ["picker"], maxHoursWeek: 40, team: "Agency", contractType: "agency" },
  { id: "W021", name: "Agency - Packer A", skills: ["packer"], maxHoursWeek: 40, team: "Agency", contractType: "agency" },
  { id: "W022", name: "Agency - Loader A", skills: ["loader"], maxHoursWeek: 40, team: "Agency", contractType: "agency" },
  { id: "W023", name: "Nathan Park", skills: ["picker", "loader"], maxHoursWeek: 40, team: "Charlie", contractType: "permanent" },
  { id: "W024", name: "Sophie Clark", skills: ["packer", "receiver"], maxHoursWeek: 40, team: "Bravo", contractType: "permanent" },
];

// ─── Shift Plans ────────────────────────────────────────────────────────────
function generateOptimizedShifts(): ShiftBlock[] {
  const shifts: ShiftBlock[] = [];
  let id = 0;

  for (let day = 0; day < 7; day++) {
    const isWeekend = day >= 5;
    const peakDay = day >= 1 && day <= 4;

    shifts.push({ id: `S${++id}`, day, skill: "receiver", startHour: 6, endHour: 14, duration: 8, workerCount: isWeekend ? 1 : 2, label: "RCV-AM", costPerHour: 22, shiftType: "permanent-template", locked: false });
    if (peakDay) {
      shifts.push({ id: `S${++id}`, day, skill: "receiver", startHour: 7, endHour: 12, duration: 5, workerCount: 1, label: "RCV-Mid", costPerHour: 22, shiftType: "permanent-template", locked: false });
    }

    shifts.push({ id: `S${++id}`, day, skill: "putaway-op", startHour: 7, endHour: 15, duration: 8, workerCount: isWeekend ? 1 : 2, label: "PUT-AM", costPerHour: 21, shiftType: "permanent-template", locked: false });

    shifts.push({ id: `S${++id}`, day, skill: "picker", startHour: 7, endHour: 15, duration: 8, workerCount: isWeekend ? 2 : 4, label: "PCK-Early", costPerHour: 24, shiftType: "permanent-template", locked: true });
    if (!isWeekend) {
      shifts.push({ id: `S${++id}`, day, skill: "picker", startHour: 10, endHour: 18, duration: 8, workerCount: peakDay ? 3 : 2, label: "PCK-Mid", costPerHour: 24, shiftType: peakDay ? "permanent-template" : "agency", locked: false });
    }
    if (peakDay) {
      shifts.push({ id: `S${++id}`, day, skill: "picker", startHour: 14, endHour: 20, duration: 6, workerCount: 2, label: "PCK-Late", costPerHour: 26, shiftType: "overtime", locked: false });
    }

    shifts.push({ id: `S${++id}`, day, skill: "packer", startHour: 8, endHour: 16, duration: 8, workerCount: isWeekend ? 1 : 3, label: "PAK-AM", costPerHour: 22, shiftType: "permanent-template", locked: false });
    if (!isWeekend) {
      shifts.push({ id: `S${++id}`, day, skill: "packer", startHour: 12, endHour: 20, duration: 8, workerCount: peakDay ? 2 : 1, label: "PAK-PM", costPerHour: 22, shiftType: peakDay ? "permanent-template" : "agency", locked: false });
    }

    shifts.push({ id: `S${++id}`, day, skill: "loader", startHour: 12, endHour: 20, duration: 8, workerCount: isWeekend ? 1 : 2, label: "LDG-PM", costPerHour: 23, shiftType: "permanent-template", locked: false });
    if (peakDay) {
      shifts.push({ id: `S${++id}`, day, skill: "loader", startHour: 15, endHour: 21, duration: 6, workerCount: 1, label: "LDG-Late", costPerHour: 25, shiftType: "overtime", locked: false });
    }
  }
  return shifts;
}

function generateBaselineShifts(): ShiftBlock[] {
  const shifts: ShiftBlock[] = [];
  let id = 1000;

  for (let day = 0; day < 7; day++) {
    const isWeekend = day >= 5;

    shifts.push({ id: `S${++id}`, day, skill: "receiver", startHour: 7, endHour: 15, duration: 8, workerCount: isWeekend ? 1 : 2, label: "RCV-Std", costPerHour: 22, shiftType: "permanent-template", locked: false });
    shifts.push({ id: `S${++id}`, day, skill: "putaway-op", startHour: 8, endHour: 16, duration: 8, workerCount: isWeekend ? 1 : 2, label: "PUT-Std", costPerHour: 21, shiftType: "permanent-template", locked: false });
    shifts.push({ id: `S${++id}`, day, skill: "picker", startHour: 9, endHour: 17, duration: 8, workerCount: isWeekend ? 2 : 5, label: "PCK-Std", costPerHour: 24, shiftType: "permanent-template", locked: false });
    if (!isWeekend) {
      shifts.push({ id: `S${++id}`, day, skill: "picker", startHour: 13, endHour: 21, duration: 8, workerCount: 2, label: "PCK-OT", costPerHour: 32, shiftType: "overtime", locked: false });
    }
    shifts.push({ id: `S${++id}`, day, skill: "packer", startHour: 9, endHour: 17, duration: 8, workerCount: isWeekend ? 1 : 3, label: "PAK-Std", costPerHour: 22, shiftType: "permanent-template", locked: false });
    if (!isWeekend) {
      shifts.push({ id: `S${++id}`, day, skill: "packer", startHour: 14, endHour: 22, duration: 8, workerCount: 2, label: "PAK-OT", costPerHour: 30, shiftType: "overtime", locked: false });
    }
    shifts.push({ id: `S${++id}`, day, skill: "loader", startHour: 13, endHour: 21, duration: 8, workerCount: isWeekend ? 1 : 3, label: "LDG-Std", costPerHour: 23, shiftType: "permanent-template", locked: false });
  }
  return shifts;
}

// ─── Roster Assignments ─────────────────────────────────────────────────────
function generateRoster(shifts: ShiftBlock[], workers: Worker[]): { assignments: RosterAssignment[]; exceptions: RosterException[] } {
  const assignments: RosterAssignment[] = [];
  const exceptions: RosterException[] = [];

  // Pre-assign specific patterns for story
  const leaveMap: Record<string, number[]> = {
    "W003": [3, 4],       // David Kim on leave Thu-Fri
    "W016": [0, 1, 2],    // Amy Wilson part-time, off Mon-Wed
  };
  const trainingMap: Record<string, number[]> = {
    "W008": [2],           // Anna Patel training Wed
    "W018": [4],           // Maria Hernandez training Fri
  };
  const offMap: Record<string, number[]> = {
    "W001": [5, 6],
    "W002": [0, 6],
    "W004": [5, 6],
    "W005": [0, 6],
    "W006": [5, 6],
    "W007": [5, 6],
    "W008": [5, 6],
    "W009": [0, 6],
    "W010": [5, 6],
    "W011": [5, 6],
    "W012": [0, 5],
    "W013": [5, 6],
    "W014": [0, 6],
    "W015": [5, 6],
    "W017": [5, 6],
    "W023": [0, 5],
    "W024": [5, 6],
  };

  for (const worker of workers) {
    let weekHours = 0;
    for (let day = 0; day < 7; day++) {
      if (leaveMap[worker.id]?.includes(day)) {
        assignments.push({ workerId: worker.id, day, state: "leave", hours: 0 });
        continue;
      }
      if (trainingMap[worker.id]?.includes(day)) {
        assignments.push({ workerId: worker.id, day, state: "training", hours: 4 });
        weekHours += 4;
        continue;
      }
      if (offMap[worker.id]?.includes(day)) {
        assignments.push({ workerId: worker.id, day, state: "off", hours: 0 });
        continue;
      }

      if (weekHours >= worker.maxHoursWeek) {
        assignments.push({ workerId: worker.id, day, state: "off", hours: 0 });
        continue;
      }

      const dayShifts = shifts.filter(s => s.day === day && worker.skills.includes(s.skill));
      if (dayShifts.length > 0) {
        const shift = dayShifts[0];
        assignments.push({
          workerId: worker.id,
          day,
          state: "assigned",
          shiftId: shift.id,
          shiftLabel: `${shift.label} ${shift.startHour}:00-${shift.endHour}:00`,
          hours: shift.duration,
        });
        weekHours += shift.duration;
      } else if (worker.contractType === "agency") {
        assignments.push({ workerId: worker.id, day, state: "reserve", hours: 0 });
      } else {
        assignments.push({ workerId: worker.id, day, state: "unassigned", hours: 0 });
      }
    }
  }

  // Add specific exceptions
  exceptions.push({
    id: "EX001",
    workerId: "W003",
    workerName: "David Kim",
    day: 3,
    dayLabel: "Thursday",
    type: "leave-overlap",
    severity: "medium",
    description: "David Kim (picker/receiver) on leave Thu-Fri during peak outbound days",
    suggestion: "Shift W012 (Olivia Davis) to cover PCK-Early Thu or activate Agency Picker A",
  });
  exceptions.push({
    id: "EX002",
    workerId: "W001",
    workerName: "Marcus Johnson",
    day: 4,
    dayLabel: "Friday",
    type: "max-hours",
    severity: "low",
    description: "Marcus Johnson at 38h by Friday — 2h buffer to max. Friday PCK-Mid would exceed.",
    suggestion: "Assign to shorter PCK-Late (6h) or keep on reserve for Fri",
  });
  exceptions.push({
    id: "EX003",
    workerId: "W019",
    workerName: "Agency - Picker A",
    day: 2,
    dayLabel: "Wednesday",
    type: "soft-conflict",
    severity: "high",
    description: "Agency Picker A scheduled for PCK-Mid Wed, but agency confirmation pending",
    suggestion: "Confirm agency availability by EOD Tue or pre-assign W016 as fallback",
  });
  exceptions.push({
    id: "EX004",
    workerId: "W014",
    workerName: "Rachel Thompson",
    day: 1,
    dayLabel: "Tuesday",
    type: "preference",
    severity: "low",
    description: "Rachel Thompson prefers AM shifts; assigned PAK-PM on Tuesday",
    suggestion: "Swap with W018 (Maria Hernandez) who has no preference conflict",
  });
  exceptions.push({
    id: "EX005",
    workerId: "W011",
    workerName: "Thomas Wright",
    day: 3,
    dayLabel: "Thursday",
    type: "skill-gap",
    severity: "medium",
    description: "Thomas Wright (loader) assigned LDG-Late Thu; secondary skill only, no forklift cert renewal",
    suggestion: "Pair with W010 (Jessica Lee, certified) or defer to W022 (Agency Loader)",
  });

  return { assignments, exceptions };
}

// ─── Constraints ────────────────────────────────────────────────────────────
export const defaultConstraints: PlanConstraints = {
  otCapPercent: 8,
  agencyCapPercent: 15,
  slaMissTarget: 2,
  shiftMinHours: 5,
  shiftMaxHours: 10,
  shiftStartEarliest: 6,
  shiftStartLatest: 15,
  maxConsecutiveDays: 6,
};

// ─── Operational Issues ─────────────────────────────────────────────────────
export const operationalIssues: OperationalIssue[] = [
  {
    id: "OI-001",
    type: "agency-pending",
    severity: "high",
    title: "Agency Picker A — Wed confirmation pending",
    description: "Agency Picker A is scheduled for PCK-Mid on Wednesday but confirmation has not been received. If unavailable, the Wed 10:00–18:00 picking window will be short by 1 worker.",
    suggestedAction: "Follow up with agency by EOD Tuesday or pre-assign W016 (Amy Wilson) as fallback",
    relatedDay: 2,
    relatedSkill: "picker",
    relatedWorkerId: "W019",
  },
  {
    id: "OI-002",
    type: "skill-gap",
    severity: "medium",
    title: "Thomas Wright — forklift cert expired",
    description: "Thomas Wright (W011) is assigned LDG-Late Thu but his forklift certification lapsed. He cannot operate the dock loader without supervision.",
    suggestedAction: "Pair with Jessica Lee (certified) or reassign to manual loading tasks",
    relatedDay: 3,
    relatedSkill: "loader",
    relatedWorkerId: "W011",
  },
  {
    id: "OI-003",
    type: "leave-overlap",
    severity: "medium",
    title: "David Kim leave during peak outbound",
    description: "David Kim (W003, picker/receiver) is on leave Thu–Fri, overlapping with the highest outbound demand window. Picker coverage drops to minimum on Thursday afternoon.",
    suggestedAction: "Activate Agency Picker B for Thu–Fri or shift Olivia Davis from packing to picking",
    relatedDay: 3,
    relatedSkill: "picker",
    relatedWorkerId: "W003",
  },
  {
    id: "OI-004",
    type: "ot-creep",
    severity: "medium",
    title: "Marcus Johnson nearing weekly OT threshold",
    description: "Marcus Johnson (W001) will reach 38h by end of Thursday. Any Friday assignment exceeding 2h triggers overtime rate. Currently assigned PCK-Mid Fri (8h).",
    suggestedAction: "Reassign to PCK-Late (6h) or keep on reserve for Friday",
    relatedDay: 4,
    relatedWorkerId: "W001",
  },
  {
    id: "OI-005",
    type: "cert-expiry",
    severity: "low",
    title: "Anna Patel training slot conflicts with putaway shift",
    description: "Anna Patel (W008) has mandatory safety training on Wednesday, overlapping with her PUT-AM shift. Training takes priority but leaves the putaway slot unfilled.",
    suggestedAction: "Assign Robert Martinez (W009, putaway/receiver) to cover PUT-AM Wed",
    relatedDay: 2,
    relatedSkill: "putaway-op",
    relatedWorkerId: "W008",
  },
  {
    id: "OI-006",
    type: "rule-violation",
    severity: "low",
    title: "Weekend loader shift has single-person coverage",
    description: "Saturday and Sunday LDG-PM shifts have only 1 loader assigned. Site policy recommends minimum 2 for safety on dock operations.",
    suggestedAction: "Add Agency Loader A to weekend LDG-PM or cross-train a picker for backup",
    relatedDay: 5,
    relatedSkill: "loader",
  },
  {
    id: "OI-007",
    type: "agency-pending",
    severity: "low",
    title: "Agency Packer A availability unconfirmed for Thu",
    description: "Agency Packer A (W021) is scheduled for PAK-PM Thu but has not confirmed. Low risk since permanent packers can absorb if needed.",
    suggestedAction: "Confirm by Wed EOD; fallback is Sophie Clark (W024, packer/receiver)",
    relatedDay: 3,
    relatedSkill: "packer",
    relatedWorkerId: "W021",
  },
];

// ─── Scenarios ──────────────────────────────────────────────────────────────
const optimizedShifts = generateOptimizedShifts();
const baselineShifts = generateBaselineShifts();
const { assignments: optRoster, exceptions: optExceptions } = generateRoster(optimizedShifts, workerPool);
const { assignments: baseRoster, exceptions: baseExceptions } = generateRoster(baselineShifts, workerPool);

const baselineKPIs: ScenarioKPIs = {
  totalLaborCost: 87400,
  overtimeCost: 11200,
  overtimePercent: 12.8,
  agencyCost: 8600,
  agencySharePercent: 9.8,
  costPerUnit: 2.84,
  understaffingHours: 42,
  overstaffingHours: 68,
  shiftCoverageCompliance: 88.5,
  slaMissRate: 4.2,
  backlogHours: 18,
  productivity: 26.4,
  throughputAttainment: 94.8,
};

const optimizedKPIs: ScenarioKPIs = {
  totalLaborCost: 78200,
  overtimeCost: 4800,
  overtimePercent: 6.1,
  agencyCost: 4200,
  agencySharePercent: 5.4,
  costPerUnit: 2.54,
  understaffingHours: 14,
  overstaffingHours: 22,
  shiftCoverageCompliance: 96.2,
  slaMissRate: 1.8,
  backlogHours: 5,
  productivity: 29.1,
  throughputAttainment: 98.2,
};

const optimizedValueLevers: ValueLever[] = [
  { lever: "ot-reduction", label: "Overtime reduction", baselineValue: 11200, optimizedValue: 4800, delta: -6400, annualizedSaving: 332800 },
  { lever: "agency-reduction", label: "Agency labor reduction", baselineValue: 8600, optimizedValue: 4200, delta: -4400, annualizedSaving: 228800 },
  { lever: "staffing-balance", label: "Staffing balance improvement", baselineValue: 68, optimizedValue: 22, delta: -46, annualizedSaving: 89700 },
  { lever: "service-uplift", label: "Service level improvement", baselineValue: 4.2, optimizedValue: 1.8, delta: -2.4, annualizedSaving: 62400 },
];

const scenarios: Scenario[] = [
  {
    id: "baseline",
    name: "Current baseline",
    description: "Existing shift structure without optimization. Late picker start, uniform shift blocks, higher overtime and agency reliance.",
    assumptions: "No changes to current scheduling patterns",
    isRecommended: false,
    isBaseline: true,
    kpis: baselineKPIs,
    shifts: baselineShifts,
    rosterAssignments: baseRoster,
    rosterExceptions: baseExceptions,
    valuLevers: [],
    constraints: { ...defaultConstraints, otCapPercent: 13, agencyCapPercent: 20 },
  },
  {
    id: "optimized",
    name: "Optimized default",
    description: "Earlier picker coverage, demand-aligned packer blocks, reduced overtime, lower agency dependence while maintaining service targets.",
    assumptions: "Full workforce available, standard demand pattern",
    isRecommended: true,
    isBaseline: false,
    kpis: optimizedKPIs,
    shifts: optimizedShifts,
    rosterAssignments: optRoster,
    rosterExceptions: optExceptions,
    valuLevers: optimizedValueLevers,
    constraints: defaultConstraints,
  },
  {
    id: "demand-spike",
    name: "Outbound demand spike (+15%)",
    description: "Simulates 15% increase in outbound volume. Requires additional picker and packer capacity, moderate OT increase.",
    assumptions: "+15% outbound demand, picker/packer load increases",
    isRecommended: false,
    isBaseline: false,
    kpis: { ...optimizedKPIs, totalLaborCost: 84600, overtimeCost: 7200, overtimePercent: 8.5, agencyCost: 6800, costPerUnit: 2.68, understaffingHours: 22, slaMissRate: 2.6, throughputAttainment: 96.8 },
    shifts: optimizedShifts,
    rosterAssignments: optRoster,
    rosterExceptions: optExceptions,
    valuLevers: optimizedValueLevers.map(v => ({ ...v, annualizedSaving: Math.round(v.annualizedSaving * 0.7) })),
    constraints: { ...defaultConstraints, agencyCapPercent: 20 },
  },
  {
    id: "reduced-pickers",
    name: "Reduced picker availability (−10%)",
    description: "Models 10% fewer available pickers. Increases agency dependence and risk of missed SLAs during peak windows.",
    assumptions: "2 fewer permanent pickers available",
    isRecommended: false,
    isBaseline: false,
    kpis: { ...optimizedKPIs, totalLaborCost: 81400, overtimeCost: 6100, overtimePercent: 7.5, agencyCost: 7400, agencySharePercent: 9.1, understaffingHours: 28, slaMissRate: 3.1, shiftCoverageCompliance: 93.4 },
    shifts: optimizedShifts,
    rosterAssignments: optRoster,
    rosterExceptions: optExceptions,
    valuLevers: optimizedValueLevers.map(v => ({ ...v, annualizedSaving: Math.round(v.annualizedSaving * 0.65) })),
    constraints: { ...defaultConstraints, agencyCapPercent: 20 },
  },
  {
    id: "tight-ot",
    name: "Tighter OT cap (5%)",
    description: "Caps overtime at 5% of total hours. Reduces cost but increases agency reliance and risk in peak windows.",
    assumptions: "OT capped at 5%, agency absorbs overflow",
    isRecommended: false,
    isBaseline: false,
    kpis: { ...optimizedKPIs, totalLaborCost: 79800, overtimeCost: 3200, overtimePercent: 4.0, agencyCost: 6400, agencySharePercent: 8.0, understaffingHours: 18, slaMissRate: 2.2, shiftCoverageCompliance: 94.8 },
    shifts: optimizedShifts,
    rosterAssignments: optRoster,
    rosterExceptions: optExceptions,
    valuLevers: optimizedValueLevers.map(v => ({ ...v, annualizedSaving: Math.round(v.annualizedSaving * 0.85) })),
    constraints: { ...defaultConstraints, otCapPercent: 5, agencyCapPercent: 18 },
  },
  {
    id: "reduced-agency",
    name: "Reduced agency budget (−40%)",
    description: "Cuts agency budget by 40%. Internal workforce absorbs more load; higher OT risk during demand peaks.",
    assumptions: "Agency hours capped at 60% of baseline",
    isRecommended: false,
    isBaseline: false,
    kpis: { ...optimizedKPIs, totalLaborCost: 80200, overtimeCost: 7800, overtimePercent: 9.7, agencyCost: 2500, agencySharePercent: 3.1, understaffingHours: 24, slaMissRate: 2.8, shiftCoverageCompliance: 93.8 },
    shifts: optimizedShifts,
    rosterAssignments: optRoster,
    rosterExceptions: optExceptions,
    valuLevers: optimizedValueLevers.map(v => ({ ...v, annualizedSaving: Math.round(v.annualizedSaving * 0.75) })),
    constraints: { ...defaultConstraints, agencyCapPercent: 6, otCapPercent: 10 },
  },
];

// ─── Evidence ───────────────────────────────────────────────────────────────
export const evidenceInputs: EvidenceInput[] = [
  { name: "Historical demand", category: "Demand", status: "mocked", note: "Synthetic weekly pattern based on typical CL-DC profile" },
  { name: "Forecast demand", category: "Demand", status: "mocked", note: "Derived from historical pattern with day-of-week multipliers" },
  { name: "Fixed workload", category: "Workload", status: "modeled", note: "Supervision, safety, admin roles defined per facility" },
  { name: "Labor standards", category: "Workload", status: "modeled", note: "Units-per-hour by activity, used for labor hour translation" },
  { name: "Worker pool", category: "Roster", status: "mocked", note: "24 workers with realistic skill/availability profiles" },
  { name: "Worker availability", category: "Roster", status: "mocked", note: "Leave, training, off-day patterns applied" },
  { name: "Shift rules", category: "Planning", status: "modeled", note: "Min/max duration, start windows, skill requirements" },
  { name: "Cost parameters", category: "Financial", status: "proxy", note: "Hourly rates by skill and shift type; directional" },
  { name: "Facility constraints", category: "Planning", status: "modeled", note: "Operating hours 06:00–22:00, dock capacity" },
  { name: "Equipment capacity", category: "Planning", status: "not-represented", note: "Forklift/scanner limits not yet modeled" },
  { name: "Historical shifts", category: "Planning", status: "proxy", note: "Baseline scenario represents typical scheduling pattern" },
];

export const confidenceAreas: ConfidenceArea[] = [
  { area: "Demand forecast", level: "medium", note: "Based on synthetic pattern; directionally accurate" },
  { area: "Labor translation", level: "high", note: "Standard labor-hours-per-unit model, well-established" },
  { area: "Shift plan optimization", level: "high", note: "Constraint-based optimization with clear parameters" },
  { area: "Roster feasibility", level: "medium", note: "Named assignments with known gaps; agency confirmation pending" },
  { area: "Value annualization", level: "low", note: "52-week projection from single week; conservative bounds used" },
];

// ─── Plan Context ───────────────────────────────────────────────────────────
export const planContext: PlanContext = {
  facility,
  horizon: { start: "2026-04-06", end: "2026-04-12", label: "Week 15 · Apr 6–12, 2026" },
  activities,
  demand,
  fixedWorkload,
  laborStandards,
  workers: workerPool,
  scenarios,
  activeScenarioId: "optimized",
  compareScenarioId: "baseline",
};

// Helper to get active scenario
export function getScenario(id: string): Scenario | undefined {
  return planContext.scenarios.find(s => s.id === id);
}

export function getActiveScenario(): Scenario {
  return planContext.scenarios.find(s => s.id === planContext.activeScenarioId)!;
}

export function getBaselineScenario(): Scenario {
  return planContext.scenarios.find(s => s.isBaseline)!;
}

// ─── AI Mock Outputs ────────────────────────────────────────────────────────
export interface AIInsight {
  id: string;
  type: "summary" | "risk" | "value" | "action" | "explanation";
  title: string;
  content: string;
  sources?: string[];
  screen: string;
  /** When set, "Open" affordance runs openAiPreset(this) from CopilotRail */
  actionPresetId?: string;
}

export const aiInsights: AIInsight[] = [
  // Recommendation screen
  {
    id: "ai-exec-summary",
    type: "summary",
    title: "Executive Summary",
    content: "The optimized plan for CL-DC-01 reduces weekly labor cost by $9,200 (−10.5%) versus baseline while improving shift coverage compliance from 88.5% to 96.2%. Key moves: earlier picker coverage starting at 07:00 eliminates the late-morning gap that caused 42 understaffing hours. Packer blocks realigned to follow picking peaks. OT drops from 12.8% to 6.1%. Agency dependency cut nearly in half. Service risk stays well bounded at 1.8% SLA miss rate.",
    sources: ["Current scenario KPIs", "Baseline comparison", "Shift architecture"],
    screen: "recommendation",
  },
  {
    id: "ai-top-value",
    type: "value",
    title: "Top 3 Value Drivers",
    content: "1. **Overtime reduction** — $6,400/week ($333K annualized) from demand-aligned shift timing that eliminates reactive OT.\n2. **Agency reduction** — $4,400/week ($229K annualized) from better permanent workforce utilization during peaks.\n3. **Staffing balance** — 46 fewer overstaffing hours/week improves labor-demand fit and reduces idle cost (~$90K annualized).",
    sources: ["Value levers", "Shift plan delta"],
    screen: "recommendation",
  },
  {
    id: "ai-top-risks",
    type: "risk",
    title: "Key Remaining Risks",
    content: "1. **Agency confirmation gap** — Picker A (Wed) still pending confirmation. Fallback: Amy Wilson (W016) available.\n2. **David Kim leave overlap** — Thu-Fri leave during peak outbound. Covered by Olivia Davis shift swap, but reduces picker buffer to zero on Thursday afternoon.",
    sources: ["Roster exceptions", "Worker availability"],
    screen: "recommendation",
  },
  // Workload screen
  {
    id: "ai-workload-pressure",
    type: "explanation",
    title: "Pressure Windows",
    content: "Tue–Fri between 10:00 and 15:00 concentrates 62% of weekly picking demand and 58% of packing demand. This 20-hour window across 4 days is the primary driver of the recommended shift architecture — it's why the plan adds earlier picker coverage (07:00 start) and a dedicated mid-day packer block.",
    sources: ["Demand heatmap", "Labor standards"],
    screen: "workload",
  },
  {
    id: "ai-bottleneck-skills",
    type: "explanation",
    title: "Bottleneck Skills",
    content: "**Pickers** and **packers** are the most constrained skills. At peak (Wed 11:00–14:00), picking requires 8.2 worker-equivalents but baseline only staffed 5. The optimized plan achieves 7 pickers in that window through shift overlap. Packing follows a similar pattern offset by ~1 hour.",
    sources: ["Labor translation", "Shift plan"],
    screen: "workload",
  },
  // Shift plan screen
  {
    id: "ai-shift-rationale",
    type: "explanation",
    title: "Why This Plan",
    content: "The optimizer identified three key moves:\n1. **Earlier picker start (07:00 vs 09:00)** — catches the 08:00–10:00 ramp that baseline missed, reducing understaffing by 28 hours/week.\n2. **Staggered packer blocks** — AM block (08:00–16:00) + PM block (12:00–20:00) instead of one uniform shift. Matches the picking-to-packing flow delay.\n3. **Late loader shift on peak days** — adds 15:00–21:00 coverage Tue–Fri for outbound surges, avoiding Tuesday's chronic loading backlog.",
    sources: ["Constraint solver", "Demand-capacity matching"],
    screen: "shift-plan",
  },
  {
    id: "ai-hardest-shifts",
    type: "risk",
    title: "Hardest Shifts to Staff",
    content: "1. **PCK-Late Thu** (14:00–20:00) — David Kim on leave, limited picker pool remaining. Agency Picker A as fallback.\n2. **PAK-PM Fri** (12:00–20:00) — Maria Hernandez in training, Rachel Thompson at preference conflict. Consider swap.\n3. **LDG-Late Wed** (15:00–21:00) — Thomas Wright cert gap. Needs pairing with Jessica Lee.",
    sources: ["Roster feasibility", "Worker qualifications"],
    screen: "shift-plan",
  },
  // Roster screen
  {
    id: "ai-roster-summary",
    type: "summary",
    title: "Roster Feasibility",
    content: "20 of 24 workers cleanly assigned. 5 exceptions identified: 2 medium severity (leave overlap, skill gap), 2 low (max-hours, preference), 1 high (agency confirmation). Overall feasibility is strong — the plan can be staffed with current workforce plus confirmed agency. Main risk is Thursday afternoon picker coverage if agency falls through.",
    sources: ["Roster assignments", "Exception queue"],
    screen: "roster",
  },
  // Scenario lab
  {
    id: "ai-scenario-recommend",
    type: "summary",
    title: "Scenario Recommendation",
    content: "**Optimized default** is recommended. It achieves the lowest weekly cost ($78,200) while staying within the 2% SLA miss target and keeping OT at 6.1%. The demand-spike scenario costs $6,400 more but only risks 2.6% SLA miss — acceptable if the volume materializes. Avoid the reduced-agency scenario: it saves on agency cost but pushes OT to 9.7%, creating burnout risk.",
    sources: ["All scenario KPIs", "Constraint analysis"],
    screen: "scenarios",
  },
  {
    id: "ai-scenario-tradeoff",
    type: "explanation",
    title: "Cost vs. Service Trade-off",
    content: "Moving from optimized default to tighter OT cap saves $1,600/week in OT but increases agency cost by $2,200 and drops coverage compliance by 1.4 points. Net: slightly worse economics and slightly worse service. The OT cap is only worth it if there's a hard policy constraint — not for cost optimization alone.",
    sources: ["Scenario comparison", "KPI delta analysis"],
    screen: "scenarios",
  },
];

export function getInsightsForScreen(screen: string): AIInsight[] {
  return aiInsights.filter(i => i.screen === screen);
}
