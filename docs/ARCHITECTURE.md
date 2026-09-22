# Architecture

**Product:** Satis dress rental 1.0.0  
**Goal:** public shop + staff ops, upgradeable in place.

## Context

```
Visitor browser ──► Public shop (/) ──► SQLite (dresses, enquiries)
Staff browser   ──► /login → /app/* ──► same DB (bookings, deposits)
Phone PWA       ──► start_url / (shop)
```

## Stack

| Layer | Choice |
| --- | --- |
| Web | Next.js App Router + TypeScript |
| UI | Tailwind CSS 4 |
| Auth | JWT httpOnly cookie (staff only) |
| Data | Prisma + SQLite |
| Phone | PWA manifest → public shop |

## Folders

```
src/core/       version, modules, money, upgrades
src/lib/        prisma, auth, audit, uploads
src/modules/    dresses, bookings, customers, enquire, users
src/app/(shop)/ public pages
src/app/(app)/  staff pages
src/proxy.ts    gate /app/* only
```
