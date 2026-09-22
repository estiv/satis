import { APP_VERSION, SCHEMA_VERSION, COMPANY_SETTINGS_ID, COMPANY_DEFAULT } from "./app-version";
import { prisma } from "../lib/prisma";

/**
 * Sequential data upgrades. Add the next integer key when a release must
 * transform existing rows. Prisma migrations handle new columns/tables.
 */
const upgrades: Record<number, () => Promise<string>> = {
  1: async () => {
    await prisma.companySettings.upsert({
      where: { id: COMPANY_SETTINGS_ID },
      update: {},
      create: {
        id: COMPANY_SETTINGS_ID,
        name: COMPANY_DEFAULT,
        aboutText:
          "Occasional and bridesmaid dress rental. Visit us for fittings, hire, and safe return.",
        currency: "ETB",
      },
    });
    await prisma.schemaMeta.upsert({
      where: { id: "singleton" },
      update: { version: 1 },
      create: { id: "singleton", version: 1 },
    });
    return "Baseline Satis shop settings";
  },
};

export async function applyUpgrades() {
  const meta = await prisma.schemaMeta.findUnique({ where: { id: "singleton" } });
  let current = meta?.version ?? 0;
  const notes: string[] = [];

  while (current < SCHEMA_VERSION) {
    const next = current + 1;
    const fn = upgrades[next];
    if (!fn) {
      notes.push(`Missing upgrade handler for schema ${next}`);
      break;
    }
    const note = await fn();
    await prisma.schemaMeta.upsert({
      where: { id: "singleton" },
      update: { version: next },
      create: { id: "singleton", version: next },
    });
    await prisma.appUpgrade.create({
      data: {
        fromVersion: String(current),
        toVersion: String(next),
        notes: note,
      },
    });
    notes.push(`${current} → ${next}: ${note}`);
    current = next;
  }

  if (notes.length === 0) {
    notes.push(`Already at schema ${SCHEMA_VERSION} (app ${APP_VERSION})`);
  }
  return { version: current, notes };
}

if (require.main === module) {
  applyUpgrades()
    .then((r) => {
      console.log(r.notes.join("\n"));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
