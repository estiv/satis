import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_VERSION, SCHEMA_VERSION } from "@/core/app-version";
import { applyUpgrades } from "@/core/upgrade";
import { Card, PageHeader } from "@/components/ui";
import { MODULES } from "@/core/modules";

export default async function SystemPage() {
  await requireUser(["ADMIN"]);
  const result = await applyUpgrades();
  const meta = await prisma.schemaMeta.findUnique({ where: { id: "singleton" } });
  const log = await prisma.appUpgrade.findMany({ orderBy: { ranAt: "desc" }, take: 20 });
  return (
    <div>
      <PageHeader
        title="System"
        subtitle="Version and upgrade log. Add features later without a rewrite — see docs/UPGRADE.md."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">App version</p>
          <p className="mt-1 text-xl font-semibold">{APP_VERSION}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Schema version</p>
          <p className="mt-1 text-xl font-semibold">
            {meta?.version ?? 0} / {SCHEMA_VERSION}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Registered modules</p>
          <p className="mt-1 text-xl font-semibold">{MODULES.length}</p>
        </Card>
      </div>
      {result.notes.length ? (
        <Card className="mt-4">
          <h2 className="font-semibold">Last upgrade run</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            {result.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card className="mt-4">
        <h2 className="font-semibold">Upgrade history</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {log.length === 0 ? <li className="text-muted">None yet.</li> : null}
          {log.map((u) => (
            <li key={u.id}>
              {u.ranAt.toISOString().slice(0, 19).replace("T", " ")} · {u.fromVersion} → {u.toVersion}
              {u.notes ? ` · ${u.notes}` : ""}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
