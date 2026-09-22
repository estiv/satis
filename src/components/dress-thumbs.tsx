type DressThumb = {
  id: string;
  name: string;
  photoPath: string | null;
};

export function DressThumbs({
  dresses,
  size = "md",
}: {
  dresses: DressThumb[];
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-12 w-9" : "h-14 w-11";
  if (dresses.length === 0) return null;

  return (
    <div className="flex shrink-0 -space-x-2">
      {dresses.slice(0, 3).map((d) => (
        <div key={d.id} className="group relative z-0 hover:z-30" title={d.name}>
          <div className={`${box} overflow-hidden rounded-md border border-line bg-line/40 shadow-sm`}>
            {d.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/dresses/${d.id}/photo`}
                alt={d.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[9px] text-muted">—</div>
            )}
          </div>
          {d.photoPath ? (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 group-hover:block">
              <div className="overflow-hidden rounded-xl border border-line bg-card shadow-xl ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/dresses/${d.id}/photo`}
                  alt={d.name}
                  className="h-56 w-40 object-cover"
                />
                <p className="max-w-40 truncate px-2 py-1.5 text-center text-xs font-medium">{d.name}</p>
              </div>
            </div>
          ) : null}
        </div>
      ))}
      {dresses.length > 3 ? (
        <div
          className={`flex ${box} items-center justify-center rounded-md border border-line bg-card text-[10px] font-semibold text-muted`}
        >
          +{dresses.length - 3}
        </div>
      ) : null}
    </div>
  );
}
