export function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export function num(fd: FormData, key: string) {
  const n = Number(str(fd, key).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function opt(fd: FormData, key: string) {
  const v = str(fd, key);
  return v.length ? v : undefined;
}

export function bool(fd: FormData, key: string) {
  const v = str(fd, key).toLowerCase();
  return v === "on" || v === "true" || v === "1" || v === "yes";
}

export type ActionState = { ok?: boolean; error?: string; id?: string };
