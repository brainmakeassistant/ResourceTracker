import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const resources = await prisma.resource.findMany({
    include: { practice: true, manager: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const resource = await prisma.resource.create({
    data: {
      name: body.name,
      resourceType: body.resourceType,
      level: body.level || null,
      citizenship: body.citizenship || null,
      location: body.location || null,
      expertise: body.expertise || null,
      billRate: body.billRate ? parseFloat(body.billRate) : null,
      costRate: body.costRate ? parseFloat(body.costRate) : null,
      practiceId: body.practiceId || null,
      managerId: body.managerId || null,
    },
  });
  return NextResponse.json(resource, { status: 201 });
}
