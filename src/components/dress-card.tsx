import Link from "next/link";
import { money, num } from "@/core/money";
import { DRESS_CATEGORIES } from "@/core/labels";
import type { Dress, DressCategory } from "@prisma/client";
import { Badge } from "./ui";

export function DressThumb({
  dress,
  href,
  showQty,
  showPrice,
}: {
  dress: Pick<
    Dress,
    "id" | "name" | "category" | "size" | "color" | "rentalPrice" | "qtyTotal" | "photoPath" | "listedPublic"
  >;
  href: string;
  showQty?: boolean;
  showPrice?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition hover:border-teal/40 hover:shadow"
    >
      <div className="aspect-[3/4] bg-line/40">
        {dress.photoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/dresses/${dress.id}/photo`}
            alt={dress.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold leading-snug">{dress.name}</p>
          {!dress.listedPublic ? <Badge tone="warn">Hidden</Badge> : null}
        </div>
        <p className="text-xs text-muted">
          {DRESS_CATEGORIES[dress.category as DressCategory]}
          {dress.size ? ` · ${dress.size}` : ""}
          {dress.color ? ` · ${dress.color}` : ""}
        </p>
        {showPrice ? (
          <p className="mt-auto pt-2 text-sm font-semibold text-teal-dark num">{money(dress.rentalPrice)}</p>
        ) : null}
        {showQty ? <p className="text-xs text-muted">Qty {dress.qtyTotal}</p> : null}
      </div>
    </Link>
  );
}

export function DressGrid({
  dresses,
  hrefPrefix,
  showQty,
  showPrice,
}: {
  dresses: Parameters<typeof DressThumb>[0]["dress"][];
  hrefPrefix: string;
  showQty?: boolean;
  showPrice?: boolean;
}) {
  if (dresses.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">No dresses listed yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {dresses.map((d) => (
        <DressThumb
          key={d.id}
          dress={d}
          href={`${hrefPrefix}/${d.id}`}
          showQty={showQty}
          showPrice={showPrice}
        />
      ))}
    </div>
  );
}

export function formatPrice(v: unknown) {
  return money(num(v));
}
