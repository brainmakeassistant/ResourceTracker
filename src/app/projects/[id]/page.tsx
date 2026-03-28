import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id: parseInt(id) },
    include: {
      assignments: {
        include: {
          resource: { include: { practice: true } },
          projectManager: true,
        },
        orderBy: { resource: { name: "asc" } },
      },
    },
  });

  if (!project) notFound();

  const now = new Date();
  const activeAssignments = project.assignments.filter(
    (a) => a.startDate <= now && (!a.endDate || a.endDate >= now)
  );
  const totalHours = activeAssignments.reduce((s, a) => s + a.hoursPerWeek, 0);

  // Cost/revenue summary
  const weeklyRevenue = activeAssignments.reduce(
    (s, a) => s + a.hoursPerWeek * (a.resource.billRate ?? 0),
    0
  );
  const weeklyCost = activeAssignments.reduce(
    (s, a) => s + a.hoursPerWeek * (a.resource.costRate ?? 0),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex gap-3 mt-1 text-sm text-[var(--muted)]">
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                project.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {project.status}
            </span>
            {project.isContingent && (
              <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                Contingent
              </span>
            )}
            {project.salesRep && <span>Sales: {project.salesRep}</span>}
          </div>
        </div>
        <Link
          href={`/projects/${project.id}/edit`}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] text-sm"
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Active Resources</div>
          <div className="text-2xl font-bold">{activeAssignments.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Total Hrs/Wk</div>
          <div className="text-2xl font-bold">{totalHours}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Weekly Revenue</div>
          <div className="text-2xl font-bold">
            {weeklyRevenue > 0 ? `$${Math.round(weeklyRevenue).toLocaleString()}` : "-"}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-[var(--muted)]">Weekly Margin</div>
          <div className={`text-2xl font-bold ${weeklyRevenue - weeklyCost < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
            {weeklyRevenue > 0
              ? `${Math.round(((weeklyRevenue - weeklyCost) / weeklyRevenue) * 100)}%`
              : "-"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Team ({project.assignments.length} assignments)</h2>
          <Link
            href={`/assignments/new?projectId=${project.id}`}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Add Assignment
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
              <th className="px-4 py-2">Resource</th>
              <th className="px-4 py-2">Practice</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">PM</th>
              <th className="px-4 py-2">Activity</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Hrs/Wk</th>
            </tr>
          </thead>
          <tbody>
            {project.assignments.map((a) => (
              <tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/resources/${a.resourceId}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {a.resource.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{a.resource.practice?.name ?? "-"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      a.resource.resourceType === "EE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {a.resource.resourceType}
                  </span>
                </td>
                <td className="px-4 py-2">{a.projectManager?.name ?? "-"}</td>
                <td className="px-4 py-2">{a.activity ?? "-"}</td>
                <td className="px-4 py-2">{a.startDate.toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {a.endDate ? a.endDate.toLocaleDateString() : "Ongoing"}
                </td>
                <td className="px-4 py-2 font-semibold">{a.hoursPerWeek}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
