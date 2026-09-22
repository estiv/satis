import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money, num } from "@/core/money";
import { BOOKING_STATUSES, isoDate, startOfToday } from "@/core/labels";
import { ACTIVE_BOOKING_STATUSES } from "@/core/labels";
import { Badge, Card, PageHeader, Stat, buttonClass } from "@/components/ui";
import { DressThumbs } from "@/components/dress-thumbs";

export default async function DashboardPage() {
  await requireUser(["ADMIN", "STAFF"]);
  const today = startOfToday();

  const openBookings = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
    include: { lines: true, customer: true },
  });

  const moneyBookings = openBookings.filter((b) =>
    ["CONFIRMED", "PICKED_UP", "OVERDUE"].includes(b.status),
  );
  const bookedQty = moneyBookings.reduce((s, b) => s + b.lines.reduce((q, l) => q + l.qty, 0), 0);
  const rentalMoney = moneyBookings.reduce((s, b) => s + num(b.rentalTotal), 0);
  const depositHeld = openBookings
    .filter((b) => b.depositHeld && ["CONFIRMED", "PICKED_UP", "OVERDUE", "INQUIRY"].includes(b.status))
    .reduce((s, b) => s + num(b.depositTotal), 0);

  const followUps = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["RETURNED", "CANCELLED"] },
      followUpDate: { lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    },
    include: { customer: true, lines: { include: { dress: true } } },
    orderBy: { followUpDate: "asc" },
    take: 20,
  });

  const dressCount = await prisma.dress.count({ where: { deletedAt: null } });
  const inquiries = openBookings.filter((b) => b.status === "INQUIRY").length;

  return (
    <div>
      <PageHeader
        title="Home"
        subtitle="Booked dresses, rental money, and deposits held."
        actions={
          <Link href="/app/bookings" className={buttonClass("primary")}>
            New booking
          </Link>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Dresses booked" value={String(bookedQty)} hint="Confirmed / out / overdue" />
        <Stat label="Rental total" value={money(rentalMoney)} tone="good" hint="Open confirmed hire" />
        <Stat label="Deposits held" value={money(depositHeld)} hint="Safety deposits still with shop" />
        <Stat label="Catalog" value={String(dressCount)} hint={`${inquiries} open enquiries`} />
      </div>

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Follow-ups due</h2>
          <Link href="/app/bookings" className="text-sm text-teal hover:underline">
            All bookings
          </Link>
        </div>
        {followUps.length === 0 ? (
          <p className="text-sm text-muted">Nothing due today.</p>
        ) : (
          <ul className="divide-y divide-line">
            {followUps.map((b) => {
              const overdue = b.followUpDate && b.followUpDate < today;
              const dresses = b.lines.map((l) => l.dress);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <DressThumbs dresses={dresses} size="sm" />
                    <div className="min-w-0">
                      <Link href={`/app/bookings/${b.id}`} className="font-medium hover:text-teal">
                        {b.customer.name}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {dresses.map((d) => d.name).join(", ") || "No dress"}
                      </p>
                      <p className="text-xs text-muted">
                        {isoDate(b.followUpDate)}
                        {b.followUpNote ? ` · ${b.followUpNote}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge tone={overdue ? "bad" : "warn"}>
                    {overdue ? "Overdue" : BOOKING_STATUSES[b.status]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
