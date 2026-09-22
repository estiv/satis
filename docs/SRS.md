# Satis — Software Requirements (v1)

## Goals

1. Public website for occasional and bridesmaid dress rental (no customer login).
2. Staff back office to manage catalog, bookings, deposits, and follow-ups.
3. Upgradeable in place (modules + schema version), same idea as Hundaf.
4. Phone access via the same URL / PWA home-screen icon (opens the shop).

## Public

- Browse Occasional and Bridesmaid thumbnail lists
- Dress detail with rental price and default deposit hint
- Check date availability (qty only, no other customer names)
- Enquire → creates INQUIRY booking for staff follow-up

## Staff

- CRUD dresses (photo, category, qty, rental price, deposit, listedPublic)
- Customers
- Bookings with lines (qty, unit rental, unit deposit), date overlap availability
- Status pipeline and follow-up date/note
- Dashboard totals: booked dresses, rental money, deposits held

## Non-goals (v1)

- Customer accounts / online payment
- Native App Store / Play Store apps
