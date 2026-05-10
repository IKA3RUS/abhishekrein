import ArrowForwardIcon from "@material-symbols/svg-700/sharp/arrow_forward.svg?react";

export function RealResults({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose mx-auto my-18 grid max-w-172.5 grid-cols-1 gap-2 md:grid-cols-2">
      {children}
    </div>
  );
}

export function RealResult({
  stat,
  theme,
  title,
  description,
  before,
  after,
}: {
  stat: string;
  theme: string;
  title: string;
  description?: string;
  before?: string;
  after?: string;
}) {
  const match = stat.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const number = match?.[1] ?? stat;
  const unit = match?.[2] ?? "";

  return (
    <div className="group flex flex-col gap-4 bg-neutral-1 p-8 pt-6 first:bg-green-7">
      <p className="flex items-start justify-start typography-display-4 leading-none font-medium text-neutral-11 group-first:text-white">
        <span>{number}</span>
        <span className="text-[2rem] font-black">{unit}</span>
      </p>
      <p className="typography-text-2 text-neutral-11">{title}</p>
      {description && (
        <p className="-mt-3 flex items-center gap-1 typography-text-4 text-neutral-11 uppercase opacity-40">
          {description}
        </p>
      )}
      {before && after && (
        <p className="flex items-center gap-1 typography-text-2 text-neutral-11 opacity-40">
          {before}
          <ArrowForwardIcon className="size-4" />
          {after}
        </p>
      )}
      <p className="mt-auto typography-head-6 text-neutral-11">{theme}</p>
    </div>
  );
}
