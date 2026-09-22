import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money, num } from "@/core/money";
import { BOOKING_STATUSES, isoDate } from "@/core/labels";
import { Badge, Card, Field, Input, PageHeader, Select, Textarea, buttonClass } from "@/components/ui";
import { FormModal } from "@/components/modal";
import { saveBooking, updateBookingStatus } from "@/modules/bookings/actions";
import { BookingLinesEditor, type DressOption } from "@/components/booking-lines";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["ADMIN", "STAFF"]);
  const { id } = await params;
  const [booking, customers, dressRows] = await Promise.all([
    prisma.booking.findFirst({
      where: { id, deletedAt: null },
      include: { customer: true, lines: { include: { dress: true } } },
    }),
    prisma.customer.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.dress.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);
  if (!booking) notFound();

  const dresses: DressOption[] = dressRows.map((d) => ({
    id: d.id,
    name: d.name,
    rentalPrice: num(d.rentalPrice),
    depositAmount: num(d.depositAmount),
    qtyTotal: d.qtyTotal,
  }));

  return (
    <div>
      <PageHeader
        title={booking.customer.name}
        subtitle={`${BOOKING_STATUSES[booking.status]} · rental ${money(booking.rentalTotal)} · deposit ${money(booking.depositTotal)}${booking.depositHeld ? " held" : ""}`}
        actions={
          <FormModal title="Edit booking" trigger="Edit" action={saveBooking} submitLabel="Save" xl>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="customerId" value={booking.customerId} />
            <Field label="Customer">
              <Select name="customerId" defaultValue={booking.customerId}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Event date">
                <Input name="eventDate" type="date" defaultValue={isoDate(booking.eventDate)} />
              </Field>
              <Field label="Pickup">
                <Input name="pickupDate" type="date" defaultValue={isoDate(booking.pickupDate)} />
              </Field>
              <Field label="Return">
                <Input name="returnDate" type="date" defaultValue={isoDate(booking.returnDate)} />
              </Field>
            </div>
            <Field label="Status">
              <Select name="status" defaultValue={booking.status}>
                {Object.entries(BOOKING_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Follow-up date">
                <Input name="followUpDate" type="date" defaultValue={isoDate(booking.followUpDate)} />
              </Field>
              <Field label="Hold deposit">
                <Select name="depositHeld" defaultValue={booking.depositHeld ? "1" : "0"}>
                  <option value="1">Yes</option>
                  <option value="0">No / returned</option>
                </Select>
              </Field>
            </div>
            <Field label="Follow-up note">
              <Input name="followUpNote" defaultValue={booking.followUpNote ?? ""} />
            </Field>
            <BookingLinesEditor
              dresses={dresses}
              initial={booking.lines.map((l) => ({
                dressId: l.dressId,
                qty: l.qty,
                unitRental: num(l.unitRental),
                unitDeposit: num(l.unitDeposit),
              }))}
            />
            <Field label="Notes">
              <Textarea name="notes" defaultValue={booking.notes ?? ""} />
            </Field>
            <Field label="Money notes">
              <Input name="moneyNotes" defaultValue={booking.moneyNotes ?? ""} />
            </Field>
          </FormModal>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold">Dresses</h2>
          {booking.lines.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">No dresses on this booking.</p>
            </Card>
          ) : (
            <div className={`grid gap-4 ${booking.lines.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {booking.lines.map((l) => (
                <Link
                  key={l.id}
                  href={`/app/dresses/${l.dressId}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition hover:border-teal/40"
                >
                  <div className="aspect-[3/4] bg-line/40">
                    {l.dress.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/dresses/${l.dressId}/photo`}
                        alt={l.dress.name}
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">No photo</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold leading-snug">{l.dress.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      Qty {l.qty} · {money(num(l.unitRental) * l.qty)}
                      <span className="text-muted"> + dep {money(num(l.unitDeposit) * l.qty)}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="font-semibold">Booking details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Phone</dt>
                <dd>{booking.customer.phone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Event</dt>
                <dd>{isoDate(booking.eventDate) || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Pickup → return</dt>
                <dd>
                  {isoDate(booking.pickupDate) || "—"} → {isoDate(booking.returnDate) || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Source</dt>
                <dd>{booking.source === "WEB_ENQUIRE" ? "Web enquiry" : "Staff"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Follow-up</dt>
                <dd>
                  {isoDate(booking.followUpDate) || "—"}
                  {booking.followUpNote ? ` · ${booking.followUpNote}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Rental</dt>
                <dd className="font-semibold num">{money(booking.rentalTotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Deposit</dt>
                <dd className="num">
                  {money(booking.depositTotal)}
                  {booking.depositHeld ? " held" : ""}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Update status / follow-up</h2>
              <Badge tone="teal">{BOOKING_STATUSES[booking.status]}</Badge>
            </div>
            <form action={updateBookingStatus} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={booking.id} />
              <Field label="Status">
                <Select name="status" defaultValue={booking.status}>
                  {Object.entries(BOOKING_STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Follow-up date">
                <Input name="followUpDate" type="date" defaultValue={isoDate(booking.followUpDate)} />
              </Field>
              <Field label="Follow-up note">
                <Input name="followUpNote" defaultValue={booking.followUpNote ?? ""} />
              </Field>
              <Field label="Deposit held">
                <Select name="depositHeld" defaultValue={booking.depositHeld ? "1" : "0"}>
                  <option value="1">Held</option>
                  <option value="0">Returned / not held</option>
                </Select>
              </Field>
              <button type="submit" className={buttonClass("primary")}>
                Save status
              </button>
            </form>
            <p className="mt-3 text-xs text-muted">
              Setting Returned or Cancelled clears the deposit held flag.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
