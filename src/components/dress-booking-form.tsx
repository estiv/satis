"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/form";
import { saveBooking } from "@/modules/bookings/actions";
import { BookingLinesEditor, type DressOption } from "@/components/booking-lines";
import { CustomerSearchSelect } from "@/components/customer-search-select";
import { money, roundMoney } from "@/core/money";
import { Button, Field, FormError, FormOk, Input, Textarea, chipClass } from "@/components/ui";

export function DressBookingForm({
  dressId,
  rentalPrice,
  customers,
  dresses,
}: {
  dressId: string;
  rentalPrice: number;
  customers: { id: string; name: string; phone: string | null }[];
  dresses: DressOption[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveBooking, {} as ActionState);
  const [customerMode, setCustomerMode] = useState<"new" | "existing">("new");
  const [eventDate, setEventDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [totalPrice, setTotalPrice] = useState(rentalPrice);
  const [paidCash, setPaidCash] = useState("");
  const [paidBank, setPaidBank] = useState<string | null>(null);
  const [depositTotal, setDepositTotal] = useState(0);
  const onTotalChange = useCallback((total: number) => setTotalPrice(total), []);
  const onDepositChange = useCallback((total: number) => setDepositTotal(total), []);
  const cashAmount = Math.min(Math.max(0, Number(paidCash) || 0), Math.max(0, depositTotal));
  const bankShown = paidBank === null ? String(roundMoney(Math.max(0, totalPrice))) : paidBank;
  const bankAmount = Math.min(Math.max(0, Number(bankShown) || 0), Math.max(0, totalPrice));

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, state.id, router]);

  useEffect(() => {
    if (paidCash === "") return;
    const n = Number(paidCash);
    if (Number.isFinite(n) && n > depositTotal) setPaidCash(String(depositTotal));
  }, [depositTotal, paidCash]);

  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chipClass(customerMode === "new")} onClick={() => setCustomerMode("new")}>
          New customer
        </button>
        <button
          type="button"
          className={chipClass(customerMode === "existing")}
          onClick={() => setCustomerMode("existing")}
          disabled={customers.length === 0}
        >
          Existing customer
        </button>
      </div>
      {customerMode === "existing" ? (
        <Field label="Customer">
          <CustomerSearchSelect customers={customers} required />
        </Field>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input name="customerName" required placeholder="Customer name" />
          </Field>
          <Field label="Phone">
            <Input name="customerPhone" required placeholder="Phone number" />
          </Field>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Event date">
          <Input
            name="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => {
              const next = e.target.value;
              setEventDate(next);
              if (pickupDate && next && pickupDate > next) setPickupDate(next);
            }}
          />
        </Field>
        <Field label="Pickup">
          <Input
            name="pickupDate"
            type="date"
            max={eventDate || undefined}
            value={pickupDate}
            onChange={(e) => {
              const next = e.target.value;
              setPickupDate(next);
              if (returnDate && next && returnDate < next) setReturnDate(next);
            }}
          />
        </Field>
        <Field label="Return">
          <Input
            name="returnDate"
            type="date"
            min={pickupDate || undefined}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </Field>
      </div>
      <input type="hidden" name="status" value="CONFIRMED" />
      <input type="hidden" name="depositHeld" value="1" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Follow-up date">
          <Input name="followUpDate" type="date" />
        </Field>
        <Field label="Follow-up note">
          <Input name="followUpNote" placeholder="Call for fitting…" />
        </Field>
      </div>
      <BookingLinesEditor
        key={state.ok ? String(state.id) : "form"}
        canAdd={false}
        lockDress
        onTotalChange={onTotalChange}
        onDepositChange={onDepositChange}
        dresses={dresses}
        initial={[
          {
            dressId,
            qty: 1,
            unitRental: rentalPrice,
            unitDeposit: "",
          },
        ]}
      />
      <Field label="Notes">
        <Textarea name="notes" />
      </Field>
      <Field label="Deposit paid in cash">
        <Input
          inputMode="decimal"
          placeholder="0"
          value={paidCash}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setPaidCash("");
              return;
            }
            const n = Number(raw);
            if (!Number.isFinite(n) || n < 0) return;
            setPaidCash(n > depositTotal ? String(depositTotal) : raw);
          }}
        />
      </Field>
      <Field label="Rental price paid in cash">
        <Input
          inputMode="decimal"
          value={bankShown}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setPaidBank("");
              return;
            }
            const n = Number(raw);
            if (!Number.isFinite(n) || n < 0) return;
            setPaidBank(n > totalPrice ? String(totalPrice) : raw);
          }}
        />
      </Field>
      <input
        type="hidden"
        name="moneyNotes"
        value={`Deposit paid in cash ${money(cashAmount)}; Rental price paid in cash ${money(bankAmount)}`}
      />
      <FormError state={state} />
      <FormOk state={state} message="Booking saved." />
      <Button type="submit" disabled={pending} className="w-full min-h-11">
        {pending ? "Saving…" : "Save booking"}
      </Button>
    </form>
  );
}
