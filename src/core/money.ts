import { Prisma } from "@prisma/client";

export function money(value: Prisma.Decimal | number | string | null | undefined, currency = "ETB") {
  return `${amount(value)} ${currency}`;
}

export function amount(value: Prisma.Decimal | number | string | null | undefined) {
  const n = value == null ? 0 : Number(value);
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function num(value: unknown) {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function dec(n: number) {
  return new Prisma.Decimal(Number.isFinite(n) ? n.toFixed(4) : "0");
}
