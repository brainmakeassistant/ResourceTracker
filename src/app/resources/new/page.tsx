import { prisma } from "@/lib/prisma";
import { ResourceForm } from "@/components/resource-form";

export default async function NewResourcePage() {
  const [practices, managers] = await Promise.all([
    prisma.practice.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add Resource</h1>
      <ResourceForm practices={practices} managers={managers} />
    </div>
  );
}
