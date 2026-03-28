import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const requestId = parseInt(id);
  const approverId = parseInt(body.approverId);

  // Update this approval
  await prisma.pTOApproval.updateMany({
    where: { requestId, approverId },
    data: {
      status: body.approved ? "Approved" : "Denied",
      respondedAt: new Date(),
    },
  });

  // Check if all approvals are in
  const approvals = await prisma.pTOApproval.findMany({
    where: { requestId },
  });

  const allResponded = approvals.every((a) => a.status !== "Pending");
  const anyDenied = approvals.some((a) => a.status === "Denied");

  if (allResponded) {
    const newStatus = anyDenied ? "Denied" : "Approved";
    await prisma.pTORequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    // If fully approved, create a "Time Off" assignment for capacity tracking
    if (newStatus === "Approved") {
      const ptoRequest = await prisma.pTORequest.findUnique({
        where: { id: requestId },
      });
      if (ptoRequest) {
        let timeOffProject = await prisma.project.findFirst({
          where: { name: "Time Off" },
        });
        if (!timeOffProject) {
          timeOffProject = await prisma.project.create({
            data: { name: "Time Off", status: "Active" },
          });
        }

        await prisma.assignment.create({
          data: {
            resourceId: ptoRequest.resourceId,
            projectId: timeOffProject.id,
            activity: "PTO",
            hoursPerWeek: ptoRequest.hoursPerDay * 5,
            startDate: ptoRequest.startDate,
            endDate: ptoRequest.endDate,
          },
        });
      }

      // TODO: Send email with calendar invite to all stakeholders
    }
  }

  return NextResponse.json({ status: "ok" });
}
