import { prisma } from "@/lib/prisma";
import { PTORequestForm } from "@/components/pto-form";

export default async function PTORequestPage() {
  const resources = await prisma.resource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Request Time Off</h1>
      <PTORequestForm resources={resources} />
    </div>
  );
}
