import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const resourceName = String(
      row["Resource"] || row["Employee"] || row["Name"] || ""
    ).trim();
    const projectName = String(
      row["Project"] || row["Job"] || row["Client"] || ""
    ).trim();
    const weekStr = String(row["Week"] || row["Week Starting"] || row["Date"] || "");
    const hours = parseFloat(String(row["Hours"] || row["Actual Hours"] || "0"));

    if (!resourceName || !projectName || !hours) {
      skipped++;
      continue;
    }

    // Match resource
    const resource = await prisma.resource.findFirst({
      where: { name: { contains: resourceName } },
    });
    // Match project
    const project = await prisma.project.findFirst({
      where: { name: { contains: projectName } },
    });

    if (!resource || !project) {
      skipped++;
      continue;
    }

    const weekDate = new Date(weekStr);
    if (isNaN(weekDate.getTime())) {
      skipped++;
      continue;
    }

    // Upsert actual hours
    const existing = await prisma.actual.findFirst({
      where: {
        resourceId: resource.id,
        projectId: project.id,
        weekEnding: weekDate,
      },
    });

    if (existing) {
      await prisma.actual.update({
        where: { id: existing.id },
        data: { hours },
      });
    } else {
      await prisma.actual.create({
        data: {
          resourceId: resource.id,
          projectId: project.id,
          weekEnding: weekDate,
          hours,
        },
      });
    }
    imported++;
  }

  return NextResponse.json({ imported, skipped });
}
