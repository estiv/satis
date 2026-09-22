import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { chipClass, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { FormModal, DeleteButton } from "@/components/modal";
import { deleteDress, saveDress } from "@/modules/dresses/actions";
import { DressGrid } from "@/components/dress-card";
import { num } from "@/core/money";
import { DRESS_CATEGORIES } from "@/core/labels";

function DressFields({
  dress,
}: {
  dress?: {
    name: string;
    category: string;
    size: string | null;
    color: string | null;
    notes: string | null;
    qtyTotal: number;
    rentalPrice: number;
    depositAmount: number;
    listedPublic: boolean;
  };
}) {
  return (
    <>
      <Field label="Name">
        <Input name="name" required defaultValue={dress?.name} />
      </Field>
      <Field label="Category">
        <Select name="category" defaultValue={dress?.category ?? "OCCASIONAL"}>
          {Object.entries(DRESS_CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Size">
          <Input name="size" defaultValue={dress?.size ?? ""} />
        </Field>
        <Field label="Color">
          <Input name="color" defaultValue={dress?.color ?? ""} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Quantity">
          <Input name="qtyTotal" inputMode="numeric" defaultValue={dress?.qtyTotal ?? 1} />
        </Field>
        <Field label="Rental price">
          <Input name="rentalPrice" inputMode="decimal" defaultValue={String(num(dress?.rentalPrice))} />
        </Field>
        <Field label="Default deposit">
          <Input
            name="depositAmount"
            inputMode="decimal"
            defaultValue={String(num(dress?.depositAmount))}
          />
        </Field>
      </div>
      <Field label="Show on public shop">
        <Select name="listedPublic" defaultValue={dress?.listedPublic === false ? "0" : "1"}>
          <option value="1">Yes — listed</option>
          <option value="0">No — staff only</option>
        </Select>
      </Field>
      <Field label="Notes">
        <Textarea name="notes" defaultValue={dress?.notes ?? ""} />
      </Field>
      <Field label="Photo" hint="JPG, PNG or WebP">
        <Input name="photo" type="file" accept="image/*" />
      </Field>
    </>
  );
}

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
