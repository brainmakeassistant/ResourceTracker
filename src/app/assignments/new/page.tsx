import { prisma } from "@/lib/prisma";
import { AssignmentForm } from "@/components/assignment-form";

export default async function NewAssignmentPage() {
  const [resources, projects] = await Promise.all([
    prisma.resource.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.project.findMany({
      where: { status: "Active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add Assignment</h1>
      <AssignmentForm resources={resources} projects={projects} />
    </div>
  );
}
