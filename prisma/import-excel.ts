import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const EXCEL_PATH =
  "C:/Users/Monroe/Downloads/050 Resource Tracking V4 (1).xlsm";

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
  }
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function main() {
  console.log("Reading Excel file...");
  const wb = XLSX.readFile(EXCEL_PATH);

  // ── Parse Practices (from Lists tab "Team" column) ──
  const listsSheet = wb.Sheets["Lists"];
  const listsData = XLSX.utils.sheet_to_json<Record<string, unknown>>(listsSheet);
  const practiceNames = new Set<string>();
  for (const row of listsData) {
    const team = row["Team"];
    if (team && typeof team === "string" && team.trim()) {
      practiceNames.add(team.trim());
    }
  }
  const practices = Array.from(practiceNames).map((name) => ({ name }));

  // ── Parse Projects ──
  const projSheet = wb.Sheets["Projects"];
  const projData = XLSX.utils.sheet_to_json<Record<string, unknown>>(projSheet);
  const projects: Array<{
    name: string;
    isContingent: boolean;
    citizenshipRequired: string | null;
    contingentSalesRep: string | null;
    status: string;
    isPTO: boolean;
  }> = [];

  for (const row of projData) {
    const name = String(row["Project Name"] ?? "").trim();
    if (!name || name.startsWith("ZZZ")) continue;

    // Extract SOW code from name if present
    const isPTO = name.includes("PTO");
    const contingent = String(row["Contingent?"] ?? "").toLowerCase() === "yes";
    const citizenship = row["Green Card/ USCitizen"]
      ? String(row["Green Card/ USCitizen"])
      : null;
    const salesRep = row["Contingent Sales Rep"]
      ? String(row["Contingent Sales Rep"]).trim() || null
      : null;
    const status = row["Status"] ? String(row["Status"]) : "Active";

    projects.push({
      name,
      isContingent: contingent,
      citizenshipRequired: citizenship,
      contingentSalesRep: salesRep,
      status: status === "NA" ? "NA" : status === "PAUSED" ? "Paused" : "Active",
      isPTO,
    });
  }

  // ── Parse Resources ──
  const resSheet = wb.Sheets["Resource List"];
  const resData = XLSX.utils.sheet_to_json<Record<string, unknown>>(resSheet);
  const resources: Array<{
    name: string;
    resourceType: string;
    level: string | null;
    citizenship: string | null;
    badged: boolean;
    location: string | null;
    expertiseArea: string | null;
    practiceId: number | null;
  }> = [];

  const practiceIdMap: Record<string, number> = {};
  practices.forEach((p, i) => {
    practiceIdMap[p.name] = i + 1; // Prisma autoincrement starts at 1
  });

  const resourceIdMap: Record<string, number> = {};
  let resourceIdx = 0;

  for (const row of resData) {
    const name = String(row["Resource Name"] ?? "").trim();
    if (!name || name.startsWith("ZZZ")) continue;

    resourceIdx++;
    resourceIdMap[name] = resourceIdx;

    const team = String(row["Team"] ?? "").trim();
    const resType = String(row["Resource Type"] ?? "").trim();
    const level = row["Level"] ? String(row["Level"]).trim() : null;
    const citizenship = row["Citizenship"]
      ? String(row["Citizenship"]).trim()
      : null;
    const badged = String(row["Badged"] ?? "").toUpperCase() === "Y";
    const location = row["Resides In"]
      ? String(row["Resides In"]).trim() || null
      : null;
    const expertise = row["Fusion Expertise Area"]
      ? String(row["Fusion Expertise Area"]).trim() || null
      : null;

    resources.push({
      name,
      resourceType: resType || "EE (050)",
      level,
      citizenship,
      badged,
      location,
      expertiseArea: expertise,
      practiceId: practiceIdMap[team] ?? null,
    });
  }

  // ── Parse Assignments from Data Sheet ──
  const dataSheet = wb.Sheets["Data Sheet"];
  const dataRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(dataSheet, {
    range: 4, // Header is on row 5 (0-indexed row 4)
  });

  // Build project ID map
  const projectIdMap: Record<string, number> = {};
  projects.forEach((p, i) => {
    projectIdMap[p.name] = i + 1;
  });

  const assignments: Array<{
    resourceId: number;
    projectId: number;
    pmId: number | null;
    hoursPerWeek: number;
    activity: string | null;
    startDate: string;
    endDate: string;
    notes: string | null;
  }> = [];

  // Track PMs mentioned in data sheet that aren't in Resource List
  const missingResources = new Set<string>();

  for (const row of dataRows) {
    const resourceName = String(row["Resource Name"] ?? "").trim();
    const projectName = String(row["Project Name"] ?? "").trim();
    const pmName = String(row["Project Manager"] ?? "").trim();
    const hours = Number(row["Hours per Week"] ?? 0);
    const activity = row["Activity"] ? String(row["Activity"]).trim() : null;
    const startDate = parseDate(row["Start Date"]);
    const endDate = parseDate(row["End Date"]);
    const notes = row["Notes/Skillset"]
      ? String(row["Notes/Skillset"]).trim() || null
      : null;

    if (!resourceName || !projectName || !startDate || !endDate) continue;

    // Ensure resource exists
    if (!resourceIdMap[resourceName]) {
      if (!missingResources.has(resourceName)) {
        missingResources.add(resourceName);
        resourceIdx++;
        resourceIdMap[resourceName] = resourceIdx;
        resources.push({
          name: resourceName,
          resourceType: "TBD",
          level: null,
          citizenship: null,
          badged: false,
          location: null,
          expertiseArea: null,
          practiceId: null,
        });
      }
    }

    // Ensure project exists
    if (!projectIdMap[projectName]) {
      projects.push({
        name: projectName,
        isContingent: false,
        citizenshipRequired: null,
        contingentSalesRep: null,
        status: "Active",
        isPTO: projectName.includes("PTO"),
      });
      projectIdMap[projectName] = projects.length;
    }

    // PM lookup
    let pmId: number | null = null;
    if (pmName && !pmName.startsWith("TBD")) {
      if (!resourceIdMap[pmName]) {
        resourceIdx++;
        resourceIdMap[pmName] = resourceIdx;
        resources.push({
          name: pmName,
          resourceType: "EE (050)",
          level: null,
          citizenship: null,
          badged: false,
          location: null,
          expertiseArea: null,
          practiceId: practiceIdMap["PM"] ?? null,
        });
      }
      pmId = resourceIdMap[pmName];
    }

    assignments.push({
      resourceId: resourceIdMap[resourceName],
      projectId: projectIdMap[projectName],
      pmId,
      hoursPerWeek: hours,
      activity,
      startDate,
      endDate,
      notes,
    });
  }

  if (missingResources.size > 0) {
    console.log(
      `Added ${missingResources.size} resources not in Resource List but found in Data Sheet`
    );
  }

  const seedData = { practices, resources, projects, assignments };

  const outPath = path.join(__dirname, "seed-data.json");
  fs.writeFileSync(outPath, JSON.stringify(seedData, null, 2));
  console.log(`Wrote seed-data.json:`);
  console.log(`  ${practices.length} practices`);
  console.log(`  ${resources.length} resources`);
  console.log(`  ${projects.length} projects`);
  console.log(`  ${assignments.length} assignments`);
}

main();
