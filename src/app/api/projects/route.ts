import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { _count: { select: { assignments: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      status: body.status || "Active",
      isContingent: body.isContingent || false,
      citizenshipRequired: body.citizenshipRequired || null,
      salesRep: body.salesRep || null,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
