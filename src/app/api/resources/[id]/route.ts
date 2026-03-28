import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id: parseInt(id) },
    include: { practice: true, manager: true, assignments: true },
  });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(resource);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const resource = await prisma.resource.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      resourceType: body.resourceType,
      level: body.level || null,
      citizenship: body.citizenship || null,
      location: body.location || null,
      expertise: body.expertise || null,
      billRate: body.billRate ? parseFloat(body.billRate) : null,
      costRate: body.costRate ? parseFloat(body.costRate) : null,
      practiceId: body.practiceId ? parseInt(body.practiceId) : null,
      managerId: body.managerId ? parseInt(body.managerId) : null,
    },
  });
  return NextResponse.json(resource);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.resource.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });
  return NextResponse.json({ status: "deactivated" });
}
