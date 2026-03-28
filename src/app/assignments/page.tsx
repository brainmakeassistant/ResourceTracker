import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    include: {
      resource: { include: { practice: true } },
      project: true,
      projectManager: true,
    },
    orderBy: [{ project: { name: "asc" } }, { resource: { name: "asc" } }],
  });

  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Link
          href="/assignments/new"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] text-sm"
        >
          Add Assignment
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Practice</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">PM</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Hrs/Wk</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => {
              const isActive =
                a.startDate <= now && (!a.endDate || a.endDate >= now);
              const isFuture = a.startDate > now;
              const isPast = a.endDate && a.endDate < now;

              let endingSoon = false;
              let endingThisWeek = false;
              if (a.endDate && isActive) {
                const daysToEnd = Math.ceil(
                  (a.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                endingSoon = daysToEnd <= 30;
                endingThisWeek = daysToEnd <= 7;
              }

              return (
                <tr
                  key={a.id}
                  className={`border-b border-[var(--border)] hover:bg-gray-50 ${isPast ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-2 font-medium">{a.resource.name}</td>
                  <td className="px-4 py-2">
                    {a.resource.practice?.name ?? "-"}
                  </td>
                  <td className="px-4 py-2">{a.project.name}</td>
                  <td className="px-4 py-2">
                    {a.projectManager?.name ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-[var(--muted)]">
                    {a.activity ?? "-"}
                  </td>
                  <td className="px-4 py-2">
                    {a.startDate.toLocaleDateString()}
                  </td>
                  <td
                    className={`px-4 py-2 ${endingThisWeek ? "text-[var(--danger)] font-semibold" : endingSoon ? "text-[var(--warning)] font-semibold" : ""}`}
                  >
                    {a.endDate ? a.endDate.toLocaleDateString() : "Ongoing"}
                  </td>
                  <td className="px-4 py-2 font-semibold">{a.hoursPerWeek}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : isFuture
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isActive ? "Active" : isFuture ? "Future" : "Past"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-sm text-[var(--muted)]">
        {assignments.length} assignments
      </div>
    </div>
  );
}
