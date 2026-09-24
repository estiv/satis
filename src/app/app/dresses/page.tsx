import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { chipClass, PageHeader } from "@/components/ui";
import { FormModal, DeleteButton } from "@/components/modal";
import { deleteDress, saveDress } from "@/modules/dresses/actions";
import { DressGrid } from "@/components/dress-card";
import { DressFields } from "@/components/dress-fields";
import { num } from "@/core/money";
import { DRESS_CATEGORIES, formatDressSizes } from "@/core/labels";

export default async function StaffDressesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireUser(["ADMIN", "STAFF"]);
  const sp = await searchParams;
  const category = sp.category === "BRIDESMAID" || sp.category === "OCCASIONAL" ? sp.category : undefined;
  const dresses = await prisma.dress.findMany({
    where: { deletedAt: null, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Dresses"
        subtitle="Add styles for the public Occasional and Bridesmaid shop."
        actions={
          <FormModal title="Add dress" trigger="Add dress" action={saveDress} submitLabel="Save dress">
            <DressFields />
          </FormModal>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/app/dresses" className={chipClass(!category)}>
          All
        </Link>
        <Link href="/app/dresses?category=OCCASIONAL" className={chipClass(category === "OCCASIONAL")}>
          Occasional
        </Link>
        <Link href="/app/dresses?category=BRIDESMAID" className={chipClass(category === "BRIDESMAID")}>
          Bridesmaid
        </Link>
      </div>
      <DressGrid dresses={dresses} hrefPrefix="/app/dresses" showQty showPrice />
      <div className="mt-6 space-y-3">
        {dresses.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-card p-3">
            <div>
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted">
                {DRESS_CATEGORIES[d.category]} · qty {d.qtyTotal}
                {formatDressSizes(d.size) ? ` · ${formatDressSizes(d.size)}` : ""}
                {!d.listedPublic ? " · hidden from shop" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FormModal
                title={`Edit ${d.name}`}
                trigger="Edit"
                triggerVariant="secondary"
                action={saveDress}
                compact
              >
                <input type="hidden" name="id" value={d.id} />
                <DressFields
                  dress={{
                    name: d.name,
                    category: d.category,
                    size: d.size,
                    color: d.color,
                    notes: d.notes,
                    qtyTotal: d.qtyTotal,
                    rentalPrice: num(d.rentalPrice),
                    rentalPriceMax: num(d.rentalPriceMax),
                    depositAmount: num(d.depositAmount),
                    listedPublic: d.listedPublic,
                  }}
                />
              </FormModal>
              <DeleteButton
                action={deleteDress}
                id={d.id}
                label="Delete"
                confirmMessage={`Remove ${d.name} from the catalog?`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
