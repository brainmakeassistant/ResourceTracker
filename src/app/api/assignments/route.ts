import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const assignments = await prisma.assignment.findMany({
    include: {
      resource: { include: { practice: true } },
      project: true,
    },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const assignment = await prisma.assignment.create({
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
  return NextResponse.json(assignment, { status: 201 });
}
