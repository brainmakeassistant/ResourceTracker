import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const assignment = await prisma.assignment.update({
    where: { id: parseInt(id) },
    data: {
      resourceId: parseInt(body.resourceId),
      projectId: parseInt(body.projectId),
      pmId: body.pmId ? parseInt(body.pmId) : null,
      activity: body.activity || null,
      hoursPerWeek: parseFloat(body.hoursPerWeek),
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });
  return NextResponse.json(assignment);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.assignment.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ status: "deleted" });
}
