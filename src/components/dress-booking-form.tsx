"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/form";
import { saveBooking } from "@/modules/bookings/actions";
import { BookingLinesEditor, type DressOption } from "@/components/booking-lines";
import { BOOKING_STATUSES } from "@/core/labels";
import { Button, Field, FormError, FormOk, Input, Select, Textarea } from "@/components/ui";

export function DressBookingForm({
  dressId,
  rentalPrice,
  depositAmount,
  customers,
  dresses,
}: {
  dressId: string;
  rentalPrice: number;
  depositAmount: number;
  customers: { id: string; name: string; phone: string | null }[];
  dresses: DressOption[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveBooking, {} as ActionState);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, state.id, router]);

  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <Field label="Existing customer (optional)">
        <Select name="customerId" defaultValue="">
          <option value="">New customer below…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` · ${c.phone}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="New customer name">
          <Input name="customerName" placeholder="If not selecting above" />
        </Field>
        <Field label="Phone">
          <Input name="customerPhone" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Event date">
          <Input name="eventDate" type="date" />
        </Field>
        <Field label="Pickup">
          <Input name="pickupDate" type="date" />
        </Field>
        <Field label="Return">
          <Input name="returnDate" type="date" />
        </Field>
      </div>
      <Field label="Status">
        <Select name="status" defaultValue="CONFIRMED">
          {Object.entries(BOOKING_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Follow-up date">
          <Input name="followUpDate" type="date" />
        </Field>
        <Field label="Hold deposit">
          <Select name="depositHeld" defaultValue="1">
            <option value="1">Yes</option>
            <option value="0">No</option>
          </Select>
        </Field>
      </div>
      <Field label="Follow-up note">
        <Input name="followUpNote" placeholder="Call for fitting…" />
      </Field>
      <BookingLinesEditor
        key={state.ok ? String(state.id) : "form"}
        dresses={dresses}
        initial={[
          {
            dressId,
            qty: 1,
            unitRental: rentalPrice,
            unitDeposit: depositAmount,
          },
        ]}
      />
      <Field label="Notes">
        <Textarea name="notes" />
      </Field>
      <Field label="Money notes">
        <Input name="moneyNotes" placeholder="Deposit paid in cash…" />
      </Field>
      <FormError state={state} />
      <FormOk state={state} message="Booking saved." />
      <Button type="submit" disabled={pending} className="w-full min-h-11">
        {pending ? "Saving…" : "Save booking"}
      </Button>
    </form>
  );
}
