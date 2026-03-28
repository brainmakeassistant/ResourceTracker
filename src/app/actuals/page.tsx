import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ActualsPage() {
  // Get recent actuals with forecast comparison
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const actuals = await prisma.actual.findMany({
    where: { weekEnding: { gte: fourWeeksAgo } },
    include: { resource: true, project: true },
    orderBy: [{ weekEnding: "desc" }, { resource: { name: "asc" } }],
  });

  // Get corresponding assignments for comparison
  const assignments = await prisma.assignment.findMany({
    where: {
      startDate: { lte: now },
      endDate: { gte: fourWeeksAgo },
    },
    include: { resource: true, project: true },
  });

  // Build comparison: group actuals by resource+week
  const comparison: Array<{
    resourceName: string;
    projectName: string;
    weekEnding: string;
    forecast: number;
    actual: number;
    variance: number;
  }> = [];

  for (const act of actuals) {
    // Find matching assignment
    const match = assignments.find(
      (a) =>
        a.resourceId === act.resourceId &&
        a.projectId === act.projectId &&
        a.startDate <= act.weekEnding &&
        a.endDate >= act.weekEnding
    );

    comparison.push({
      resourceName: act.resource.name,
      projectName: act.project.name,
      weekEnding: act.weekEnding.toLocaleDateString(),
      forecast: match?.hoursPerWeek ?? 0,
      actual: act.hours,
      variance: act.hours - (match?.hoursPerWeek ?? 0),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Actuals vs Forecast</h1>
        <form action="/api/actuals/upload" method="POST" encType="multipart/form-data">
          <label className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] text-sm cursor-pointer">
            Upload Actuals
            <input type="file" name="file" accept=".xlsx,.xls,.csv" className="hidden" />
          </label>
        </form>
      </div>

      {comparison.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-8 text-center text-[var(--muted)]">
          <p className="text-lg mb-2">No actuals data yet</p>
          <p className="text-sm">
            Upload a Springahead or timesheet export (Excel/CSV) to compare
            actual hours against forecasted assignments.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Week Ending</th>
                <th className="px-4 py-3 text-right">Forecast</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="px-4 py-2">{row.resourceName}</td>
                  <td className="px-4 py-2">{row.projectName}</td>
                  <td className="px-4 py-2">{row.weekEnding}</td>
                  <td className="px-4 py-2 text-right">{row.forecast}</td>
                  <td className="px-4 py-2 text-right">{row.actual}</td>
                  <td
                    className={`px-4 py-2 text-right font-semibold ${
                      row.variance > 0
                        ? "text-[var(--danger)]"
                        : row.variance < 0
                          ? "text-[var(--success)]"
                          : ""
                    }`}
                  >
                    {row.variance > 0 ? "+" : ""}
                    {row.variance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
