import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DRESS_CATEGORIES } from "@/core/labels";
import { Badge, Card } from "@/components/ui";
import { EnquireForm } from "@/components/enquire-form";

export default async function PublicDressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dress = await prisma.dress.findFirst({
    where: { id, deletedAt: null, listedPublic: true },
  });
  if (!dress) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-line bg-line/30">
        <div className="aspect-[3/4]">
          {dress.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/dresses/${dress.id}/photo`}
              alt={dress.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">No photo yet</div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <Badge tone="teal">{DRESS_CATEGORIES[dress.category]}</Badge>
          <h1 className="mt-2 text-3xl font-semibold">{dress.name}</h1>
          <p className="mt-2 text-muted">
            {[dress.size && `Size ${dress.size}`, dress.color].filter(Boolean).join(" · ") || "—"}
          </p>
          {dress.notes ? <p className="mt-4 text-sm text-muted">{dress.notes}</p> : null}
        </div>
        <Card>
          <p className="text-sm text-muted">
            We have <span className="font-semibold text-ink">{dress.qtyTotal}</span> of this style in
            stock. Availability for your dates is checked when you enquire. Pricing is confirmed with
            you in person.
          </p>
        </Card>
        <EnquireForm dressId={dress.id} dressName={dress.name} />
      </div>
    </div>
  );
}
