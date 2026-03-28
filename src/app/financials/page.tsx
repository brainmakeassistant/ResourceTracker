import { prisma } from "@/lib/prisma";
import { FinancialCharts } from "./charts";

export const dynamic = "force-dynamic";

export default async function FinancialsPage() {
  const now = new Date();
  const threeMonthsOut = new Date(now);
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

  // Get all active resources with their practice and current assignments
  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    include: {
      practice: true,
      assignments: {
        where: {
          startDate: { lte: threeMonthsOut },
          endDate: { gte: now },
        },
        include: { project: true },
      },
    },
  });

  // Practice profitability
  const practiceData: Record<
    string,
    { revenue: number; cost: number; hours: number; eeCount: number; icCount: number }
  > = {};

  const resourceTypeCounts: Record<string, { ee: number; ic: number; tbd: number }> = {};

  for (const r of resources) {
    const pName = r.practice?.name ?? "Unassigned";

    if (!practiceData[pName]) {
      practiceData[pName] = { revenue: 0, cost: 0, hours: 0, eeCount: 0, icCount: 0 };
    }
    if (!resourceTypeCounts[pName]) {
      resourceTypeCounts[pName] = { ee: 0, ic: 0, tbd: 0 };
    }

    if (r.resourceType.startsWith("EE")) resourceTypeCounts[pName].ee++;
    else if (r.resourceType === "IC") resourceTypeCounts[pName].ic++;
    else resourceTypeCounts[pName].tbd++;

    const weeklyHours = r.assignments.reduce((s, a) => s + a.hoursPerWeek, 0);
    // Annualize: assume 13 weeks in the quarter
    const periodHours = weeklyHours * 13;
    practiceData[pName].hours += periodHours;
    practiceData[pName].revenue += periodHours * (r.billRate ?? 0);
    practiceData[pName].cost += periodHours * (r.costRate ?? 0);
  }

  const profitability = Object.entries(practiceData)
    .map(([practice, d]) => ({
      practice,
      hours: Math.round(d.hours),
      revenue: Math.round(d.revenue),
      cost: Math.round(d.cost),
      profit: Math.round(d.revenue - d.cost),
      margin: d.revenue > 0 ? Math.round(((d.revenue - d.cost) / d.revenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const mixData = Object.entries(resourceTypeCounts)
    .map(([practice, counts]) => ({ practice, ...counts }))
    .sort((a, b) => a.practice.localeCompare(b.practice));

  // Project-level profitability
  const projectProfit: Record<
    string,
    { revenue: number; cost: number; hours: number }
  > = {};

  for (const r of resources) {
    for (const a of r.assignments) {
      const pName = a.project.name;
      if (!projectProfit[pName]) {
        projectProfit[pName] = { revenue: 0, cost: 0, hours: 0 };
      }
      const periodHours = a.hoursPerWeek * 13;
      projectProfit[pName].hours += periodHours;
      projectProfit[pName].revenue += periodHours * (r.billRate ?? 0);
      projectProfit[pName].cost += periodHours * (r.costRate ?? 0);
    }
  }

  const projectData = Object.entries(projectProfit)
    .map(([project, d]) => ({
      project,
      hours: Math.round(d.hours),
      revenue: Math.round(d.revenue),
      cost: Math.round(d.cost),
      profit: Math.round(d.revenue - d.cost),
      margin: d.revenue > 0 ? Math.round(((d.revenue - d.cost) / d.revenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Financials</h1>

      <FinancialCharts mixData={mixData} profitability={profitability} />

      {/* Practice Profitability Table */}
      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden mb-6">
        <h2 className="text-lg font-semibold p-4 border-b">
          Practice Profitability (Next Quarter)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
              <th className="px-4 py-3">Practice</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {profitability.map((row) => (
              <tr key={row.practice} className="border-b border-[var(--border)]">
                <td className="px-4 py-2 font-medium">{row.practice}</td>
                <td className="px-4 py-2 text-right">{row.hours.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  {row.revenue > 0 ? `$${row.revenue.toLocaleString()}` : "-"}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.cost > 0 ? `$${row.cost.toLocaleString()}` : "-"}
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${row.profit < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
                >
                  {row.revenue > 0 ? `$${row.profit.toLocaleString()}` : "-"}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.revenue > 0 ? `${row.margin}%` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Project Profitability Table */}
      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">
          Project Profitability (Next Quarter)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {projectData.map((row) => (
              <tr key={row.project} className="border-b border-[var(--border)]">
                <td className="px-4 py-2 font-medium">{row.project}</td>
                <td className="px-4 py-2 text-right">{row.hours.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  {row.revenue > 0 ? `$${row.revenue.toLocaleString()}` : "-"}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.cost > 0 ? `$${row.cost.toLocaleString()}` : "-"}
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${row.profit < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
                >
                  {row.revenue > 0 ? `$${row.profit.toLocaleString()}` : "-"}
                </td>
                <td className="px-4 py-2 text-right">
                  {row.revenue > 0 ? `${row.margin}%` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
