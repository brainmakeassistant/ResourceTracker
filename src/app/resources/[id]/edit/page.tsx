import { prisma } from "@/lib/prisma";
import { ResourceForm } from "@/components/resource-form";
import { notFound } from "next/navigation";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resource, practices, managers] = await Promise.all([
    prisma.resource.findUnique({ where: { id: parseInt(id) } }),
    prisma.practice.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!resource) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Resource: {resource.name}</h1>
      <ResourceForm practices={practices} managers={managers} initial={resource} />
    </div>
  );
}
