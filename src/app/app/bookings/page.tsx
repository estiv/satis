import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUSES, DRESS_CATEGORIES, isoDate } from "@/core/labels";
import { money, num } from "@/core/money";
import { Badge, PageHeader, chipClass } from "@/components/ui";
import { bookingRange } from "@/modules/bookings/availability";

function formatRange(b: {
  pickupDate: Date | null;
  returnDate: Date | null;
  eventDate: Date | null;
}) {
  const range = bookingRange(b);
  if (!range) return "—";
  const start = isoDate(range.start);
  const end = isoDate(range.end);
  return start === end ? start : `${start} → ${end}`;
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

  const dresses = await prisma.dress.findMany({
    where: { deletedAt: null, ...(category ? { category } : {}) },
    include: {
      lines: {
        where: {
          booking: { deletedAt: null, status: { not: "RETURNED" } },
        },
        include: { booking: { include: { customer: true } } },
        orderBy: { booking: { createdAt: "desc" } },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const booked = dresses.filter((dress) => dress.lines.length > 0);
  const unbooked = dresses.filter((dress) => dress.lines.length === 0);

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Booked dresses stay in the list. Unbooked dresses are here so you can book them. Returned bookings drop off."
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

      <h2 className="mb-2 text-lg font-semibold">Booked</h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Dress</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Dates</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Rental</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {booked.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted">
                  No current bookings.
                </td>
              </tr>
            ) : (
              booked.map((dress) => (
                <tr key={dress.id} className="border-b border-line/70 align-top last:border-0">
                  <td className="px-3 py-3">
                    <Link href={`/app/bookings/dress/${dress.id}`} className="flex items-center gap-3">
                      <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-line/40">
                        {dress.photoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/dresses/${dress.id}/photo`}
                            alt={dress.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-muted">—</div>
                        )}
                      </div>
                      <span>
                        <span className="block font-medium">{dress.name}</span>
                        <span className="block text-xs text-muted">{DRESS_CATEGORIES[dress.category]}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                        <ul className="flex flex-col gap-3">
                          {dress.lines.map((line) => (
                            <li key={line.id}>
                              <Link href={`/app/bookings/${line.booking.id}`} className="font-medium hover:text-teal">
                                {line.booking.customer.name}
                              </Link>
                              <p className="text-xs text-muted">{line.booking.customer.phone || "—"}</p>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3 text-muted">
                        <ul className="flex flex-col gap-3">
                          {dress.lines.map((line) => (
                            <li key={line.id}>{formatRange(line.booking)}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3">
                        <ul className="flex flex-col gap-3">
                          {dress.lines.map((line) => (
                            <li key={line.id}>{line.qty}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3">
                        <ul className="flex flex-col gap-3">
                          {dress.lines.map((line) => (
                            <li key={line.id} className="num">
                              {money(line.qty * num(line.unitRental))}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3">
                        <ul className="flex flex-col gap-3">
                          {dress.lines.map((line) => (
                            <li key={line.id}>
                              <Badge
                                tone={
                                  line.booking.status === "CANCELLED" || line.booking.status === "OVERDUE"
                                    ? "bad"
                                    : line.booking.status === "INQUIRY"
                                      ? "warn"
                                      : "teal"
                                }
                              >
                                {BOOKING_STATUSES[line.booking.status]}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-8 text-lg font-semibold">Unbooked</h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Dress</th>
              <th className="px-3 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {unbooked.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-10 text-center text-muted">
                  Every dress has a current booking.
                </td>
              </tr>
            ) : (
              unbooked.map((dress) => (
                <tr key={dress.id} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-3">
                    <Link href={`/app/bookings/dress/${dress.id}`} className="flex items-center gap-3">
                      <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md border border-line bg-line/40">
                        {dress.photoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/dresses/${dress.id}/photo`}
                            alt={dress.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-muted">—</div>
                        )}
                      </div>
                      <span>
                        <span className="block font-medium">{dress.name}</span>
                        <span className="block text-xs text-muted">{DRESS_CATEGORIES[dress.category]}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/app/bookings/dress/${dress.id}`} className={chipClass(true)}>
                      Book
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
