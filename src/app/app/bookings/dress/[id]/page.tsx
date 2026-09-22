import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money, num } from "@/core/money";
import { BOOKING_STATUSES, DRESS_CATEGORIES } from "@/core/labels";
import { Badge, Card, PageHeader, Stat, chipClass, buttonClass } from "@/components/ui";
import { type DressOption } from "@/components/booking-lines";
import { markBookingReturned } from "@/modules/bookings/actions";
import { bookingRange } from "@/modules/bookings/availability";
import { ConfirmForm } from "@/components/modal";
import { DressBookingForm } from "@/components/dress-booking-form";
import { isoDate } from "@/core/labels";
import type { BookingStatus } from "@prisma/client";

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

export default async function DressBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser(["ADMIN", "STAFF"]);
  const { id } = await params;
  const sp = await searchParams;
  const statusFilter =
    sp.status && sp.status in BOOKING_STATUSES ? (sp.status as BookingStatus) : undefined;

  const [dress, customers, dressRows] = await Promise.all([
    prisma.dress.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: {
          where: {
            booking: {
              deletedAt: null,
              ...(statusFilter ? { status: statusFilter } : {}),
            },
          },
          include: {
            booking: { include: { customer: true } },
          },
          orderBy: { booking: { createdAt: "desc" } },
        },
      },
    }),
    prisma.customer.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.dress.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);
  if (!dress) notFound();

  const dresses: DressOption[] = dressRows.map((d) => ({
    id: d.id,
    name: d.name,
    rentalPrice: num(d.rentalPrice),
    depositAmount: num(d.depositAmount),
    qtyTotal: d.qtyTotal,
  }));

  const history = dress.lines.map((l) => ({
    lineId: l.id,
    qty: l.qty,
    unitRental: num(l.unitRental),
    unitDeposit: num(l.unitDeposit),
    booking: l.booking,
  }));

  // Totals for this dress across all statuses (not just filtered view)
  const allLines = await prisma.bookingLine.findMany({
    where: {
      dressId: dress.id,
      booking: { deletedAt: null },
    },
    include: { booking: { select: { status: true } } },
  });
  const earned = allLines
    .filter((l) => l.booking.status === "RETURNED")
    .reduce((s, l) => s + l.qty * num(l.unitRental), 0);
  const openMoney = allLines
    .filter((l) => ["CONFIRMED", "PICKED_UP", "OVERDUE", "INQUIRY"].includes(l.booking.status))
    .reduce((s, l) => s + l.qty * num(l.unitRental), 0);

  return (
    <div>
      <PageHeader
        title={dress.name}
        subtitle={`${DRESS_CATEGORIES[dress.category]}${dress.size ? ` · ${dress.size}` : ""}${dress.color ? ` · ${dress.color}` : ""} · qty ${dress.qtyTotal}`}
        actions={
          <Link href="/app/bookings" className={buttonClass("secondary")}>
            ← All dresses
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="overflow-hidden rounded-2xl border border-line bg-line/30">
          <div className="aspect-[3/4]">
            {dress.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/dresses/${dress.id}/photo`}
                alt={dress.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">No photo</div>
            )}
          </div>
        </div>

        <Card>
          <h2 className="text-lg font-semibold">New booking</h2>
          <p className="mt-1 text-sm text-muted">
            Rental {money(dress.rentalPrice)} · deposit {money(dress.depositAmount)}
          </p>
          <DressBookingForm
            dressId={dress.id}
            rentalPrice={num(dress.rentalPrice)}
            depositAmount={num(dress.depositAmount)}
            customers={customers}
            dresses={dresses}
          />
        </Card>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat
          label="Total gained (returned)"
          value={money(earned)}
          tone="good"
          hint="Rental money from returned hires of this dress"
        />
        <Stat label="Open rental value" value={money(openMoney)} hint="Inquiry / confirmed / out" />
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Booking history</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/bookings/dress/${dress.id}`} className={chipClass(!statusFilter)}>
              All
            </Link>
            {Object.entries(BOOKING_STATUSES).map(([k, v]) => (
              <Link
                key={k}
                href={`/app/bookings/dress/${dress.id}?status=${k}`}
                className={chipClass(statusFilter === k)}
              >
                {v}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Customer</th>
                <th className="py-2 pr-3 font-medium">Dates</th>
                <th className="py-2 pr-3 font-medium">Qty</th>
                <th className="py-2 pr-3 font-medium">Rental</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No bookings yet for this dress.
                  </td>
                </tr>
              ) : (
                history.map((h) => {
                  const canReturn =
                    h.booking.status === "PICKED_UP" ||
                    h.booking.status === "OVERDUE" ||
                    h.booking.status === "CONFIRMED";
                  return (
                    <tr key={h.lineId} className="border-b border-line/70">
                      <td className="py-3 pr-3">
                        <Link
                          href={`/app/bookings/${h.booking.id}`}
                          className="font-medium hover:text-teal"
                        >
                          {h.booking.customer.name}
                        </Link>
                        <p className="text-xs text-muted">{h.booking.customer.phone || "—"}</p>
                      </td>
                      <td className="py-3 pr-3 text-muted">{formatRange(h.booking)}</td>
                      <td className="py-3 pr-3">{h.qty}</td>
                      <td className="py-3 pr-3 num">{money(h.qty * h.unitRental)}</td>
                      <td className="py-3 pr-3">
                        <Badge
                          tone={
                            h.booking.status === "RETURNED"
                              ? "good"
                              : h.booking.status === "CANCELLED" || h.booking.status === "OVERDUE"
                                ? "bad"
                                : h.booking.status === "INQUIRY"
                                  ? "warn"
                                  : "teal"
                          }
                        >
                          {BOOKING_STATUSES[h.booking.status]}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {canReturn ? (
                          <ConfirmForm
                            action={markBookingReturned}
                            label="Returned"
                            variant="secondary"
                            confirmMessage={`Mark ${h.booking.customer.name}'s booking as returned? Deposit held will be cleared.`}
                          >
                            <input type="hidden" name="id" value={h.booking.id} />
                          </ConfirmForm>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
