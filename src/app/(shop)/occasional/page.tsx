import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { DressGrid } from "@/components/dress-card";

export default async function OccasionalPage() {
  const dresses = await prisma.dress.findMany({
    where: { deletedAt: null, listedPublic: true, category: "OCCASIONAL" },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageHeader
        title="Occasional dresses"
        subtitle="Evening, cocktail, and celebration hire — check dates on each dress."
      />
      <DressGrid dresses={dresses} hrefPrefix="/dresses" />
    </div>
  );
}
