# Upgrade runbook

Use this whenever Satis is updated. The app is built so you can add modules, fields, and screens without rebuilding from scratch.

## A. Install a new version (code drop)

```bash
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run upgrade
npm run build
npm start
```

Or during development: `npm run dev` (upgrades also run when the Node server starts).

The System page (`/app/admin/system`) shows **app version**, **schema version**, and a log of upgrades already applied.

## B. Add a new feature (developers)

1. Create or extend models in `prisma/schema.prisma`.
2. `npx prisma migrate dev --name short_description` (or `db push` for MVP).
3. Put business logic in `src/modules/<feature>/`.
4. Register navigation and roles in `src/core/modules.ts`.
5. Add pages under `src/app/(app)/` (staff) or `src/app/(shop)/` (public).
6. If old rows need new values, add the next function in `src/core/upgrade.ts` and increment `SCHEMA_VERSION`.
7. Set `APP_VERSION` in `src/core/app-version.ts` and write `CHANGELOG.md`.

## C. Turn a module off without deleting it

Admin → Settings → enabled modules (JSON list of module ids). Empty list means all modules.

## D. Rotate the login secret

Set a new `AUTH_SECRET` in `.env` and restart. Staff must log in again. Do not commit `.env`.
