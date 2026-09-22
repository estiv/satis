import Link from "next/link";
import { logoutAction } from "@/modules/auth/actions";
import { modulesForRole, PRIMARY_MOBILE, type ModuleDef } from "@/core/modules";
import type { SessionUser } from "@/lib/auth";
import { APP_NAME } from "@/core/app-version";
import { clsx } from "./clsx";
import { CompanyLogo } from "./company-logo";

function Icon({ name }: { name: string }) {
  const common = "h-5 w-5";
  switch (name) {
    case "home":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="1.8" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "dress":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="1.8" d="M12 3c-2 3.5-5.5 5.5-5.5 10a5.5 5.5 0 0 0 11 0C17.5 8.5 14 6.5 12 3zM9 20h6" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="1.8" d="M5 5h14v14H5zM5 9h14M9 3v4M15 3v4" />
        </svg>
      );
    case "staff":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="1.8" d="M12 12a3.5 3.5 0 1 0-0.01-7 3.5 3.5 0 0 0 0.01 7zM5 20c.6-3.2 3.4-5 7-5s6.4 1.8 7 5" />
        </svg>
      );
    case "users":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="1.8" d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c.5-2.5 2.5-4 5-4s4.5 1.5 5 4M13 20c.4-2 1.8-3.2 3.5-3.5 1.8.2 3.2 1.4 3.5 3.5" />
        </svg>
      );
    case "cog":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
          <path strokeWidth="1.8" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      );
    case "cpu":
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="7" y="7" width="10" height="10" rx="1" strokeWidth="1.8" />
          <path strokeWidth="1.8" d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="1.8" />
        </svg>
      );
  }
}

export function AppShell({
  user,
  enabledModules,
  children,
}: {
  user: SessionUser;
  enabledModules?: string[];
  children: React.ReactNode;
}) {
  const mods = modulesForRole(user.role, enabledModules);
  const primaryIds = PRIMARY_MOBILE[user.role];
  const primary = primaryIds
    .map((id) => mods.find((m) => m.id === id))
    .filter(Boolean) as ModuleDef[];

  return (
    <div className="min-h-full bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-teal-dark text-white lg:flex lg:flex-col">
        <div className="px-5 py-5">
          <div className="rounded-lg bg-white p-2">
            <CompanyLogo className="mx-auto" heightClass="h-14" />
          </div>
          <p className="mt-3 text-lg font-semibold">{APP_NAME} Staff</p>
          <Link href="/" className="mt-1 block text-xs text-white/70 hover:text-white">
            View public shop →
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {mods.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white"
            >
              <Icon name={m.icon} />
              {m.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="border-t border-white/15 p-4">
          <p className="truncate text-sm">{user.name}</p>
          <p className="text-xs text-white/60">{user.role.toLowerCase()}</p>
          <button
            className="mt-2 inline-flex h-7 items-center rounded-md border border-white/20 px-2.5 text-[11px] font-semibold tracking-wide text-brass-soft transition-colors hover:bg-white/10"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <CompanyLogo heightClass="h-9" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Staff</p>
            <p className="font-semibold">{APP_NAME}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            className="inline-flex h-7 items-center rounded-md border border-line px-2.5 text-[11px] font-semibold tracking-wide text-teal-dark transition-colors hover:bg-teal/20"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="pb-24 lg:ml-60 lg:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card lg:hidden">
        {primary.slice(0, 4).map((m) => (
          <Link
            key={m.id}
            href={m.href}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted"
          >
            <Icon name={m.icon} />
            {m.label.split(" ")[0]}
          </Link>
        ))}
        <details className="relative">
          <summary className={clsx("flex cursor-pointer list-none flex-col items-center gap-0.5 py-2 text-[11px] text-muted")}>
            <Icon name="cog" />
            More
          </summary>
          <div className="absolute bottom-14 right-2 w-56 rounded-xl border border-line bg-card p-2 shadow-lg">
            {mods.map((m) => (
              <Link key={m.id} href={m.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-paper">
                {m.label}
              </Link>
            ))}
            <Link href="/" className="block rounded-lg px-3 py-2 text-sm hover:bg-paper">
              Public shop
            </Link>
          </div>
        </details>
      </nav>
    </div>
  );
}
