import { type HTMLAttributes } from "react";

import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/cn";

const infoChipVariants = cva("inline-flex w-fit items-center bg-neutral-2", {
  variants: {
    size: {
      default:
        "h-7 min-w-7 gap-2 px-2 typography-text-3 [&_svg:not([class*='size-'])]:size-4",
      small:
        "h-6 min-w-6 gap-1 px-1 typography-text-4 [&_svg:not([class*='size-'])]:size-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function InfoChip({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof infoChipVariants>) {
  return (
    <span
      data-slot="info-chip"
      className={cn(infoChipVariants({ size, className }))}
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

export { InfoChip, InfoChipLeadingIcon, infoChipVariants };
