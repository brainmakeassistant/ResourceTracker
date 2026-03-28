import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const requests = await prisma.pTORequest.findMany({
    include: {
      resource: { include: { practice: true, manager: true } },
      approvals: { include: { approver: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const resourceId = parseInt(body.resourceId);

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  const hoursPerDay = body.hoursPerDay ? parseFloat(body.hoursPerDay) : 8;
  // Calculate business days between start and end
  let days = 0;
  const d = new Date(startDate);
  while (d <= endDate) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days++;
    d.setDate(d.getDate() + 1);
  }
  const totalHours = days * hoursPerDay;

  // Create the PTO request
  const ptoRequest = await prisma.pTORequest.create({
    data: {
      resourceId,
      startDate,
      endDate,
      hoursPerDay,
      totalHours,
      reason: body.reason || null,
      status: "Pending",
    },
  });

  // Auto-create approval entries for manager and project managers
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      manager: true,
      assignments: {
        where: {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        include: { projectManager: true },
      },
    },
  });

  const approverIds = new Set<number>();

  // Add direct manager
  if (resource?.managerId) {
    approverIds.add(resource.managerId);
  }

  // Add all active project managers
  for (const a of resource?.assignments || []) {
    if (a.pmId) approverIds.add(a.pmId);
  }

  // Create approval entries
  for (const approverId of approverIds) {
    await prisma.pTOApproval.create({
      data: {
        requestId: ptoRequest.id,
        approverId,
        role: approverId === resource?.managerId ? "Manager" : "ProjectManager",
        status: "Pending",
      },
    });
  }

  return NextResponse.json(ptoRequest, { status: 201 });
}
