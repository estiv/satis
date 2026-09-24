import type { BookingStatus, DressCategory, Role } from "@prisma/client";

export const ROLES: Record<Role, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

export const DRESS_CATEGORIES: Record<DressCategory, string> = {
  OCCASIONAL: "Occasional",
  BRIDESMAID: "Bridesmaid",
};

/** Every size a dress unit can be assigned. Quantity decides how many of these can be chosen. */
export const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export function parseDressSizes(size: string | null | undefined) {
  if (!size) return [];
  return size
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatDressSizes(size: string | null | undefined) {
  return parseDressSizes(size).join(", ");
}

export const BOOKING_STATUSES: Record<BookingStatus, string> = {
  INQUIRY: "Inquiry",
  CONFIRMED: "Confirmed",
  PICKED_UP: "Picked up",
  RETURNED: "Returned",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

/** Statuses that hold inventory for a date range. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "INQUIRY",
  "CONFIRMED",
  "PICKED_UP",
  "OVERDUE",
];

export function isoDate(d?: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function parseDate(raw: string): Date | null {
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
