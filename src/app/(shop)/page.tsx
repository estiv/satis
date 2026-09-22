import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { COMPANY_SETTINGS_ID } from "@/core/app-version";
import { buttonClass, Card } from "@/components/ui";
import { DressGrid } from "@/components/dress-card";

export default async function HomePage() {
  const [settings, occasional, bridesmaid] = await Promise.all([
    prisma.companySettings.findUnique({ where: { id: COMPANY_SETTINGS_ID } }),
    prisma.dress.findMany({
      where: { deletedAt: null, listedPublic: true, category: "OCCASIONAL" },
      orderBy: { name: "asc" },
      take: 4,
    }),
    prisma.dress.findMany({
      where: { deletedAt: null, listedPublic: true, category: "BRIDESMAID" },
      orderBy: { name: "asc" },
      take: 4,
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-line bg-gradient-to-br from-teal/10 via-card to-brass-soft/40 px-6 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-dark">Dress rental</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {settings?.name ?? "Satis"} — occasional &amp; bridesmaid dresses
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          {settings?.aboutText ||
            "Browse our collection, check availability for your dates, and send an enquiry. We confirm fittings and safety deposits with you in person."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/occasional" className={buttonClass("primary", "sm", "min-h-11 px-4")}>
            Occasional dresses
          </Link>
          <Link href="/bridesmaid" className={buttonClass("secondary", "sm", "min-h-11 px-4")}>
            Bridesmaid dresses
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/occasional" className="block">
          <Card className="h-full transition hover:border-teal/40">
            <p className="text-xs uppercase tracking-wide text-muted">Collection</p>
            <h2 className="mt-1 text-2xl font-semibold">Occasional</h2>
            <p className="mt-2 text-sm text-muted">Evening, cocktail, and celebration wear.</p>
          </Card>
        </Link>
        <Link href="/bridesmaid" className="block">
          <Card className="h-full transition hover:border-teal/40">
            <p className="text-xs uppercase tracking-wide text-muted">Collection</p>
            <h2 className="mt-1 text-2xl font-semibold">Bridesmaid</h2>
            <p className="mt-2 text-sm text-muted">Coordinated looks for the bridal party.</p>
          </Card>
        </Link>
      </div>

      {occasional.length ? (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Occasional picks</h2>
            <Link href="/occasional" className="text-sm text-teal hover:underline">
              See all
            </Link>
          </div>
          <DressGrid dresses={occasional} hrefPrefix="/dresses" />
        </section>
      ) : null}

      {bridesmaid.length ? (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Bridesmaid picks</h2>
            <Link href="/bridesmaid" className="text-sm text-teal hover:underline">
              See all
            </Link>
          </div>
          <DressGrid dresses={bridesmaid} hrefPrefix="/dresses" />
        </section>
      ) : null}
    </div>
  );
}
