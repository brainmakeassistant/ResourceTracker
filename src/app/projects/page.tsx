import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      assignments: {
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        include: { resource: { include: { practice: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] text-sm"
        >
          Add Project
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
              <th className="px-4 py-3">Project Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Contingent</th>
              <th className="px-4 py-3">Citizenship Req</th>
              <th className="px-4 py-3">Active Staff</th>
              <th className="px-4 py-3">Total Hrs/Wk</th>
              <th className="px-4 py-3">EE / IC</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const totalHours = p.assignments.reduce(
                (s, a) => s + a.hoursPerWeek,
                0
              );
              const eeCount = p.assignments.filter((a) =>
                a.resource.resourceType.startsWith("EE")
              ).length;
              const icCount = p.assignments.filter(
                (a) => a.resource.resourceType === "IC"
              ).length;

              return (
                <tr
                  key={p.id}
                  className="border-b border-[var(--border)] hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-[var(--primary)] hover:underline font-medium"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        p.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : p.status === "Paused"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{p.isContingent ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">
                    {p.citizenshipRequired ?? "-"}
                  </td>
                  <td className="px-4 py-2">{p.assignments.length}</td>
                  <td className="px-4 py-2 font-semibold">{totalHours}</td>
                  <td className="px-4 py-2">
                    <span className="text-blue-600">{eeCount} EE</span>
                    {" / "}
                    <span className="text-purple-600">{icCount} IC</span>
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
