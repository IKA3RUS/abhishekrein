import { type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

function InfoChip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="info-chip"
      className={cn(
        "inline-flex h-6 w-fit min-w-6 items-center gap-2 bg-neutral-2 px-2 typography-text-3 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InfoChipLeadingIcon({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="leading-icon"
      className={cn("inline-flex shrink-0 items-center", className)}
      {...props}
    />
  );
}

export { InfoChip, InfoChipLeadingIcon };
