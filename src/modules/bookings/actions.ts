"use server";

import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { bool, opt, str, type ActionState } from "@/lib/form";
import { dec } from "@/core/money";
import { parseDate } from "@/core/labels";
import {
  assertAvailability,
  bookingRange,
  lineTotals,
} from "@/modules/bookings/availability";

function parseLines(formData: FormData) {
  const dressIds = formData.getAll("line_dressId").map((v) => String(v));
  const qtys = formData.getAll("line_qty").map((v) => Number(v) || 1);
  const rentals = formData.getAll("line_unitRental").map((v) => Number(String(v).replace(/,/g, "")) || 0);
  const deposits = formData.getAll("line_unitDeposit").map((v) => Number(String(v).replace(/,/g, "")) || 0);
  const lines: { dressId: string; qty: number; unitRental: number; unitDeposit: number }[] = [];
  for (let i = 0; i < dressIds.length; i++) {
    if (!dressIds[i]) continue;
    lines.push({
      dressId: dressIds[i],
      qty: Math.max(1, Math.floor(qtys[i] || 1)),
      unitRental: rentals[i] ?? 0,
      unitDeposit: deposits[i] ?? 0,
    });
  }
  return lines;
}

function revalidateBooking(id?: string, dressIds?: string[]) {
  revalidatePath("/app/bookings");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/dresses");
  if (id) revalidatePath(`/app/bookings/${id}`);
  for (const dressId of dressIds ?? []) {
    revalidatePath(`/app/bookings/dress/${dressId}`);
    revalidatePath(`/app/dresses/${dressId}`);
  }
}

export async function saveBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await requireUser(["ADMIN", "STAFF"]);
    const id = opt(formData, "id");
    const customerId = str(formData, "customerId");
    const customerName = str(formData, "customerName");
    const customerPhone = opt(formData, "customerPhone");

    let cid = customerId;
    if (!cid) {
      if (!customerName) return { error: "Customer is required." };
      const c = await prisma.customer.create({
        data: { name: customerName, phone: customerPhone ?? null },
      });
      cid = c.id;
    }

    const eventDate = parseDate(str(formData, "eventDate"));
    const pickupDate = parseDate(str(formData, "pickupDate"));
    const returnDate = parseDate(str(formData, "returnDate"));
    const followUpDate = parseDate(str(formData, "followUpDate"));
    const status = (str(formData, "status") || "CONFIRMED") as BookingStatus;
    const lines = parseLines(formData);
    if (lines.length === 0) return { error: "Add at least one dress line." };

    const range = bookingRange({ pickupDate, returnDate, eventDate });
    if (!range) return { error: "Set an event date or pickup/return dates." };

    await assertAvailability(lines, range, id);

    const totals = lineTotals(lines);
    const depositHeld = bool(formData, "depositHeld");

    const bookingData = {
      customerId: cid,
      eventDate,
      pickupDate,
      returnDate,
      status,
      followUpDate,
      followUpNote: opt(formData, "followUpNote") ?? null,
      rentalTotal: dec(totals.rental),
      depositTotal: dec(totals.deposit),
      depositHeld,
      moneyNotes: opt(formData, "moneyNotes") ?? null,
      notes: opt(formData, "notes") ?? null,
      source: "STAFF" as const,
      createdById: actor.id,
    };

    let bookingId = id;
    if (id) {
      await prisma.bookingLine.deleteMany({ where: { bookingId: id } });
      await prisma.booking.update({
        where: { id },
        data: {
          ...bookingData,
          lines: {
            create: lines.map((l) => ({
              dressId: l.dressId,
              qty: l.qty,
              unitRental: dec(l.unitRental),
              unitDeposit: dec(l.unitDeposit),
            })),
          },
        },
      });
      await audit(actor, "update", "Booking", id, `Updated booking (${status})`);
    } else {
      const created = await prisma.booking.create({
        data: {
          ...bookingData,
          lines: {
            create: lines.map((l) => ({
              dressId: l.dressId,
              qty: l.qty,
              unitRental: dec(l.unitRental),
              unitDeposit: dec(l.unitDeposit),
            })),
          },
        },
      });
      bookingId = created.id;
      await audit(actor, "create", "Booking", created.id, `Created booking (${status})`);
    }

    revalidateBooking(
      bookingId,
      lines.map((l) => l.dressId),
    );
    return { ok: true, id: bookingId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save booking." };
  }
}

export async function updateBookingStatus(formData: FormData) {
  const actor = await requireUser(["ADMIN", "STAFF"]);
  const id = str(formData, "id");
  const status = str(formData, "status") as BookingStatus;
  const followUpDate = parseDate(str(formData, "followUpDate"));
  const followUpNote = opt(formData, "followUpNote");
  const depositHeld = formData.has("depositHeld") ? bool(formData, "depositHeld") : undefined;

  const data: {
    status: BookingStatus;
    followUpDate?: Date | null;
    followUpNote?: string | null;
    depositHeld?: boolean;
  } = { status };
  if (formData.has("followUpDate")) data.followUpDate = followUpDate;
  if (followUpNote !== undefined) data.followUpNote = followUpNote ?? null;
  if (depositHeld !== undefined) data.depositHeld = depositHeld;
  if (status === "RETURNED" || status === "CANCELLED") data.depositHeld = false;

  const lines = await prisma.bookingLine.findMany({ where: { bookingId: id }, select: { dressId: true } });
  await prisma.booking.update({ where: { id }, data });
  await audit(actor, "update", "Booking", id, `Status → ${status}`);
  revalidateBooking(
    id,
    lines.map((l) => l.dressId),
  );
}

export async function markBookingReturned(formData: FormData) {
  const actor = await requireUser(["ADMIN", "STAFF"]);
  const id = str(formData, "id");
  const lines = await prisma.bookingLine.findMany({ where: { bookingId: id }, select: { dressId: true } });
  await prisma.booking.update({
    where: { id },
    data: { status: "RETURNED", depositHeld: false },
  });
  await audit(actor, "update", "Booking", id, "Marked returned");
  revalidateBooking(
    id,
    lines.map((l) => l.dressId),
  );
}

export async function deleteBooking(formData: FormData) {
  const actor = await requireUser(["ADMIN", "STAFF"]);
  const id = str(formData, "id");
  const lines = await prisma.bookingLine.findMany({ where: { bookingId: id }, select: { dressId: true } });
  await prisma.booking.update({
    where: { id },
    data: { deletedAt: new Date(), status: "CANCELLED", depositHeld: false },
  });
  await audit(actor, "delete", "Booking", id, "Cancelled/soft-deleted booking");
  revalidateBooking(
    id,
    lines.map((l) => l.dressId),
  );
}

/** Public date check — returns available qty for one dress. */
export async function checkDressAvailability(dressId: string, from: string, to: string) {
  const start = parseDate(from);
  const end = parseDate(to) || start;
  if (!start || !end) return { ok: false as const, error: "Pick dates." };
  const dress = await prisma.dress.findFirst({
    where: { id: dressId, deletedAt: null, listedPublic: true },
  });
  if (!dress) return { ok: false as const, error: "Dress not found." };
  const { availableQty } = await import("@/modules/bookings/availability");
  const free = await availableQty(dress.id, dress.qtyTotal, { start, end: end! });
  return { ok: true as const, available: free, total: dress.qtyTotal };
}
