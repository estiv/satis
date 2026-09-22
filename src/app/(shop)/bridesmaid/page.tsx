import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { DressGrid } from "@/components/dress-card";

export default async function BridesmaidPage() {
  const dresses = await prisma.dress.findMany({
    where: { deletedAt: null, listedPublic: true, category: "BRIDESMAID" },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageHeader
        title="Bridesmaid dresses"
        subtitle="Coordinated bridal-party looks — enquire to reserve your dates."
      />
      <DressGrid dresses={dresses} hrefPrefix="/dresses" />
    </div>
  );
}
