import Link from "next/link";
import { APP_NAME } from "@/core/app-version";
import { CompanyLogo } from "./company-logo";

export function ShopShell({
  shopName,
  phone,
  children,
}: {
  shopName?: string;
  phone?: string | null;
  children: React.ReactNode;
}) {
  const name = shopName || APP_NAME;
  return (
    <div className="min-h-full bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <CompanyLogo heightClass="h-10" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Dress rental</p>
              <p className="text-lg font-semibold leading-tight">{name}</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm sm:gap-3">
            <Link href="/occasional" className="rounded-lg px-2 py-1.5 hover:bg-teal/10 hover:text-teal">
              Occasional
            </Link>
            <Link href="/bridesmaid" className="rounded-lg px-2 py-1.5 hover:bg-teal/10 hover:text-teal">
              Bridesmaid
            </Link>
            <Link href="/contact" className="rounded-lg px-2 py-1.5 hover:bg-teal/10 hover:text-teal">
              Contact
            </Link>
            {phone ? (
              <a href={`tel:${phone}`} className="hidden rounded-lg bg-teal-dark px-3 py-1.5 font-semibold text-white sm:inline">
                Call
              </a>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold text-ink">{name}</p>
            <p>Occasional &amp; bridesmaid dress rental</p>
            {phone ? <p className="mt-1">{phone}</p> : null}
          </div>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-teal">
              How to rent
            </Link>
            <Link href="/login" className="hover:text-teal">
              Staff
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
