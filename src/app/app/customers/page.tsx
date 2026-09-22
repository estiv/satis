import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { FormModal, DeleteButton } from "@/components/modal";
import { deleteCustomer, saveCustomer } from "@/modules/customers/actions";

function CustomerFields({
  customer,
}: {
  customer?: { name: string; phone: string | null; notes: string | null };
}) {
  return (
    <>
      <Field label="Name">
        <Input name="name" required defaultValue={customer?.name} />
      </Field>
      <Field label="Phone">
        <Input name="phone" defaultValue={customer?.phone ?? ""} />
      </Field>
      <Field label="Notes">
        <Textarea name="notes" defaultValue={customer?.notes ?? ""} />
      </Field>
    </>
  );
}

export default async function CustomersPage() {
  await requireUser(["ADMIN", "STAFF"]);
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { bookings: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="People who hire dresses — from the shop or web enquiries."
        actions={
          <FormModal title="Add customer" trigger="Add customer" action={saveCustomer}>
            <CustomerFields />
          </FormModal>
        }
      />
      <div className="flex flex-col gap-3">
        {customers.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted">
                  {c.phone || "No phone"} · {c._count.bookings} booking
                  {c._count.bookings === 1 ? "" : "s"}
                </p>
                {c.notes ? <p className="mt-1 text-xs text-muted">{c.notes}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <FormModal
                  title={`Edit ${c.name}`}
                  trigger="Edit"
                  triggerVariant="secondary"
                  action={saveCustomer}
                  compact
                >
                  <input type="hidden" name="id" value={c.id} />
                  <CustomerFields customer={c} />
                </FormModal>
                <DeleteButton
                  action={deleteCustomer}
                  id={c.id}
                  label="Delete"
                  confirmMessage={`Remove ${c.name}?`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
