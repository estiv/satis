import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { FormModal } from "@/components/modal";
import { saveSettings } from "@/modules/users/actions";
import { MODULES } from "@/core/modules";
import { COMPANY_SETTINGS_ID, COMPANY_DEFAULT } from "@/core/app-version";
import { num } from "@/core/money";

export default async function SettingsPage() {
  await requireUser(["ADMIN"]);
  const s = await prisma.companySettings.findUnique({ where: { id: COMPANY_SETTINGS_ID } });
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Shop name, contact, currency, and which staff modules are on."
        actions={
          <FormModal title="Edit settings" trigger="Edit settings" action={saveSettings} submitLabel="Save">
            <Field label="Shop name">
              <Input name="name" defaultValue={s?.name ?? COMPANY_DEFAULT} />
            </Field>
            <Field label="Phone">
              <Input name="phone" defaultValue={s?.phone ?? ""} />
            </Field>
            <Field label="Address">
              <Input name="address" defaultValue={s?.address ?? ""} />
            </Field>
            <Field label="About text (homepage)">
              <Textarea name="aboutText" defaultValue={s?.aboutText ?? ""} />
            </Field>
            <Field label="Currency">
              <Input name="currency" defaultValue={s?.currency ?? "ETB"} />
            </Field>
            <Field label="Default deposit amount">
              <Input name="defaultDeposit" inputMode="decimal" defaultValue={String(num(s?.defaultDeposit))} />
            </Field>
            <Field
              label="Enabled modules JSON"
              hint={`Known ids: ${MODULES.map((m) => m.id).join(", ")}. Use [] for all.`}
            >
              <Textarea name="enabledModules" defaultValue={s?.enabledModules ?? "[]"} />
            </Field>
          </FormModal>
        }
      />
      <Card>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Shop</dt>
            <dd>{s?.name ?? COMPANY_DEFAULT}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Phone</dt>
            <dd>{s?.phone || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Address</dt>
            <dd>{s?.address || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Currency</dt>
            <dd>{s?.currency ?? "ETB"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
