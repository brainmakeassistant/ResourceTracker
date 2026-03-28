import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PTOPage() {
  const requests = await prisma.pTORequest.findMany({
    include: {
      resource: { include: { practice: true, manager: true } },
      approvals: { include: { approver: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Time Off Requests</h1>
        <a
          href="/pto/new"
          className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] text-sm"
        >
          Request Time Off
        </a>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-8 text-center text-[var(--muted)]">
          <p className="text-lg mb-2">No time off requests yet</p>
          <p className="text-sm">
            When resources request time off, it will appear here for approval.
            Approved time off automatically shows in capacity planning.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b bg-gray-50">
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Practice</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Total Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approvals</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-[var(--border)] hover:bg-gray-50"
                >
                  <td className="px-4 py-2 font-medium">
                    {req.resource.name}
                  </td>
                  <td className="px-4 py-2">
                    {req.resource.practice?.name ?? "-"}
                  </td>
                  <td className="px-4 py-2">
                    {req.startDate.toLocaleDateString()} -{" "}
                    {req.endDate.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{req.totalHours}h</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        req.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : req.status === "Denied"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {req.approvals.map((appr) => (
                        <span
                          key={appr.id}
                          className={`text-xs px-2 py-0.5 rounded ${
                            appr.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : appr.status === "Denied"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                          title={`${appr.role}: ${appr.approver.name}`}
                        >
                          {appr.approver.name.split(",")[0]} ({appr.role}):{" "}
                          {appr.status}
                        </span>
                      ))}
                    </div>
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
