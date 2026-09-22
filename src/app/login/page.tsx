import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginAction } from "@/modules/auth/actions";
import { Button, Field, Input } from "@/components/ui";
import { CompanyLogo } from "@/components/company-logo";
import { APP_NAME } from "@/core/app-version";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/app/dashboard");
  const sp = await searchParams;
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
        <CompanyLogo heightClass="h-20" className="mx-auto" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-teal-dark">Staff only</p>
        <h1 className="mt-2 text-2xl font-semibold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to manage dresses, bookings, deposits, and follow-ups.
        </p>
        <form action={loginAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="next" value={sp.next || "/app/dashboard"} />
          <Field label="Email">
            <Input name="email" type="email" autoComplete="username" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          {sp.error ? <p className="text-sm text-bad">{sp.error}</p> : null}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/" className="text-teal hover:underline">
            ← Back to shop
          </Link>
        </p>
      </div>
    </div>
  );
}
