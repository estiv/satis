import { clsx } from "./clsx";

export function CompanyLogo({
  className,
  heightClass = "h-12",
}: {
  className?: string;
  heightClass?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Satis Rental"
      className={clsx(heightClass, "w-auto object-contain", className)}
    />
  );
}
