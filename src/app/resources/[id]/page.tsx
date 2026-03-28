import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id: parseInt(id) },
    include: {
      practice: true,
      manager: true,
      assignments: {
        include: { project: true, projectManager: true },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!resource) notFound();

  const now = new Date();
  const currentHours = resource.assignments
    .filter((a) => a.startDate <= now && (!a.endDate || a.endDate >= now))
    .reduce((s, a) => s + a.hoursPerWeek, 0);

  const isOver = currentHours > resource.maxHoursPerWeek;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{resource.name}</h1>
          <div className="flex gap-3 mt-1 text-sm text-[var(--muted)]">
            <span>{resource.practice?.name ?? "No Practice"}</span>
            <span>|</span>
            <span>{resource.resourceType === "EE" ? "Employee" : resource.resourceType === "IC" ? "Contractor" : resource.resourceType}</span>
            {resource.level && <><span>|</span><span>{resource.level}</span></>}
            {resource.location && <><span>|</span><span>{resource.location}</span></>}
          </div>
        </div>
        <Link
          href={`/resources/${resource.id}/edit`}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] text-sm"
        >
          Edit
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Current Hrs/Wk</div>
          <div className={`text-2xl font-bold ${isOver ? "text-[var(--danger)]" : ""}`}>
            {currentHours}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Max Hrs/Wk</div>
          <div className="text-2xl font-bold">{resource.maxHoursPerWeek}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Bill Rate</div>
          <div className="text-2xl font-bold">
            {resource.billRate ? `$${resource.billRate}/hr` : "-"}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Cost Rate</div>
          <div className="text-2xl font-bold">
            {resource.costRate ? `$${resource.costRate}/hr` : "-"}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Details</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Manager</dt>
              <dd>{resource.manager?.name ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Citizenship</dt>
              <dd>{resource.citizenship ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Expertise</dt>
              <dd>{resource.expertise ?? "-"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Assignments */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Assignments ({resource.assignments.length})</h2>
          <Link
            href={`/assignments/new?resourceId=${resource.id}`}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Add Assignment
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">PM</th>
              <th className="px-4 py-2">Activity</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Hrs/Wk</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {resource.assignments.map((a) => {
              const isActive = a.startDate <= now && (!a.endDate || a.endDate >= now);
              const isFuture = a.startDate > now;
              return (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{a.project.name}</td>
                  <td className="px-4 py-2">{a.projectManager?.name ?? "-"}</td>
                  <td className="px-4 py-2">{a.activity ?? "-"}</td>
                  <td className="px-4 py-2">{a.startDate.toLocaleDateString()}</td>
                  <td className="px-4 py-2">
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
    </div>
  );
}
