import { getCapacityData } from "@/lib/capacity";

export const dynamic = "force-dynamic";

export default async function CapacityPage() {
  const data = await getCapacityData(16);

  if (data.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Capacity View</h1>
        <p className="text-[var(--muted)]">
          No active resources with assignments found. Import data first.
        </p>
      </div>
    );
  }

  // Only show resources that have at least one assignment
  const activeData = data.filter((r) => r.weeks.some((w) => w.hours > 0));
  const weeks = activeData[0]?.weeks.map((w) => w.weekStart) ?? [];

  // Group by practice
  const byPractice: Record<string, typeof activeData> = {};
  for (const r of activeData) {
    if (!byPractice[r.practice]) byPractice[r.practice] = [];
    byPractice[r.practice].push(r);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Capacity View</h1>

      <div className="flex gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          Under 40
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          At 40
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
          41-48
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          Over 48
        </span>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                Resource
              </th>
              <th className="px-2 py-2 text-left">Type</th>
              {weeks.map((w) => (
                <th key={w} className="px-2 py-2 text-center min-w-[60px]">
                  {formatWeek(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(byPractice)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([practice, resources]) => (
                <PracticeGroup
                  key={practice}
                  practice={practice}
                  resources={resources}
                  weeks={weeks}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PracticeGroup({
  practice,
  resources,
  weeks,
}: {
  practice: string;
  resources: Awaited<ReturnType<typeof getCapacityData>>;
  weeks: string[];
}) {
  // Practice totals per week
  const totals = weeks.map((_, wi) =>
    resources.reduce((sum, r) => sum + r.weeks[wi].hours, 0)
  );

  return (
    <>
      {/* Practice header row */}
      <tr className="bg-gray-100 border-b">
        <td className="px-3 py-1.5 font-bold sticky left-0 bg-gray-100 z-10">
          {practice}
        </td>
        <td className="px-2 py-1.5" />
        {totals.map((t, i) => (
          <td key={i} className="px-2 py-1.5 text-center font-bold">
            {t > 0 ? t : ""}
          </td>
        ))}
      </tr>
      {/* Resource rows */}
      {resources.map((r) => (
        <tr key={r.resourceId} className="border-b border-[var(--border)] hover:bg-gray-50">
          <td className="px-3 py-1 sticky left-0 bg-white z-10">
            {r.resourceName}
          </td>
          <td className="px-2 py-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                r.resourceType === "IC"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {r.resourceType === "IC" ? "IC" : "EE"}
            </span>
          </td>
          {r.weeks.map((w, wi) => (
            <td
              key={wi}
              className={`px-2 py-1 text-center font-mono ${cellColor(w.hours, r.maxHours)}`}
              title={w.assignments.map((a) => `${a.projectName}: ${a.hours}h`).join("\n")}
            >
              {w.hours > 0 ? w.hours : ""}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function cellColor(hours: number, max: number): string {
  if (hours === 0) return "";
  if (hours > 48) return "bg-red-100 text-red-800 font-bold";
  if (hours > max) return "bg-orange-100 text-orange-800 font-semibold";
  if (hours === max) return "bg-yellow-50 text-yellow-800";
  return "bg-green-50 text-green-800";
}

function formatWeek(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
