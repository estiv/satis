import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "@/core/labels";
import { num } from "@/core/money";

/** Inclusive date range for a booking: prefer pickup→return, else event day. */
export function bookingRange(b: {
  pickupDate: Date | null;
  returnDate: Date | null;
  eventDate: Date | null;
}): { start: Date; end: Date } | null {
  if (b.pickupDate && b.returnDate) {
    return { start: b.pickupDate, end: b.returnDate };
  }
  if (b.pickupDate && b.eventDate) {
    return { start: b.pickupDate, end: b.eventDate };
  }
  if (b.eventDate && b.returnDate) {
    return { start: b.eventDate, end: b.returnDate };
  }
  if (b.eventDate) {
    return { start: b.eventDate, end: b.eventDate };
  }
  if (b.pickupDate) {
    return { start: b.pickupDate, end: b.pickupDate };
  }
  return null;
}

export function rangesOverlap(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
) {
  return a.start.getTime() <= b.end.getTime() && b.start.getTime() <= a.end.getTime();
}

/**
 * How many units of a dress are already committed on overlapping dates.
 */
export async function bookedQtyForDress(
  dressId: string,
  range: { start: Date; end: Date },
  excludeBookingId?: string,
) {
  const lines = await prisma.bookingLine.findMany({
    where: {
      dressId,
      booking: {
        deletedAt: null,
        status: { in: ACTIVE_BOOKING_STATUSES },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    },
    include: {
      booking: {
        select: {
          pickupDate: true,
          returnDate: true,
          eventDate: true,
          status: true,
        },
      },
    },
  });

  let used = 0;
  for (const line of lines) {
    const other = bookingRange(line.booking);
    if (!other) continue;
    if (rangesOverlap(range, other)) used += line.qty;
  }
  return used;
}

export async function availableQty(
  dressId: string,
  qtyTotal: number,
  range: { start: Date; end: Date },
  excludeBookingId?: string,
) {
  const used = await bookedQtyForDress(dressId, range, excludeBookingId);
  return Math.max(0, qtyTotal - used);
}

export async function assertAvailability(
  lines: { dressId: string; qty: number }[],
  range: { start: Date; end: Date },
  excludeBookingId?: string,
) {
  for (const line of lines) {
    if (line.qty < 1) throw new Error("Quantity must be at least 1.");
    const dress = await prisma.dress.findFirst({
      where: { id: line.dressId, deletedAt: null },
    });
    if (!dress) throw new Error("Dress not found.");
    const free = await availableQty(dress.id, dress.qtyTotal, range, excludeBookingId);
    if (line.qty > free) {
      throw new Error(
        `${dress.name}: only ${free} available for those dates (requested ${line.qty}).`,
      );
    }
  }
}

export function isDepositHeld(status: BookingStatus, depositHeld: boolean) {
  if (!depositHeld) return false;
  return status === "CONFIRMED" || status === "PICKED_UP" || status === "OVERDUE" || status === "INQUIRY";
}

export function lineTotals(lines: { qty: number; unitRental: unknown; unitDeposit: unknown }[]) {
  let rental = 0;
  let deposit = 0;
  let qty = 0;
  for (const l of lines) {
    rental += l.qty * num(l.unitRental);
    deposit += l.qty * num(l.unitDeposit);
    qty += l.qty;
  }
  return { rental, deposit, qty };
}
