export interface Facility {
  id: string;
  name: string;
  type: string;
  location: string;
}

export interface Activity {
  id: string;
  name: string;
  color: string;
  skill: string;
}

export interface DemandCell {
  day: number;
  hour: number;
  activity: string;
  units: number;
  laborHours: number;
}

export interface FixedWorkload {
  role: string;
  hoursPerDay: number;
  daysRequired: number[];
  totalHours: number;
}

export interface LaborStandard {
  activity: string;
  unitsPerHour: number;
  skill: string;
}

export type ShiftType = "permanent-template" | "agency" | "overtime" | "reserve";

export interface ShiftBlock {
  id: string;
  day: number;
  skill: string;
  startHour: number;
  endHour: number;
  duration: number;
  workerCount: number;
  label: string;
  costPerHour: number;
  shiftType: ShiftType;
  locked: boolean;
}

export interface Worker {
  id: string;
  name: string;
  skills: string[];
  maxHoursWeek: number;
  team: string;
  contractType: "permanent" | "agency";
  templateShiftIds?: string[];
  availableDays?: number[];
}

export interface RosterAssignment {
  workerId: string;
  day: number;
  state: "assigned" | "off" | "training" | "leave" | "reserve" | "unassigned" | "conflict";
  shiftId?: string;
  shiftLabel?: string;
  conflictReason?: string;
  hours?: number;
}

export interface RosterException {
  id: string;
  workerId: string;
  workerName: string;
  day: number;
  dayLabel: string;
  type: "soft-conflict" | "max-hours" | "skill-gap" | "preference" | "leave-overlap";
  severity: "high" | "medium" | "low";
  description: string;
  suggestion: string;
}

export interface ScenarioKPIs {
  totalLaborCost: number;
  overtimeCost: number;
  overtimePercent: number;
  agencyCost: number;
  agencySharePercent: number;
  costPerUnit: number;
  understaffingHours: number;
  overstaffingHours: number;
  shiftCoverageCompliance: number;
  slaMissRate: number;
  backlogHours: number;
  productivity: number;
  throughputAttainment: number;
}

export interface ValueLever {
  lever: string;
  label: string;
  baselineValue: number;
  optimizedValue: number;
  delta: number;
  annualizedSaving: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  assumptions: string;
  isRecommended: boolean;
  isBaseline: boolean;
  kpis: ScenarioKPIs;
  shifts: ShiftBlock[];
  rosterAssignments: RosterAssignment[];
  rosterExceptions: RosterException[];
  valuLevers: ValueLever[];
  constraints: PlanConstraints;
}

export interface PlanContext {
  facility: Facility;
  horizon: { start: string; end: string; label: string };
  activities: Activity[];
  demand: DemandCell[];
  fixedWorkload: FixedWorkload[];
  laborStandards: LaborStandard[];
  workers: Worker[];
  scenarios: Scenario[];
  activeScenarioId: string;
  compareScenarioId: string | null;
}

export interface EvidenceInput {
  name: string;
  category: string;
  status: "modeled" | "mocked" | "proxy" | "not-represented";
  note: string;
}

export interface ConfidenceArea {
  area: string;
  level: "high" | "medium" | "low";
  note: string;
}

// ─── Plan Constraints ───────────────────────────────────────────────────────

export interface PlanConstraints {
  otCapPercent: number;
  agencyCapPercent: number;
  slaMissTarget: number;
  shiftMinHours: number;
  shiftMaxHours: number;
  shiftStartEarliest: number;
  shiftStartLatest: number;
  maxConsecutiveDays: number;
}

// ─── Coverage Layer ─────────────────────────────────────────────────────────

export type CoverageSeverity = "covered" | "tight" | "understaffed" | "critical" | "overstaffed";

export type CoverageMode = "gap" | "demand" | "supply" | "risk";

export interface CoverageBucket {
  day: number;
  hour: number;
  skill: string;
  requiredHours: number;
  plannedHours: number;
  assignedHours: number;
  gap: number;
  surplus: number;
  severity: CoverageSeverity;
  blockers: string[];
}

export interface CoverageIssue {
  id: string;
  day: number;
  hour: number;
  skill: string;
  type: "understaffed" | "critical-gap" | "skill-shortage" | "agency-cap" | "ot-cap";
  severity: "high" | "medium" | "low";
  description: string;
  suggestedAction: string;
}

export interface CoverageSummary {
  totalGapHours: number;
  totalSurplusHours: number;
  criticalWindows: number;
  issuesBySeverity: { high: number; medium: number; low: number };
  coveragePercent: number;
}

export interface OperationalIssue {
  id: string;
  type: "agency-pending" | "skill-gap" | "cert-expiry" | "leave-overlap" | "ot-creep" | "rule-violation";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  suggestedAction: string;
  relatedDay?: number;
  relatedSkill?: string;
  relatedWorkerId?: string;
}
