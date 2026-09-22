import type { Role } from "@prisma/client";

export type ModuleDef = {
  id: string;
  label: string;
  href: string;
  roles: Role[];
  group: "work" | "admin";
  icon: string;
};

export const MODULES: ModuleDef[] = [
  {
    id: "dashboard",
    label: "Home",
    href: "/app/dashboard",
    roles: ["ADMIN", "STAFF"],
    group: "work",
    icon: "home",
  },
  {
    id: "dresses",
    label: "Dresses",
    href: "/app/dresses",
    roles: ["ADMIN", "STAFF"],
    group: "work",
    icon: "dress",
  },
  {
    id: "bookings",
    label: "Bookings",
    href: "/app/bookings",
    roles: ["ADMIN", "STAFF"],
    group: "work",
    icon: "calendar",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/app/customers",
    roles: ["ADMIN", "STAFF"],
    group: "work",
    icon: "staff",
  },
  {
    id: "users",
    label: "Users",
    href: "/app/admin/users",
    roles: ["ADMIN"],
    group: "admin",
    icon: "users",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/app/admin/settings",
    roles: ["ADMIN"],
    group: "admin",
    icon: "cog",
  },
  {
    id: "system",
    label: "System",
    href: "/app/admin/system",
    roles: ["ADMIN"],
    group: "admin",
    icon: "cpu",
  },
];

export function modulesForRole(role: Role, enabledIds?: string[]): ModuleDef[] {
  const enabled =
    !enabledIds || enabledIds.length === 0
      ? MODULES
      : MODULES.filter((m) => m.id === "dashboard" || enabledIds.includes(m.id));
  if (role === "ADMIN") return enabled;
  return enabled.filter((m) => m.roles.includes(role));
}

export const PRIMARY_MOBILE: Record<Role, string[]> = {
  ADMIN: ["dashboard", "dresses", "bookings", "customers"],
  STAFF: ["dashboard", "dresses", "bookings", "customers"],
};
