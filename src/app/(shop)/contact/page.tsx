import { prisma } from "@/lib/prisma";
import { COMPANY_SETTINGS_ID } from "@/core/app-version";
import { Card, PageHeader } from "@/components/ui";

export default async function ContactPage() {
  const settings = await prisma.companySettings.findUnique({ where: { id: COMPANY_SETTINGS_ID } });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Contact & how to rent" subtitle="Visit us for fittings — hire is confirmed with a safety deposit." />
      <Card className="space-y-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Shop</p>
          <p className="text-lg font-semibold">{settings?.name ?? "Satis"}</p>
        </div>
        {settings?.phone ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Phone</p>
            <a className="text-teal hover:underline" href={`tel:${settings.phone}`}>
              {settings.phone}
            </a>
          </div>
        ) : null}
        {settings?.address ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Address</p>
            <p>{settings.address}</p>
          </div>
        ) : null}
        {settings?.aboutText ? <p className="text-muted">{settings.aboutText}</p> : null}
        <ol className="list-decimal space-y-2 pl-5 text-muted">
          <li>Browse Occasional or Bridesmaid and open a dress you like.</li>
          <li>Check your dates and send an enquiry with your phone number.</li>
          <li>We call you to arrange a fitting and confirm availability.</li>
          <li>Pay the rental and leave a safety deposit when you pick up.</li>
          <li>Return the dress on time — deposit is returned if condition is good.</li>
        </ol>
      </Card>
    </div>
  );
}
