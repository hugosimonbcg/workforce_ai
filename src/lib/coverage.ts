import type {
  DemandCell,
  ShiftBlock,
  RosterAssignment,
  Worker,
  LaborStandard,
  PlanConstraints,
  CoverageBucket,
  CoverageSeverity,
  CoverageIssue,
  CoverageSummary,
} from "@/data/types";

interface CoverageResult {
  buckets: CoverageBucket[];
  summary: CoverageSummary;
  issues: CoverageIssue[];
}

type BucketKey = `${number}-${number}-${string}`;

function bucketKey(day: number, hour: number, skill: string): BucketKey {
  return `${day}-${hour}-${skill}`;
}

function severityFromGap(gap: number, required: number): CoverageSeverity {
  if (required === 0) return "covered";
  const ratio = gap / required;
  if (gap <= 0) return required > 0 && gap < -0.5 ? "overstaffed" : "covered";
  if (ratio >= 0.5) return "critical";
  if (ratio >= 0.2) return "understaffed";
  return "tight";
}

export function computeCoverage(
  demand: DemandCell[],
  shifts: ShiftBlock[],
  assignments: RosterAssignment[],
  workers: Worker[],
  laborStandards: LaborStandard[],
  constraints?: PlanConstraints,
): CoverageResult {
  const activityToSkill: Record<string, string> = {};
  for (const ls of laborStandards) {
    activityToSkill[ls.activity] = ls.skill;
  }

  const requiredMap = new Map<BucketKey, number>();
  const skills = new Set<string>();
  for (const cell of demand) {
    const skill = activityToSkill[cell.activity];
    if (!skill) continue;
    skills.add(skill);
    const key = bucketKey(cell.day, cell.hour, skill);
    requiredMap.set(key, (requiredMap.get(key) ?? 0) + cell.laborHours);
  }

  const plannedMap = new Map<BucketKey, number>();
  for (const shift of shifts) {
    skills.add(shift.skill);
    for (let h = shift.startHour; h < shift.endHour; h++) {
      const key = bucketKey(shift.day, h, shift.skill);
      plannedMap.set(key, (plannedMap.get(key) ?? 0) + shift.workerCount);
    }
  }

  const assignedCountByShift = new Map<string, number>();
  for (const a of assignments) {
    if (a.state === "assigned" && a.shiftId) {
      assignedCountByShift.set(a.shiftId, (assignedCountByShift.get(a.shiftId) ?? 0) + 1);
    }
  }

  const assignedMap = new Map<BucketKey, number>();
  for (const shift of shifts) {
    const count = assignedCountByShift.get(shift.id) ?? 0;
    for (let h = shift.startHour; h < shift.endHour; h++) {
      const key = bucketKey(shift.day, h, shift.skill);
      assignedMap.set(key, (assignedMap.get(key) ?? 0) + count);
    }
  }

  const allKeys = new Set([...requiredMap.keys(), ...plannedMap.keys()]);
  const buckets: CoverageBucket[] = [];
  const issues: CoverageIssue[] = [];
  let issueId = 0;

  let totalGapHours = 0;
  let totalSurplusHours = 0;
  let criticalWindows = 0;
  const issueCounts = { high: 0, medium: 0, low: 0 };
  let totalRequired = 0;
  let totalPlanned = 0;

  for (const key of allKeys) {
    const [dayStr, hourStr, skill] = key.split("-") as [string, string, string];
    const day = Number(dayStr);
    const hour = Number(hourStr);
    const required = requiredMap.get(key) ?? 0;
    const planned = plannedMap.get(key) ?? 0;
    const assigned = assignedMap.get(key) ?? 0;
    const gap = Math.max(0, required - planned);
    const surplus = Math.max(0, planned - required);
    const severity = severityFromGap(required - planned, required);

    totalRequired += required;
    totalPlanned += planned;
    totalGapHours += gap;
    totalSurplusHours += surplus;
    if (severity === "critical") criticalWindows++;

    const blockers: string[] = [];
    if (constraints) {
      const agencyShiftsInHour = shifts.filter(
        (s) => s.day === day && s.skill === skill && s.shiftType === "agency" && s.startHour <= hour && s.endHour > hour
      );
      if (agencyShiftsInHour.length > 0 && gap > 0) {
        blockers.push("agency cap may be binding");
      }
      const otShiftsInHour = shifts.filter(
        (s) => s.day === day && s.skill === skill && s.shiftType === "overtime" && s.startHour <= hour && s.endHour > hour
      );
      if (otShiftsInHour.length > 0 && gap > 0) {
        blockers.push("OT cap may be binding");
      }
    }

    const skillWorkers = workers.filter((w) => w.skills.includes(skill));
    if (skillWorkers.length < required && gap > 0) {
      blockers.push("skill shortage");
    }

    buckets.push({ day, hour, skill, requiredHours: required, plannedHours: planned, assignedHours: assigned, gap, surplus, severity, blockers });

    if (severity === "critical" || severity === "understaffed") {
      const issueSev = severity === "critical" ? "high" : "medium";
      issueCounts[issueSev]++;
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      issues.push({
        id: `CI-${++issueId}`,
        day,
        hour,
        skill,
        type: severity === "critical" ? "critical-gap" : "understaffed",
        severity: issueSev,
        description: `${dayNames[day]} ${hour}:00 — ${skill} gap of ${gap.toFixed(1)}h (${required.toFixed(1)}h required, ${planned.toFixed(1)}h planned)`,
        suggestedAction: gap > 2 ? `Add agency ${skill} block or extend existing shift` : `Extend nearest ${skill} shift by ${Math.ceil(gap)}h`,
      });
    }
  }

  const coveragePercent = totalRequired > 0 ? Math.min(100, (totalPlanned / totalRequired) * 100) : 100;

  return {
    buckets,
    summary: {
      totalGapHours: Math.round(totalGapHours * 10) / 10,
      totalSurplusHours: Math.round(totalSurplusHours * 10) / 10,
      criticalWindows,
      issuesBySeverity: issueCounts,
      coveragePercent: Math.round(coveragePercent * 10) / 10,
    },
    issues,
  };
}

export function getBucketForCell(
  buckets: CoverageBucket[],
  day: number,
  hour: number,
): CoverageBucket[] {
  return buckets.filter((b) => b.day === day && b.hour === hour);
}

export function getAggregatedBucket(
  buckets: CoverageBucket[],
  day: number,
  hour: number,
): { required: number; planned: number; assigned: number; gap: number; surplus: number; severity: CoverageSeverity } {
  const cells = getBucketForCell(buckets, day, hour);
  const required = cells.reduce((s, c) => s + c.requiredHours, 0);
  const planned = cells.reduce((s, c) => s + c.plannedHours, 0);
  const assigned = cells.reduce((s, c) => s + c.assignedHours, 0);
  const gap = Math.max(0, required - planned);
  const surplus = Math.max(0, planned - required);
  return { required, planned, assigned, gap, surplus, severity: severityFromGap(required - planned, required) };
}
