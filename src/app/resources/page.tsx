import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ practice?: string; type?: string; search?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = { isActive: true };
  if (params.practice) where.practice = { name: params.practice };
  if (params.type) where.resourceType = params.type;
  if (params.search) where.name = { contains: params.search };

  const [resources, practices] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: {
        practice: true,
        manager: true,
        assignments: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.practice.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Resources</h1>
        <Link
          href="/resources/new"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] text-sm"
        >
          Add Resource
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-4">
        <input
          name="search"
          placeholder="Search by name..."
          defaultValue={params.search ?? ""}
          className="px-3 py-1.5 border border-[var(--border)] rounded text-sm w-64"
        />
        <select
          name="practice"
          defaultValue={params.practice ?? ""}
          className="px-3 py-1.5 border border-[var(--border)] rounded text-sm"
        >
          <option value="">All Practices</option>
          {practices.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="px-3 py-1.5 border border-[var(--border)] rounded text-sm"
        >
          <option value="">All Types</option>
          <option value="EE (050)">EE (050)</option>
          <option value="IC">IC</option>
          <option value="TBD">TBD</option>
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-[var(--primary)] text-white rounded text-sm"
        >
          Filter
        </button>
      </form>

      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Practice</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Current Hrs/Wk</th>
              <th className="px-4 py-3">Bill Rate</th>
              <th className="px-4 py-3">Cost Rate</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => {
              const totalHours = r.assignments.reduce(
                (s, a) => s + a.hoursPerWeek,
                0
              );
              const over = totalHours > r.maxHoursPerWeek;
              return (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border)] hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/resources/${r.id}`}
                      className="text-[var(--primary)] hover:underline font-medium"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{r.practice?.name ?? "-"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        r.resourceType === "IC"
                          ? "bg-purple-100 text-purple-700"
                          : r.resourceType === "TBD"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {r.resourceType}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[var(--muted)]">
                    {r.level ?? "-"}
                  </td>
                  <td className="px-4 py-2">{r.manager?.name ?? "-"}</td>
                  <td
                    className={`px-4 py-2 font-semibold ${over ? "text-[var(--danger)]" : ""}`}
                  >
                    {totalHours} / {r.maxHoursPerWeek}
                  </td>
                  <td className="px-4 py-2">
                    {r.billRate ? `$${r.billRate}` : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {r.costRate ? `$${r.costRate}` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-sm text-[var(--muted)]">
        {resources.length} resources
      </div>
    </div>
  );
}
