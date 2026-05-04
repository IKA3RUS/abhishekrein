import React from "react";

import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  name: string;
  color: string;
  image: string;
};

export const CursorChip = React.forwardRef<HTMLDivElement, Props>(
  ({ name, color, image, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-md",
        className,
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center" style={{ color }}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <path d="M0 0L10 7L6 7L7 14L4 14L3 7L0 7Z" />
        </svg>
      </div>

      <img
        src={image}
        className="size-5 rounded-full object-cover"
        alt={name}
      />

      <span className="typography-text-3 whitespace-nowrap">{name}</span>
    </div>
  ),
);
