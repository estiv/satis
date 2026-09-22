import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES, DRESS_CATEGORIES } from "@/core/labels";
import { Badge, PageHeader, chipClass } from "@/components/ui";
import { bookingRange } from "@/modules/bookings/availability";
import { startOfToday } from "@/core/labels";

function isOutToday(booking: {
  status: string;
  pickupDate: Date | null;
  returnDate: Date | null;
  eventDate: Date | null;
}) {
  if (!["CONFIRMED", "PICKED_UP", "OVERDUE"].includes(booking.status)) return false;
  if (booking.status === "PICKED_UP" || booking.status === "OVERDUE") return true;
  const range = bookingRange(booking);
  if (!range) return false;
  const today = startOfToday();
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  return today.getTime() >= range.start.getTime() && today.getTime() <= end.getTime();
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireUser(["ADMIN", "STAFF"]);
  const sp = await searchParams;
  const category =
    sp.category === "OCCASIONAL" || sp.category === "BRIDESMAID" ? sp.category : undefined;

  const dressRows = await prisma.dress.findMany({
    where: { deletedAt: null, ...(category ? { category } : {}) },
    include: {
      lines: {
        where: {
          booking: {
            deletedAt: null,
            status: { in: ACTIVE_BOOKING_STATUSES },
          },
        },
        include: {
          booking: true,
        },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Tap a dress to book it, see history, and mark returns."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/app/bookings" className={chipClass(!category)}>
          All
        </Link>
        <Link href="/app/bookings?category=OCCASIONAL" className={chipClass(category === "OCCASIONAL")}>
          Occasional
        </Link>
        <Link href="/app/bookings?category=BRIDESMAID" className={chipClass(category === "BRIDESMAID")}>
          Bridesmaid
        </Link>
      </div>

      {dressRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No dresses yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {dressRows.map((d) => {
            const outToday = d.lines.some((l) => isOutToday(l.booking));
            return (
              <Link
                key={d.id}
                href={`/app/bookings/dress/${d.id}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition hover:border-teal/40 hover:shadow"
              >
                <div className="aspect-[3/4] bg-line/40">
                  {d.photoPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/dresses/${d.id}/photo`}
                      alt={d.name}
                      className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
                  )}
                </div>
                {outToday ? (
                  <div className="absolute left-2 top-2">
                    <Badge tone="bad">Booked</Badge>
                  </div>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-3 pt-10">
                  <p className="truncate text-sm font-semibold text-white">{d.name}</p>
                  <p className="truncate text-[11px] text-white/75">{DRESS_CATEGORIES[d.category]}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
