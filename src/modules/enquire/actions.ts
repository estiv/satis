"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { opt, str, type ActionState } from "@/lib/form";
import { parseDate } from "@/core/labels";
import { dec } from "@/core/money";
import { assertAvailability, bookingRange } from "@/modules/bookings/availability";

export async function enquireAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const name = str(formData, "name");
    const phone = str(formData, "phone");
    const dressId = str(formData, "dressId");
    const eventDate = parseDate(str(formData, "eventDate"));
    const pickupDate = parseDate(str(formData, "pickupDate")) || eventDate;
    const returnDate = parseDate(str(formData, "returnDate")) || eventDate;
    const notes = opt(formData, "notes");
    const qty = Math.max(1, Math.floor(Number(str(formData, "qty")) || 1));

    if (!name) return { error: "Please enter your name." };
    if (!phone) return { error: "Please enter your phone number." };
    if (!dressId) return { error: "Dress is required." };
    if (!eventDate && !pickupDate) return { error: "Please choose an event or hire date." };

    const dress = await prisma.dress.findFirst({
      where: { id: dressId, deletedAt: null, listedPublic: true },
    });
    if (!dress) return { error: "That dress is no longer listed." };

    const range = bookingRange({ pickupDate, returnDate, eventDate });
    if (!range) return { error: "Please choose valid dates." };

    await assertAvailability([{ dressId, qty }], range);

    const customer = await prisma.customer.create({
      data: { name, phone, notes: notes ?? null },
    });

    const followUp = new Date();
    followUp.setHours(12, 0, 0, 0);

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        eventDate,
        pickupDate,
        returnDate,
        status: "INQUIRY",
        source: "WEB_ENQUIRE",
        followUpDate: followUp,
        followUpNote: "Web enquiry — call customer to confirm fitting and deposit.",
        notes: notes ?? null,
        rentalTotal: dec(qty * Number(dress.rentalPrice)),
        depositTotal: dec(qty * Number(dress.depositAmount)),
        depositHeld: false,
        lines: {
          create: [
            {
              dressId: dress.id,
              qty,
              unitRental: dress.rentalPrice,
              unitDeposit: dress.depositAmount,
            },
          ],
        },
      },
    });

    revalidatePath("/app/bookings");
    revalidatePath("/app/dashboard");
    revalidatePath(`/dresses/${dressId}`);
    return { ok: true, id: booking.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not send enquiry." };
  }
}
