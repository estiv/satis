import { prisma } from "@/lib/prisma";
import { COMPANY_SETTINGS_ID } from "@/core/app-version";
import { ShopShell } from "@/components/shop-shell";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.companySettings.findUnique({ where: { id: COMPANY_SETTINGS_ID } });
  return (
    <ShopShell shopName={settings?.name} phone={settings?.phone}>
      {children}
    </ShopShell>
  );
}
