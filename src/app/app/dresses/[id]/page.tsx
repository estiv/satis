import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/core/money";
import { BOOKING_STATUSES, DRESS_CATEGORIES, isoDate } from "@/core/labels";
import { Badge, Card, PageHeader, buttonClass } from "@/components/ui";
import { bookingRange } from "@/modules/bookings/availability";

export default async function StaffDressDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["ADMIN", "STAFF"]);
  const { id } = await params;
  const dress = await prisma.dress.findFirst({
    where: { id, deletedAt: null },
    include: {
      lines: {
        include: {
          booking: { include: { customer: true } },
        },
        orderBy: { booking: { createdAt: "desc" } },
        take: 30,
      },
    },
  });
  if (!dress) notFound();

  const bookings = dress.lines.filter((l) => !l.booking.deletedAt).map((l) => l.booking);

  return (
    <div>
      <PageHeader
        title={dress.name}
        subtitle={`${DRESS_CATEGORIES[dress.category]} · qty ${dress.qtyTotal} · ${money(dress.rentalPrice)}`}
        actions={
          <Link href={`/app/bookings/dress/${dress.id}`} className={buttonClass("primary")}>
            Book / history
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-line/30">
          {dress.photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/dresses/${dress.id}/photo`} alt={dress.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">No photo</div>
          )}
        </div>
        <Card>
          <h2 className="font-semibold">Recent bookings</h2>
          <ul className="mt-3 divide-y divide-line">
            {bookings.length === 0 ? (
              <li className="py-4 text-sm text-muted">None yet.</li>
            ) : (
              bookings.map((b) => {
                const range = bookingRange(b);
                return (
                  <li key={b.id} className="flex justify-between gap-2 py-3 text-sm">
                    <div>
                      <Link href={`/app/bookings/${b.id}`} className="font-medium hover:text-teal">
                        {b.customer.name}
                      </Link>
                      <p className="text-xs text-muted">
                        {range ? `${isoDate(range.start)} → ${isoDate(range.end)}` : "—"}
                      </p>
                    </div>
                    <Badge tone={b.status === "CANCELLED" ? "bad" : "teal"}>
                      {BOOKING_STATUSES[b.status]}
                    </Badge>
                  </li>
                );
              })
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
