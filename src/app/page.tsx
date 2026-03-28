import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const [resources, projects, assignments, overloaded] = await Promise.all([
    prisma.resource.count({ where: { isActive: true } }),
    prisma.project.count({ where: { status: "Active" } }),
    prisma.assignment.count(),
    // Resources whose current assignments sum > 40 hrs/week
    prisma.resource.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          where: {
            startDate: { lte: new Date() },
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
        },
      },
    }),
  ]);

  const overloadedList = overloaded
    .map((r) => ({
      name: r.name,
      total: r.assignments.reduce((s, a) => s + a.hoursPerWeek, 0),
      max: r.maxHoursPerWeek,
    }))
    .filter((r) => r.total > r.max)
    .sort((a, b) => b.total - a.total);

  return { resources, projects, assignments, overloadedList };
}

export default async function Dashboard() {
  const { resources, projects, assignments, overloadedList } = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Resources" value={resources} href="/resources" />
        <StatCard label="Active Projects" value={projects} href="/projects" />
        <StatCard label="Assignments" value={assignments} href="/assignments" />
        <StatCard
          label="Over Capacity"
          value={overloadedList.length}
          href="/capacity"
          danger={overloadedList.length > 0}
        />
      </div>

      {overloadedList.length > 0 && (
        <div className="bg-white rounded-lg border border-[var(--border)] p-4">
          <h2 className="text-lg font-semibold mb-3 text-[var(--danger)]">
            Over-Allocated Resources
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b">
                <th className="pb-2">Resource</th>
                <th className="pb-2">Assigned Hrs/Wk</th>
                <th className="pb-2">Max Hrs/Wk</th>
                <th className="pb-2">Over By</th>
              </tr>
            </thead>
            <tbody>
              {overloadedList.map((r) => (
                <tr key={r.name} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium">{r.name}</td>
                  <td className="py-2 text-[var(--danger)] font-semibold">
                    {r.total}
                  </td>
                  <td className="py-2">{r.max}</td>
                  <td className="py-2 text-[var(--danger)]">
                    +{r.total - r.max}
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

function StatCard({
  label,
  value,
  href,
  danger,
}: {
  label: string;
  value: number;
  href: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-[var(--border)] p-4 hover:shadow-md transition-shadow"
    >
      <div className="text-sm text-[var(--muted)]">{label}</div>
      <div
        className={`text-3xl font-bold mt-1 ${danger ? "text-[var(--danger)]" : ""}`}
      >
        {value}
      </div>
    </Link>
  );
}
