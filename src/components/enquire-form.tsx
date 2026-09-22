"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/form";
import { enquireAction } from "@/modules/enquire/actions";
import { checkDressAvailability } from "@/modules/bookings/actions";
import { Button, Field, FormError, FormOk, Input, Textarea } from "./ui";

export function EnquireForm({
  dressId,
  dressName,
}: {
  dressId: string;
  dressName: string;
}) {
  const [state, action, pending] = useActionState(enquireAction, {} as ActionState);
  const [avail, setAvail] = useState<string | null>(null);

  async function onCheck(form: HTMLFormElement) {
    const fd = new FormData(form);
    const from = String(fd.get("pickupDate") || fd.get("eventDate") || "");
    const to = String(fd.get("returnDate") || from);
    if (!from) {
      setAvail("Pick an event or pickup date first.");
      return;
    }
    const res = await checkDressAvailability(dressId, from, to);
    if (!res.ok) setAvail(res.error ?? "Could not check dates.");
    else setAvail(`${res.available} of ${res.total} available for those dates.`);
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:p-5">
      <input type="hidden" name="dressId" value={dressId} />
      <h2 className="text-lg font-semibold">Enquire about {dressName}</h2>
      <p className="text-sm text-muted">
        We will call you to confirm fitting, dates, and the safety deposit. No payment online.
      </p>
      <Field label="Your name">
        <Input name="name" required placeholder="Full name" />
      </Field>
      <Field label="Phone">
        <Input name="phone" required placeholder="09…" />
      </Field>
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
      <Field label="Quantity">
        <Input name="qty" type="number" min={1} defaultValue={1} />
      </Field>
      <Field label="Notes (optional)">
        <Textarea name="notes" placeholder="Size preference, fitting time…" />
      </Field>
      {!state.ok && avail ? <p className="text-sm text-teal">{avail}</p> : null}
      <FormError state={state} />
      <FormOk state={state} message="Thank you — we received your enquiry and will follow up soon." />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest("form");
            if (form) void onCheck(form);
          }}
        >
          Check dates
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send enquiry"}
        </Button>
      </div>
    </form>
  );
}
