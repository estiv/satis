import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";
import { COMPANY_SETTINGS_ID, COMPANY_DEFAULT } from "../src/core/app-version";
import { dec } from "../src/core/money";

const SAMPLE_DIR = path.join(process.cwd(), "prisma", "sample-images");
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "dresses");

type DressSeed = {
  key: string;
  name: string;
  category: "OCCASIONAL" | "BRIDESMAID";
  size: string;
  color: string;
  qtyTotal: number;
  rentalPrice: number;
  depositAmount: number;
  notes: string;
  image: string;
};

const DRESSES: DressSeed[] = [
  {
    key: "rose-evening",
    name: "Rose Evening Gown",
    category: "OCCASIONAL",
    size: "M",
    color: "Rose gold",
    qtyTotal: 2,
    rentalPrice: 2500,
    depositAmount: 1000,
    notes: "Floor-length evening wear for galas and dinners.",
    image: "dress-rose-evening.png",
  },
  {
    key: "navy-cocktail",
    name: "Navy Cocktail Dress",
    category: "OCCASIONAL",
    size: "S",
    color: "Navy",
    qtyTotal: 3,
    rentalPrice: 1800,
    depositAmount: 800,
    notes: "Knee-length cocktail style for parties and dinners.",
    image: "dress-navy-cocktail.png",
  },
  {
    key: "black-evening",
    name: "Black Formal Gown",
    category: "OCCASIONAL",
    size: "L",
    color: "Black",
    qtyTotal: 2,
    rentalPrice: 2800,
    depositAmount: 1200,
    notes: "Classic black evening gown with soft shimmer.",
    image: "dress-black-evening.png",
  },
  {
    key: "champagne-midi",
    name: "Champagne Occasion Midi",
    category: "OCCASIONAL",
    size: "M",
    color: "Champagne",
    qtyTotal: 2,
    rentalPrice: 2100,
    depositAmount: 900,
    notes: "Elegant midi for weddings and celebrations as a guest.",
    image: "dress-champagne-midi.png",
  },
  {
    key: "burgundy-cocktail",
    name: "Burgundy Cocktail Dress",
    category: "OCCASIONAL",
    size: "S",
    color: "Burgundy",
    qtyTotal: 2,
    rentalPrice: 1900,
    depositAmount: 850,
    notes: "Wine-red cocktail dress for evening events.",
    image: "dress-burgundy-cocktail.png",
  },
  {
    key: "blush-bridesmaid",
    name: "Blush Bridesmaid A-line",
    category: "BRIDESMAID",
    size: "M",
    color: "Blush",
    qtyTotal: 4,
    rentalPrice: 2200,
    depositAmount: 1000,
    notes: "Soft A-line for bridal party fittings.",
    image: "dress-blush-bridesmaid.png",
  },
  {
    key: "sage-bridesmaid",
    name: "Sage Bridesmaid Midi",
    category: "BRIDESMAID",
    size: "L",
    color: "Sage",
    qtyTotal: 3,
    rentalPrice: 2000,
    depositAmount: 900,
    notes: "Midi length sage green for coordinated bridal parties.",
    image: "dress-sage-bridesmaid.png",
  },
  {
    key: "dusty-blue-bridesmaid",
    name: "Dusty Blue Bridesmaid",
    category: "BRIDESMAID",
    size: "M",
    color: "Dusty blue",
    qtyTotal: 4,
    rentalPrice: 2300,
    depositAmount: 1000,
    notes: "Floor-length dusty blue A-line for weddings.",
    image: "dress-dusty-blue-bridesmaid.png",
  },
];

async function attachPhoto(dressId: string, imageFile: string) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const destName = `${dressId}.png`;
  await copyFile(path.join(SAMPLE_DIR, imageFile), path.join(UPLOAD_DIR, destName));
  return `dresses/${destName}`;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  await prisma.companySettings.upsert({
    where: { id: COMPANY_SETTINGS_ID },
    update: {
      name: COMPANY_DEFAULT,
      phone: "+251 911 234 567",
      address: "Bole, Addis Ababa",
      aboutText:
        "Satis rents beautiful occasional and bridesmaid dresses. Browse the collection, check dates, and enquire — we will confirm fittings and deposits with you.",
      currency: "ETB",
      defaultDeposit: dec(500),
    },
    create: {
      id: COMPANY_SETTINGS_ID,
      name: COMPANY_DEFAULT,
      phone: "+251 911 234 567",
      address: "Bole, Addis Ababa",
      aboutText:
        "Satis rents beautiful occasional and bridesmaid dresses. Browse the collection, check dates, and enquire — we will confirm fittings and deposits with you.",
      currency: "ETB",
      defaultDeposit: dec(500),
    },
  });

  await prisma.schemaMeta.upsert({
    where: { id: "singleton" },
    update: { version: 1 },
    create: { id: "singleton", version: 1 },
  });

  const passwordHash = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@satis.local" },
    update: { passwordHash, name: "Satis Admin", role: "ADMIN", active: true },
    create: {
      email: "admin@satis.local",
      name: "Satis Admin",
      role: "ADMIN",
      passwordHash,
      active: true,
    },
  });

  const staffHash = await hashPassword("staff123");
  await prisma.user.upsert({
    where: { email: "staff@satis.local" },
    update: { passwordHash: staffHash, name: "Shop Staff", role: "STAFF", active: true },
    create: {
      email: "staff@satis.local",
      name: "Shop Staff",
      role: "STAFF",
      passwordHash: staffHash,
      active: true,
    },
  });

  // Soft-delete old sample dresses without photos so we can rebuild a clean catalog
  const existing = await prisma.dress.findMany({ where: { deletedAt: null } });
  const byName = new Map(existing.map((d) => [d.name, d]));

  const dressIds: Record<string, string> = {};
  for (const item of DRESSES) {
    const prev = byName.get(item.name);
    let id = prev?.id;
    if (id) {
      await prisma.dress.update({
        where: { id },
        data: {
          category: item.category,
          size: item.size,
          color: item.color,
          qtyTotal: item.qtyTotal,
          rentalPrice: dec(item.rentalPrice),
          depositAmount: dec(item.depositAmount),
          notes: item.notes,
          listedPublic: true,
          deletedAt: null,
        },
      });
    } else {
      const created = await prisma.dress.create({
        data: {
          name: item.name,
          category: item.category,
          size: item.size,
          color: item.color,
          qtyTotal: item.qtyTotal,
          rentalPrice: dec(item.rentalPrice),
          depositAmount: dec(item.depositAmount),
          notes: item.notes,
          listedPublic: true,
        },
      });
      id = created.id;
    }
    const photoPath = await attachPhoto(id, item.image);
    await prisma.dress.update({ where: { id }, data: { photoPath } });
    dressIds[item.key] = id;
  }

  const customers = [
    { name: "Hanna Bekele", phone: "0911 222 333", notes: "Prefers evening fittings" },
    { name: "Sara Tadesse", phone: "0912 444 555", notes: "Bridal party of 4" },
    { name: "Marta Alemu", phone: "0913 666 777", notes: null },
  ];
  const customerIds: string[] = [];
  for (const c of customers) {
    const found = await prisma.customer.findFirst({
      where: { name: c.name, deletedAt: null },
    });
    if (found) {
      await prisma.customer.update({
        where: { id: found.id },
        data: { phone: c.phone, notes: c.notes },
      });
      customerIds.push(found.id);
    } else {
      const created = await prisma.customer.create({ data: c });
      customerIds.push(created.id);
    }
  }

  const sampleBookingCount = await prisma.booking.count({
    where: { notes: "SAMPLE_SEED" },
  });
  if (sampleBookingCount === 0) {
    const event1 = daysFromNow(14);
    const pickup1 = daysFromNow(12);
    const return1 = daysFromNow(16);
    await prisma.booking.create({
      data: {
        customerId: customerIds[0],
        eventDate: event1,
        pickupDate: pickup1,
        returnDate: return1,
        status: "CONFIRMED",
        source: "STAFF",
        followUpDate: daysFromNow(0),
        followUpNote: "Remind about fitting tomorrow",
        rentalTotal: dec(2500),
        depositTotal: dec(1000),
        depositHeld: true,
        moneyNotes: "Deposit received in cash",
        notes: "SAMPLE_SEED",
        createdById: admin.id,
        lines: {
          create: [
            {
              dressId: dressIds["rose-evening"],
              qty: 1,
              unitRental: dec(2500),
              unitDeposit: dec(1000),
            },
          ],
        },
      },
    });

    const event2 = daysFromNow(21);
    await prisma.booking.create({
      data: {
        customerId: customerIds[1],
        eventDate: event2,
        pickupDate: daysFromNow(19),
        returnDate: daysFromNow(23),
        status: "INQUIRY",
        source: "WEB_ENQUIRE",
        followUpDate: daysFromNow(0),
        followUpNote: "Call to confirm bridesmaid sizes",
        rentalTotal: dec(6400),
        depositTotal: dec(2900),
        depositHeld: false,
        notes: "SAMPLE_SEED",
        createdById: admin.id,
        lines: {
          create: [
            {
              dressId: dressIds["blush-bridesmaid"],
              qty: 2,
              unitRental: dec(2200),
              unitDeposit: dec(1000),
            },
            {
              dressId: dressIds["sage-bridesmaid"],
              qty: 1,
              unitRental: dec(2000),
              unitDeposit: dec(900),
            },
          ],
        },
      },
    });

    const event3 = daysFromNow(7);
    await prisma.booking.create({
      data: {
        customerId: customerIds[2],
        eventDate: event3,
        pickupDate: daysFromNow(5),
        returnDate: daysFromNow(8),
        status: "PICKED_UP",
        source: "STAFF",
        followUpDate: daysFromNow(1),
        followUpNote: "Return reminder",
        rentalTotal: dec(1800),
        depositTotal: dec(800),
        depositHeld: true,
        moneyNotes: "Rental paid; deposit held",
        notes: "SAMPLE_SEED",
        createdById: admin.id,
        lines: {
          create: [
            {
              dressId: dressIds["navy-cocktail"],
              qty: 1,
              unitRental: dec(1800),
              unitDeposit: dec(800),
            },
          ],
        },
      },
    });
  }

  const dressCount = await prisma.dress.count({ where: { deletedAt: null } });
  console.log(`Seeded Satis with ${dressCount} dresses + sample customers/bookings.`);
  console.log("Admin: admin@satis.local / admin123");
  console.log("Staff: staff@satis.local / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
