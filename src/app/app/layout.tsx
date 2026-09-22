import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { COMPANY_SETTINGS_ID } from "@/core/app-version";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const settings = await prisma.companySettings.findUnique({ where: { id: COMPANY_SETTINGS_ID } });
  let enabled: string[] | undefined;
  try {
    const parsed = JSON.parse(settings?.enabledModules || "[]");
    if (Array.isArray(parsed)) enabled = parsed.map(String);
  } catch {
    enabled = undefined;
  }
  return (
    <AppShell user={user} enabledModules={enabled}>
      {children}
    </AppShell>
  );
}
