import type { ActionState } from "@/lib/form";
import { clsx } from "./clsx";

export { clsx };

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const control =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink shadow-none outline-none focus:border-teal min-h-11";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(control, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(control, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(control, "min-h-24", props.className)} />;
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "xs";

const btnBase =
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/35 focus-visible:ring-offset-1 active:scale-[0.98]";

const btnVariant: Record<ButtonVariant, string> = {
  primary: "bg-teal text-ink shadow-sm shadow-teal/30 hover:bg-teal-dark hover:text-white hover:shadow",
  secondary: "border border-line bg-white text-ink shadow-sm hover:border-teal/50 hover:bg-teal/[0.12]",
  ghost: "bg-transparent text-teal-dark hover:bg-teal/20",
  danger: "border border-red-200/90 bg-red-50 text-bad shadow-sm hover:border-red-300 hover:bg-red-100",
};

const btnSize: Record<ButtonSize, string> = {
  sm: "h-8 min-h-8 px-2.5 text-xs",
  xs: "h-7 min-h-7 px-2 text-[11px]",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "sm",
  className?: string,
) {
  return clsx(btnBase, btnVariant[variant], btnSize[size], className);
}

export function chipClass(active: boolean, className?: string) {
  return clsx(
    "inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold tracking-wide transition-colors",
    active ? "border-teal-dark bg-teal/35 text-teal-dark shadow-sm" : "border-line bg-white text-ink hover:border-teal/50 hover:bg-teal/[0.12]",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "sm",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border border-line bg-card p-4 sm:p-5", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "bad" | "warn" | "teal";
}) {
  const map = {
    neutral: "bg-line/60 text-ink",
    good: "bg-green-100 text-good",
    bad: "bg-red-100 text-bad",
    warn: "bg-amber-100 text-warn",
    teal: "bg-teal/40 text-teal-dark",
  }[tone];
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", map)}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function FormError({ state }: { state?: ActionState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bad" role="alert">
      {state.error}
    </p>
  );
}

export function FormOk({ state, message }: { state?: ActionState; message: string }) {
  if (!state?.ok) return null;
  return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-good">{message}</p>;
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const color =
    tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={clsx("mt-2 text-xl font-semibold num", color)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted">{children}</p>;
}
