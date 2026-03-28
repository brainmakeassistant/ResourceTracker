import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This seed script imports data from the parsed Excel export.
// Run: bun run prisma/import-excel.ts first to generate seed-data.json,
// then: bun run prisma/seed.ts

async function main() {
  const fs = await import("fs");
  const path = await import("path");

  const dataPath = path.join(__dirname, "seed-data.json");
  if (!fs.existsSync(dataPath)) {
    console.error(
      "seed-data.json not found. Run: bun run prisma/import-excel.ts first"
    );
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log("Clearing existing data...");
  await prisma.pTOApproval.deleteMany();
  await prisma.pTORequest.deleteMany();
  await prisma.actual.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.practice.deleteMany();

  // Create practices
  console.log(`Creating ${data.practices.length} practices...`);
  for (const p of data.practices) {
    await prisma.practice.create({ data: p });
  }

  // Create resources
  console.log(`Creating ${data.resources.length} resources...`);
  for (const r of data.resources) {
    await prisma.resource.create({ data: r });
  }

  // Create projects
  console.log(`Creating ${data.projects.length} projects...`);
  for (const p of data.projects) {
    await prisma.project.create({ data: p });
  }

  // Create assignments
  console.log(`Creating ${data.assignments.length} assignments...`);
  for (const a of data.assignments) {
    await prisma.assignment.create({ data: a });
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
