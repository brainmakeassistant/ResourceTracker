import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/project-form";
import { notFound } from "next/navigation";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id: parseInt(id) },
  });

  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Project: {project.name}</h1>
      <ProjectForm initial={project} />
    </div>
  );
}
