# Satis dress rental

Public shop for **occasional** and **bridesmaid** dress hire, plus a staff back office for inventory, bookings, deposits, and follow-ups.

Built on the same platform pattern as Hundaf Operations (Next.js App Router, Prisma + SQLite, JWT staff login, module registry, in-place upgrades, PWA).

## Quick start

```bash
cd D:\satis
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the **public shop** (no login).

Staff: [http://localhost:3000/login](http://localhost:3000/login)

| User | Password |
| --- | --- |
| `admin@satis.local` | `admin123` |
| `staff@satis.local` | `staff123` |

## What visitors see

- Home, Occasional, Bridesmaid galleries
- Dress detail, date check, enquire form
- Contact / how to rent
- Footer **Staff** link only

## What staff see (`/app`)

- Dashboard: booked qty, rental totals, deposits held, follow-ups
- Dresses: add/edit photos, qty, price, deposit, public listing
- Bookings: multi-line hire with availability and deposits
- Customers, users, settings, system/upgrades

## Phone home screen

Open the shop URL on iOS/Android → **Add to Home Screen**. The PWA starts at `/` (the shop), not login.

## Upgrade

See [docs/UPGRADE.md](docs/UPGRADE.md).
