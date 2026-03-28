import { prisma } from "./prisma";

export interface WeeklyHours {
  weekStart: string; // ISO date string (Monday)
  hours: number;
  assignments: {
    projectName: string;
    hours: number;
  }[];
}

export interface CapacityRow {
  resourceId: number;
  resourceName: string;
  practice: string;
  resourceType: string;
  maxHours: number;
  weeks: WeeklyHours[];
}

// Get the Monday of a given date's week
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

// Generate array of Mondays between two dates
function getWeeks(start: Date, end: Date): Date[] {
  const weeks: Date[] = [];
  const current = getMonday(start);
  const last = getMonday(end);
  while (current <= last) {
    weeks.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 7);
  }
  return weeks;
}

export async function getCapacityData(
  weeksOut: number = 12
): Promise<CapacityRow[]> {
  const now = new Date();
  const startWeek = getMonday(now);
  const endDate = new Date(startWeek);
  endDate.setUTCDate(endDate.getUTCDate() + weeksOut * 7);

  const weeks = getWeeks(startWeek, endDate);

  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    include: {
      practice: true,
      assignments: {
        where: {
          startDate: { lte: endDate },
          OR: [{ endDate: null }, { endDate: { gte: startWeek } }],
        },
        include: { project: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return resources.map((r) => ({
    resourceId: r.id,
    resourceName: r.name,
    practice: r.practice?.name ?? "Unassigned",
    resourceType: r.resourceType,
    maxHours: r.maxHoursPerWeek,
    weeks: weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

      const activeAssignments = r.assignments.filter((a) => {
        return a.startDate <= weekEnd && (!a.endDate || a.endDate >= weekStart);
      });

      // Handle partial weeks at assignment boundaries
      const assignments = activeAssignments.map((a) => {
        const assignStart = a.startDate > weekStart ? a.startDate : weekStart;
        const assignEnd = a.endDate && a.endDate < weekEnd ? a.endDate : weekEnd;
        const daysInWeek =
          Math.min(
            5,
            (assignEnd.getTime() - assignStart.getTime()) /
              (1000 * 60 * 60 * 24) +
              1
          );
        const fraction = daysInWeek / 5;
        return {
          projectName: a.project.name,
          hours: Math.round(a.hoursPerWeek * fraction * 10) / 10,
        };
      });

      return {
        weekStart: weekStart.toISOString().split("T")[0],
        hours: assignments.reduce((sum, a) => sum + a.hours, 0),
        assignments,
      };
    }),
  }));
}

export async function getPracticeFinancials(
  startDate: Date,
  endDate: Date
) {
  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    include: {
      practice: true,
      assignments: {
        where: {
          startDate: { lte: endDate },
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
        },
        include: { project: true },
      },
    },
  });

  const practices: Record<
    string,
    { revenue: number; cost: number; hours: number; eeCount: number; icCount: number }
  > = {};

  const weeks = getWeeks(startDate, endDate);

  for (const r of resources) {
    const practiceName = r.practice?.name ?? "Unassigned";
    if (!practices[practiceName]) {
      practices[practiceName] = { revenue: 0, cost: 0, hours: 0, eeCount: 0, icCount: 0 };
    }

    // Count distinct resource types per practice
    if (r.resourceType.startsWith("EE")) {
      practices[practiceName].eeCount++;
    } else if (r.resourceType === "IC") {
      practices[practiceName].icCount++;
    }

    for (const week of weeks) {
      const weekEnd = new Date(week);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

      for (const a of r.assignments) {
        if (a.startDate <= weekEnd && (!a.endDate || a.endDate >= week)) {
          practices[practiceName].hours += a.hoursPerWeek;
          practices[practiceName].revenue += a.hoursPerWeek * (r.billRate ?? 0);
          practices[practiceName].cost += a.hoursPerWeek * (r.costRate ?? 0);
        }
      }
    }
  }

  return Object.entries(practices).map(([name, data]) => ({
    practice: name,
    ...data,
    profit: data.revenue - data.cost,
    margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
  }));
}
